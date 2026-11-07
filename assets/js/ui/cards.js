import { icon } from "../core/icons.js";
import { escapeHtml, formatPrice, productUrl } from "../core/utils.js";
import { createGallery } from "./gallery.js";

const FINE_POINTER = !matchMedia("(pointer: coarse)").matches;

const sliderControls = (count) => `
  <button class="card__slider-btn card__slider-btn--prev" type="button" aria-label="Imagen anterior" data-step="-1">${icon("chevLeft", 14, 2.5)}</button>
  <button class="card__slider-btn card__slider-btn--next" type="button" aria-label="Imagen siguiente" data-step="1">${icon("chevRight", 14, 2.5)}</button>
  <div class="card__slider-dots">
    ${Array.from(
      { length: count },
      (_, i) =>
        `<button class="card__slider-dot${i === 0 ? " is-active" : ""}" type="button" aria-label="Ver imagen ${i + 1}" data-index="${i}"></button>`,
    ).join("")}
  </div>`;

function cardTemplate(p) {
  const href = escapeHtml(productUrl(p.code));
  const title = escapeHtml(p.title);

  return `
<article class="card">
  <div class="card__img-slider">
    <a class="card__detail-link" href="${href}" tabindex="-1" aria-hidden="true">
      <div class="card__img"><img src="${escapeHtml(p.images[0])}" alt="${title}" loading="lazy" /></div>
    </a>
    ${p.images.length > 1 ? sliderControls(p.images.length) : ""}
  </div>
  <div class="card__body">
    <a class="card__detail-link" href="${href}"><h3 class="card__title">${title}</h3></a>
    <div class="price"><span class="price__value">${formatPrice(p.price)}</span></div>
    <div class="card__actions">
      <a class="btn-card btn-card--ghost" href="${href}">${icon("eye", 14)}Ver detalle</a>
      <button class="btn-card" type="button" data-add-to-cart="${escapeHtml(p.code)}">${icon("cart", 14, 2.2)}Agregar</button>
    </div>
  </div>
</article>`;
}

function bindSlider(card, images) {
  const dots = [...card.querySelectorAll(".card__slider-dot")];
  const gallery = createGallery(
    card.querySelector(".card__img img"),
    images,
    (index) =>
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index)),
  );

  // Las imágenes secundarias se descargan recién al primer hover.
  card.addEventListener("pointerenter", gallery.preload, { once: true });
  card
    .querySelectorAll("[data-step]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        gallery.step(Number(btn.dataset.step)),
      ),
    );
  dots.forEach((dot) =>
    dot.addEventListener("click", () => gallery.go(Number(dot.dataset.index))),
  );
}

function bindTilt(card) {
  card.addEventListener("mousemove", ({ clientX, clientY }) => {
    const rect = card.getBoundingClientRect();
    const dx = (clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = (clientY - rect.top - rect.height / 2) / (rect.height / 2);
    card.style.transition = "transform 0.08s linear";
    card.style.transform = `translateY(-8px) scale(1.01) rotateX(${(-dy * 5).toFixed(2)}deg) rotateY(${(dx * 5).toFixed(2)}deg)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transition = "";
    card.style.transform = "";
  });
}

export function renderProducts(products, grid) {
  grid.innerHTML = products.map(cardTemplate).join("");
  grid.querySelectorAll(".card").forEach((card, i) => {
    if (products[i].images.length > 1) bindSlider(card, products[i].images);
    if (FINE_POINTER) bindTilt(card);
  });
}
