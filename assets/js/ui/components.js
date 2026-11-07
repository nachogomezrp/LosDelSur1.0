import { CATEGORIES, CONTACT } from "../core/config.js";
import { icon, whatsappIcon } from "../core/icons.js";
import { catalogUrl, whatsappUrl } from "../core/utils.js";
import { heroTemplate } from "./hero.js";

const categoryLink = (category, label, className) =>
  `<a href="${catalogUrl(category)}" class="${className}" data-nav-category="${category}">${label}</a>`;

const categoryLinks = (className) =>
  [
    categoryLink("", "Todo el catálogo", className),
    ...Object.entries(CATEGORIES).map(([category, label]) =>
      categoryLink(category, label, className),
    ),
  ].join("");

const header = () => `
<div class="cursor-glow" id="cursorGlow"></div>
<div class="noise-overlay" aria-hidden="true"></div>
<header class="header" id="mainHeader">
  <div class="header__main">
    <a href="./index.html" class="brand" aria-label="Ir al inicio">
      <div class="brand__logo-wrap">
        <img src="./assets/img/logo.png" alt="Los Del Sur Accesorios" class="brand__img" />
        <div class="brand__glow"></div>
      </div>
    </a>

    <form class="searchbar" id="searchForm" action="./catalogo.html" role="search">
      <div class="searchbar__inner">
        <span class="searchbar__icon">${icon("search")}</span>
        <input id="q" name="q" class="searchbar__input" type="search" placeholder="Buscar productos, marcas, modelos…" autocomplete="off" />
        <button class="searchbar__btn" type="submit" aria-label="Buscar">${icon("arrowRight", 16, 2.5)}</button>
      </div>
    </form>

    <div class="header__actions">
      <button id="cartOpenBtn" class="cart-trigger" type="button" aria-label="Abrir carrito">
        <span class="cart-trigger__icon">${icon("cart", 22, 1.6)}<span class="cart-trigger__badge" id="cartCount">0</span></span>
        <span class="cart-trigger__label">Carrito</span>
      </button>
      <button class="mobile-menu-btn" id="mobileMenuBtn" type="button" aria-label="Menú" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>

  <nav class="nav" aria-label="Categorías" id="mainNav">
    <div class="nav__inner"><div class="nav__quick-links">${categoryLinks("nav__link")}</div></div>
  </nav>
</header>`;

const FEATURES = [
  ["truck", "Envío por zona", "Consulta disponibilidad"],
  ["shield", "Garantía de calidad", "Productos certificados"],
  ["coin", "Cotización gratis", "Respondemos rápido"],
  ["chat", "Atención por WhatsApp", "Lunes a sábados"],
];

const features = () => `
<section class="features-strip" aria-label="Beneficios">
  <div class="features-strip__inner">
    ${FEATURES.map(
      ([iconName, title, subtitle]) => `
    <div class="feature-chip reveal-item">
      <div class="feature-chip__icon">${icon(iconName, 20, 1.8)}</div>
      <div class="feature-chip__text"><strong>${title}</strong><span>${subtitle}</span></div>
    </div>`,
    ).join("")}
  </div>
</section>`;

const resultsTools = () => `
<div class="results__bar-right">
  <div class="filter-select-wrap">
    <select id="sortSelect" class="filter-select" aria-label="Ordenar productos">
      <option value="">Ordenar por</option>
      <option value="price-asc">Precio: menor a mayor</option>
      <option value="price-desc">Precio: mayor a menor</option>
      <option value="name-asc">Nombre: A → Z</option>
      <option value="name-desc">Nombre: Z → A</option>
    </select>
  </div>
  <div class="view-toggle" id="viewToggle" aria-label="Cambiar vista">
    <button class="view-toggle__btn view-toggle__btn--active" type="button" data-view="grid" aria-label="Vista grilla">${icon("grid")}</button>
    <button class="view-toggle__btn" type="button" data-view="list" aria-label="Vista lista">${icon("list")}</button>
  </div>
</div>`;

const drawer = () => `
<aside id="cartDrawer" class="drawer" aria-hidden="true">
  <div class="drawer__overlay" id="cartOverlay"></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Tu Carrito">
    <div class="drawer__header">
      <div class="drawer__header-left">
        <div class="drawer__header-icon">${icon("cart", 18, 1.8)}</div>
        <div>
          <h2 class="drawer__title">Tu Carrito</h2>
          <p class="drawer__subtitle">Revisá tu pedido antes de enviar</p>
        </div>
      </div>
      <button id="cartCloseBtn" class="drawer__close" type="button" aria-label="Cerrar carrito">${icon("close", 18)}</button>
    </div>
    <div id="cartItems" class="cart"></div>
    <div class="drawer__footer">
      <div class="totals">
        <div class="totals__row">
          <span class="totals__label">Total estimado</span>
          <strong id="cartTotal" class="totals__value">$0</strong>
        </div>
      </div>
      <button id="checkoutBtn" class="checkout-btn" type="button">${whatsappIcon(18)}Finalizar por WhatsApp</button>
    </div>
  </div>
</aside>
<div class="fly-item" id="flyItem" aria-hidden="true"></div>`;

const footer = () => `
<footer class="footer">
  <div class="footer__glow" aria-hidden="true"></div>
  <div class="footer__inner">
    <div class="footer__brand">
      <div class="footer__logo-wrap"><img src="./assets/img/logo.png" alt="Los Del Sur Accesorios" class="footer__logo" /></div>
      <p class="footer__brand-desc">Tu destino premium para accesorios, repuestos y detalles que elevan tu vehículo al siguiente nivel.</p>
      <a href="${whatsappUrl()}" class="footer__wa-btn">${whatsappIcon()}Contactar ahora</a>
    </div>
    <div class="footer__col">
      <h4 class="footer__col-title">Catálogo</h4>
      <nav class="footer__nav">${categoryLinks("footer__link")}</nav>
    </div>
    <div class="footer__col">
      <h4 class="footer__col-title">Contacto</h4>
      <nav class="footer__nav">
        <a href="${whatsappUrl()}" class="footer__link">${whatsappIcon(14)}${CONTACT.phoneLabel}</a>
        <a href="mailto:${CONTACT.email}" class="footer__link">${icon("mail", 14)}${CONTACT.email}</a>
        <span class="footer__link footer__link--static">${icon("pin", 14)}${CONTACT.location}</span>
      </nav>
    </div>
  </div>
  <div class="footer__bottom">
    <span>© ${new Date().getFullYear()} Los Del Sur Accesorios · Todos los derechos reservados</span>
    <a href="https://www.linkedin.com/in/ignaciogomez0011">Creado por Ignacio Gomez</a>
  </div>
</footer>`;

const SLOTS = {
  header,
  hero: heroTemplate,
  features,
  "results-tools": resultsTools,
  drawer,
  footer,
};

/** Reemplaza cada [data-slot] e [data-icon] por su markup. Debe ejecutarse antes de leer el DOM. */
export function mountSlots() {
  document.querySelectorAll("[data-slot]").forEach((el) => {
    el.outerHTML = SLOTS[el.dataset.slot]();
  });
  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.outerHTML = icon(
      el.dataset.icon,
      Number(el.dataset.size) || 16,
      Number(el.dataset.stroke) || 2,
    );
  });
}
