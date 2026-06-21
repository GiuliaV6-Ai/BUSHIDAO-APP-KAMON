const data = window.KAMON_DATA;
const state = {
  items: data.items,
  query: "",
  kana: "",
  category: "",
  categoryQuery: "",
  sort: "name",
  current: null,
};

const $ = (selector) => document.querySelector(selector);
const els = {
  total: $("#totalCount"),
  result: $("#resultCount"),
  search: $("#searchInput"),
  categorySearch: $("#categorySearchInput"),
  kana: $("#kanaSelect"),
  category: $("#categorySelect"),
  sort: $("#sortSelect"),
  grid: $("#grid"),
  dialog: $("#dialog"),
  close: $("#closeDialog"),
  download: $("#downloadButton"),
  detailCanvas: $("#detailCanvas"),
  detailName: $("#detailName"),
  detailMeta: $("#detailMeta"),
  detailSource: $("#detailSource"),
};

els.total.textContent = data.count.toLocaleString();
const collator = new Intl.Collator("ja");
const spriteImages = new Map();

for (const sprite of data.sprites) {
  const image = new Image();
  image.src = sprite;
  spriteImages.set(sprite, image);
}

function norm(value) {
  return value.normalize("NFKC").toLowerCase().trim();
}

function drawCrest(canvas, item) {
  const image = spriteImages.get(item.sheet);
  const context = canvas.getContext("2d");
  const paint = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, item.x, item.y, data.cell, data.cell, 0, 0, canvas.width, canvas.height);
  };

  if (image.complete && image.naturalWidth > 0) {
    paint();
  } else {
    image.addEventListener("load", paint, { once: true });
  }
}

function fillSelect(select, values, selectedValue = "") {
  select.replaceChildren(new Option("すべて", ""));
  for (const value of values) {
    select.add(new Option(value, value));
  }
  select.value = values.includes(selectedValue) ? selectedValue : "";
}

function renderCategoryOptions() {
  const query = norm(state.categoryQuery);
  const categories = data.categories.filter((category) => !query || norm(category).includes(query));
  fillSelect(els.category, categories, state.category);
  if (state.category && !categories.includes(state.category)) {
    state.category = "";
  }
}

function filter() {
  const query = norm(state.query);
  const categoryQuery = norm(state.categoryQuery);
  const list = state.items
    .filter((item) => {
      const matchesKana = !state.kana || item.kana === state.kana;
      const matchesCategory = !state.category || item.category === state.category;
      const matchesCategoryQuery = !categoryQuery || norm(item.category).includes(categoryQuery);
      const matchesQuery = !query || norm(item.search).includes(query);
      return matchesKana && matchesCategory && matchesCategoryQuery && matchesQuery;
    })
    .sort((a, b) => {
      if (state.sort === "category") {
        return collator.compare(a.category, b.category) || collator.compare(a.name, b.name);
      }
      return collator.compare(a.name, b.name);
    });

  render(list);
}

function render(list) {
  els.result.textContent = `${list.length.toLocaleString()}件`;
  els.grid.replaceChildren();

  const fragment = document.createDocumentFragment();
  for (const item of list.slice(0, 300)) {
    const card = document.createElement("button");
    const canvas = document.createElement("canvas");
    const title = document.createElement("h3");
    const meta = document.createElement("p");

    card.type = "button";
    card.className = "card";
    canvas.className = "crest-canvas";
    canvas.width = data.cell;
    canvas.height = data.cell;
    title.textContent = item.name;
    meta.textContent = `${item.kana} / ${item.category}`;

    card.append(canvas, title, meta);
    card.addEventListener("click", () => openDetail(item));
    fragment.append(card);
    drawCrest(canvas, item);
  }

  els.grid.append(fragment);
}

function openDetail(item) {
  state.current = item;
  drawCrest(els.detailCanvas, item);
  els.detailName.textContent = item.name;
  els.detailMeta.textContent = `${item.kana} / ${item.category}`;
  els.detailSource.textContent = item.source;
  els.dialog.showModal();
}

function safeFileName(value) {
  return (
    value
      .normalize("NFKC")
      .replace(/[\\/:*?"<>|#%&{}$!`@+=]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "kamon"
  );
}

function downloadCurrent() {
  const item = state.current;
  if (!item) return;
  const image = spriteImages.get(item.sheet);
  const run = () => {
    const canvas = document.createElement("canvas");
    canvas.width = data.cell;
    canvas.height = data.cell;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fffdf8";
    context.fillRect(0, 0, data.cell, data.cell);
    context.drawImage(image, item.x, item.y, data.cell, data.cell, 0, 0, data.cell, data.cell);
    canvas.toBlob((blob) => {
      const anchor = document.createElement("a");
      const url = URL.createObjectURL(blob);
      anchor.href = url;
      anchor.download = `${safeFileName(item.name)}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  if (image.complete && image.naturalWidth > 0) {
    run();
  } else {
    image.addEventListener("load", run, { once: true });
  }
}

fillSelect(els.kana, data.kana);
renderCategoryOptions();
els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  filter();
});
els.categorySearch.addEventListener("input", (event) => {
  state.categoryQuery = event.target.value;
  renderCategoryOptions();
  filter();
});
els.kana.addEventListener("change", (event) => {
  state.kana = event.target.value;
  filter();
});
els.category.addEventListener("change", (event) => {
  state.category = event.target.value;
  filter();
});
els.sort.addEventListener("change", (event) => {
  state.sort = event.target.value;
  filter();
});
els.close.addEventListener("click", () => els.dialog.close());
els.download.addEventListener("click", downloadCurrent);
filter();
