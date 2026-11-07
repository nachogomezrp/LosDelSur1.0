import { CATEGORIES } from "../core/config.js";
import { icon } from "../core/icons.js";
import { byId, catalogUrl, onSwipe } from "../core/utils.js";

const AUTOPLAY_MS = 6000;
const TICK_MS = 50;

// [categoría, línea 1, énfasis, texto, etiqueta del botón]
const SLIDES = [
  [
    "ESPEJOS",
    "Visión clara,",
    "diseño perfecto.",
    "Espejos premium compatibles con múltiples modelos.",
    "Ver espejos",
  ],
  [
    "TAZAS",
    "Detalles que",
    "marcan la diferencia.",
    "Tazas que elevan la estética de tu vehículo.",
    "Ver tazas",
  ],
  [
    "OPTICAS",
    "Iluminación que",
    "destaca.",
    "Ópticas diseñadas para máxima visibilidad y estilo.",
    "Ver ópticas",
  ],
  [
    "FAROS",
    "Potencia y",
    "seguridad.",
    "Faros de alto rendimiento para cada situación.",
    "Ver faros",
  ],
  [
    "RADIADORES",
    "Rendimiento",
    "sin límites.",
    "Radiadores confiables para el cuidado del motor.",
    "Ver radiadores",
  ],
  [
    "DEFLECTORES",
    "Estilo y",
    "protección.",
    "Deflectores que combinan diseño y funcionalidad.",
    "Ver deflectores",
  ],
];

const slideTemplate = ([category, line, emphasis, text, cta], i) => `
<div class="hero__slide${i === 0 ? " hero__slide--active" : ""}">
  <div class="hero__media">
    <img src="./assets/img/hero-${category.toLowerCase()}.jpg" alt="${CATEGORIES[category]}" class="hero__img"
      ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} />
    <div class="hero__media-overlay"></div>
  </div>
  <div class="hero__content">
    <div class="hero__eyebrow"><span class="hero__eyebrow-dot"></span>${CATEGORIES[category]}</div>
    <h2 class="hero__title">${line}<br /><em class="hero__title-em">${emphasis}</em></h2>
    <p class="hero__text">${text}</p>
    <div class="hero__cta-group">
      <a class="hero__cta hero__cta--primary" href="${catalogUrl(category)}">${cta}</a>
      <a class="hero__cta hero__cta--ghost" href="${catalogUrl()}">Todo el catálogo</a>
    </div>
  </div>
</div>`;

export const heroTemplate = () => `
<section class="hero" id="heroSection">
  <div class="hero__slider">${SLIDES.map(slideTemplate).join("")}</div>
  <button class="hero__arrow hero__arrow--left" type="button" data-hero-step="-1" aria-label="Anterior">${icon("chevLeft", 20, 2.5)}</button>
  <button class="hero__arrow hero__arrow--right" type="button" data-hero-step="1" aria-label="Siguiente">${icon("chevRight", 20, 2.5)}</button>
  <div class="hero__progress-bar"><div class="hero__progress-fill"></div></div>
  <div class="hero__dots" role="tablist">
    ${SLIDES.map(
      ([category], i) =>
        `<button class="hero__dot${i === 0 ? " hero__dot--active" : ""}" type="button" role="tab" aria-label="Ver ${CATEGORIES[category]}"></button>`,
    ).join("")}
  </div>
  <div class="hero__scroll-hint"><div class="hero__scroll-line"></div><span>scroll</span></div>
</section>`;

export function initHero() {
  const root = byId("heroSection");
  if (!root) return;

  const slides = [...root.querySelectorAll(".hero__slide")];
  const dots = [...root.querySelectorAll(".hero__dot")];
  const bar = root.querySelector(".hero__progress-fill");
  let current = 0;
  let elapsed = 0;
  let timer;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("hero__slide--active", i === current);
      slide.setAttribute("aria-hidden", String(i !== current));
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle("hero__dot--active", i === current);
      dot.setAttribute("aria-selected", String(i === current));
    });
  };

  const pause = () => clearInterval(timer);

  const play = () => {
    pause();
    elapsed = 0;
    bar.style.width = "0%";
    timer = setInterval(() => {
      elapsed += TICK_MS;
      bar.style.width = `${Math.min((elapsed / AUTOPLAY_MS) * 100, 100)}%`;
      if (elapsed >= AUTOPLAY_MS) go(current + 1);
    }, TICK_MS);
  };

  const go = (index) => {
    show(index);
    play();
  };

  root.addEventListener("click", ({ target }) => {
    const dot = target.closest(".hero__dot");
    if (dot) return go(dots.indexOf(dot));
    const arrow = target.closest("[data-hero-step]");
    if (arrow) go(current + Number(arrow.dataset.heroStep));
  });

  // En táctil, pointerenter se emula con el tap y dejaría el autoplay pausado.
  root.addEventListener(
    "pointerenter",
    (e) => e.pointerType === "mouse" && pause(),
  );
  root.addEventListener(
    "pointerleave",
    (e) => e.pointerType === "mouse" && play(),
  );
  onSwipe(
    root,
    () => go(current + 1),
    () => go(current - 1),
  );

  show(0);
  play();
}
