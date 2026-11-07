import { initCart, setCatalog } from "./core/cart.js";
import { FEATURED_PER_CATEGORY } from "./core/config.js";
import { loadProducts } from "./core/data.js";
import { fuzzySearch, tokenize } from "./core/search.js";
import {
  byId,
  catalogUrl,
  categoryLabel,
  debounce,
  escapeHtml,
  restartAnimation,
} from "./core/utils.js";
import { mountSlots } from "./ui/components.js";
import { renderProducts } from "./ui/cards.js";
import { initHero } from "./ui/hero.js";
import { initShell } from "./ui/shell.js";

mountSlots();

const IDS = [
  "q",
  "searchForm",
  "resultsCount",
  "fuzzyBanner",
  "productsGrid",
  "pagination",
  "emptyState",
  "resultsSection",
  "filterCategory",
  "filterBrand",
  "filterModel",
  "filterRim",
  "filterRimGroup",
  "catalogSidebar",
  "clearFiltersBtn",
  "emptyReset",
  "sortSelect",
  "viewToggle",
  "mobileFiltersBtn",
  "closeFiltersBtn",
  "mobileFiltersOverlay",
  "applyFiltersBtn",
];
const ui = Object.fromEntries(IDS.map((id) => [id, byId(id)]));

const isCatalog = document.body.dataset.page === "catalog";
const PAGE_SIZE = 16;
const RENDER_DELAY_MS = 160;

const state = {
  products: [],
  category: "",
  brand: "",
  model: "",
  rim: "",
  sort: "",
  page: 1,
};

const collator = new Intl.Collator("es", { sensitivity: "base" });
const SORTERS = {
  "": () => 0,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  "name-asc": (a, b) => collator.compare(a.title, b.title),
  "name-desc": (a, b) => collator.compare(b.title, a.title),
};

const sortedUnique = (values) =>
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));

const optionsHtml = (placeholder, values, label = (v) => v) =>
  `<option value="">${placeholder}</option>` +
  values
    .map(
      (v) =>
        `<option value="${escapeHtml(v)}">${escapeHtml(label(v))}</option>`,
    )
    .join("");

const featuredProducts = (products) =>
  Object.entries(FEATURED_PER_CATEGORY).flatMap(([category, count]) =>
    products.filter((p) => p.category === category).slice(0, count),
  );

const matches = (words) => (p) =>
  (!state.category || p.category === state.category) &&
  words.every((word) => p.searchText.includes(word)) &&
  (!state.brand || p.brands.includes(state.brand)) &&
  (!state.rim || p.rim === state.rim) &&
  (!state.model || p.compat.includes(state.model));

// ─── Filtros ─────────────────────────────────────────────────────
function fillSelects() {
  ui.filterCategory.innerHTML = optionsHtml(
    "Todas las categorías",
    sortedUnique(state.products.map((p) => p.category)),
    categoryLabel,
  );
  ui.filterBrand.innerHTML = optionsHtml(
    "Todas las marcas",
    sortedUnique(state.products.flatMap((p) => p.brands)),
  );
  ui.filterRim.innerHTML = optionsHtml(
    "Todos los rodados",
    sortedUnique(state.products.map((p) => p.rim)),
  );
}

function updateModelFilter() {
  const hasScope = Boolean(state.brand || state.category);
  const models = hasScope
    ? sortedUnique(
        state.products
          .filter(
            (p) =>
              (!state.brand || p.brands.includes(state.brand)) &&
              (!state.category || p.category === state.category),
          )
          .flatMap((p) => p.compat),
      )
    : [];
  const placeholder = !hasScope
    ? "Seleccione marca o categoría primero"
    : models.length
      ? "Todos los modelos"
      : "Sin modelos disponibles";

  ui.filterModel.innerHTML = optionsHtml(placeholder, models);
  ui.filterModel.disabled = !models.length;
  ui.filterModel.value = state.model;
}

// Refleja `state` en los controles. Es el único punto que escribe valores en el DOM de filtros.
function syncControls() {
  const isTazas = state.category === "TAZAS";
  if (!isTazas) state.rim = "";
  ui.filterRimGroup.hidden = !isTazas;

  ui.filterCategory.value = state.category;
  ui.filterBrand.value = state.brand;
  ui.filterRim.value = state.rim;
  ui.sortSelect.value = state.sort;
  updateModelFilter();

  document.querySelectorAll(".nav__link").forEach((link) => {
    const active = link.dataset.navCategory === state.category;
    link.classList.toggle("is-active", active);
    link.setAttribute("aria-current", active ? "page" : "false");
  });
}

function setCategory(category) {
  Object.assign(state, { category, brand: "", model: "", rim: "", page: 1 });
  syncControls();
  apply();
}

function clearFilters() {
  Object.assign(state, {
    category: "",
    brand: "",
    model: "",
    rim: "",
    sort: "",
    page: 1,
  });
  syncControls();
}

function resetAll() {
  ui.q.value = "";
  clearFilters();
  apply();
}

const toggleSheet = (open) => {
  ui.catalogSidebar.classList.toggle("is-open", open);
  ui.mobileFiltersOverlay.classList.toggle("is-open", open);
  document.body.classList.toggle("no-scroll", open);
};

