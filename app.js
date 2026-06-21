const data = window.KAMON_DATA;
const state = {
  items: data.items,
  query: "",
  kana: "",
  category: "",
  categoryQuery: "",
  sort: "name",
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
  detailName: $("#detailName"),
  detailMeta: $("#detailMeta"),
  detailSource: $("#detailSource"),
  modalCrest: document.querySelector(".modal-crest"),
};

document.documentElement.style.setProperty("--sprite", `url("${data.sprite}")`);
els.total.textContent = data.count.toLocaleString();

const collator = new Intl.Collator("ja");

function norm(value) {
  return value.normalize("NFKC").toLowerCase().trim();
}

function crestStyle(item) {
  return `background-position:-${item.x}px -${item.y}px`;
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
  let list = state.items.filter((item) => {
    const matchesKana = !state.kana || item.kana === state.kana;
    const matchesCategory = !state.category || item.category === state.category;
    const matchesCategoryQuery = !categoryQuery || norm(item.category).includes(categoryQuery);
    const matchesQuery = !query || norm(item.search).includes(query);
    return matchesKana && matchesCategory && matchesCategoryQuery && matchesQuery;
  });

  list.sort((a, b) => {
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
    card.type = "button";
    card.className = "card";
    card.innerHTML = `<div class="crest" style="${crestStyle(item)}"></div><h3>${item.name}</h3><p>${item.kana} / ${item.category}</p>`;
    card.addEventListener("click", () => openDetail(item));
    fragment.append(card);
  }
  els.grid.append(fragment);
}

function openDetail(item) {
  els.modalCrest.setAttribute("style", crestStyle(item));
  els.detailName.textContent = item.name;
  els.detailMeta.textContent = `${item.kana} / ${item.category}`;
  els.detailSource.textContent = item.source;
  els.dialog.showModal();
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
filter();