// ─── Render ──────────────────────────────────────────────────────
const pageButton = (text, page, { active = false, disabled = false } = {}) =>
  `<button class="pagination__btn${active ? " is-active" : ""}" data-page="${page}"${disabled ? " disabled" : ""}${active ? ' aria-current="page"' : ""}>${text}</button>`;

function renderPagination(totalItems) {
  const pages = Math.ceil(totalItems / PAGE_SIZE);
  ui.pagination.innerHTML =
    pages <= 1
      ? ""
      : [
          pageButton("←", state.page - 1, { disabled: state.page === 1 }),
          ...Array.from({ length: pages }, (_, i) =>
            pageButton(i + 1, i + 1, { active: i + 1 === state.page }),
          ),
          pageButton("→", state.page + 1, { disabled: state.page === pages }),
        ].join("");
}

function updateCatalogStatus(total, isSimilar) {
  ui.resultsCount.textContent = `${total} producto${total === 1 ? "" : "s"}`;
  restartAnimation(ui.resultsCount, "is-updated");
  ui.fuzzyBanner.hidden = !isSimilar;
  if (isSimilar) {
    ui.fuzzyBanner.textContent = `No encontramos "${ui.q.value.trim()}". Mostrando resultados similares:`;
  }
}

let renderTimer;

function apply() {
  const words = isCatalog ? tokenize(ui.q.value) : [];
  const pool = isCatalog ? state.products : featuredProducts(state.products);
  const results = pool.filter(matches(words)).sort(SORTERS[state.sort]);

  // Sin coincidencias exactas se ofrecen similares (solo catálogo, ignorando filtros).
  const similar =
    isCatalog && !results.length && words.length
      ? fuzzySearch(state.products, words)
      : [];

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  if (state.page > pages) state.page = 1;
  const offset = (state.page - 1) * PAGE_SIZE;
  const visible = similar.length
    ? similar
    : isCatalog
      ? results.slice(offset, offset + PAGE_SIZE)
      : results;

  if (isCatalog) updateCatalogStatus(results.length, similar.length > 0);

  clearTimeout(renderTimer);
  ui.productsGrid.classList.add("is-updating");
  renderTimer = setTimeout(() => {
    renderProducts(visible, ui.productsGrid);
    ui.productsGrid.classList.remove("is-updating");
    if (!isCatalog) return;
    renderPagination(results.length);
    ui.emptyState.hidden = visible.length > 0;
  }, RENDER_DELAY_MS);
}

const scrollToResults = () =>
  ui.resultsSection.scrollIntoView({ behavior: "smooth" });

// ─── Eventos ─────────────────────────────────────────────────────
function bindCommonControls() {
  ui.sortSelect.addEventListener("change", () => {
    state.sort = ui.sortSelect.value;
    state.page = 1;
    apply();
  });

  ui.viewToggle.addEventListener("click", (e) => {
    const button = e.target.closest("[data-view]");
    if (!button) return;
    ui.viewToggle
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.classList.toggle("view-toggle__btn--active", b === button),
      );
    ui.productsGrid.classList.toggle("is-list", button.dataset.view === "list");
  });
}

function initCatalog() {
  const params = new URLSearchParams(location.search);
  ui.q.value = params.get("q") ?? "";
  state.category = (params.get("cat") ?? "").trim().toUpperCase();

  fillSelects();
  syncControls();

  ui.q.addEventListener(
    "input",
    debounce(() => {
      state.page = 1;
      apply();
    }, 200),
  );

  ui.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFilters();
    apply();
    scrollToResults();
  });

  ui.filterCategory.addEventListener("change", () => {
    ui.q.value = "";
    setCategory(ui.filterCategory.value);
  });

  [
    ["filterBrand", "brand"],
    ["filterModel", "model"],
    ["filterRim", "rim"],
  ].forEach(([id, key]) =>
    ui[id].addEventListener("change", () => {
      state[key] = ui[id].value;
      if (key === "brand") state.model = "";
      state.page = 1;
      ui.q.value = "";
      syncControls();
      apply();
    }),
  );

  ui.clearFiltersBtn.addEventListener("click", () => {
    resetAll();
    toggleSheet(false);
  });
  ui.emptyReset.addEventListener("click", resetAll);

  ui.mobileFiltersBtn.addEventListener("click", () => toggleSheet(true));
  [ui.closeFiltersBtn, ui.mobileFiltersOverlay, ui.applyFiltersBtn].forEach(
    (el) => el.addEventListener("click", () => toggleSheet(false)),
  );

  ui.pagination.addEventListener("click", (e) => {
    const button = e.target.closest("[data-page]");
    if (!button || button.disabled) return;
    state.page = Number(button.dataset.page);
    apply();
    scrollToResults();
  });

  // Navegación por categoría sin recargar; con modificadores se respeta el comportamiento nativo.
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-nav-category]");
    if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const { navCategory } = link.dataset;
    history.replaceState(null, "", catalogUrl(navCategory));
    setCategory(navCategory);
    scrollToResults();
  });
}

async function boot() {
  initShell();
  initHero();
  try {
    state.products = await loadProducts();
    setCatalog(state.products);
    initCart();
    bindCommonControls();
    if (isCatalog) initCatalog();
    apply();
  } catch (err) {
    console.error("Error al iniciar la app:", err);
    ui.productsGrid.innerHTML = `<p class="grid-notice">No se pudieron cargar los productos</p>`;
    if (ui.resultsCount) ui.resultsCount.textContent = "";
  }
}

boot();
