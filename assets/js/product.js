import { initCart, setCatalog } from "./core/cart.js";
import { loadProducts } from "./core/data.js";
import { icon, whatsappIcon } from "./core/icons.js";
import {
  byId,
  categoryLabel,
  escapeHtml,
  formatPrice,
  onSwipe,
  whatsappUrl,
  whenIdle,
} from "./core/utils.js";
import { renderProducts } from "./ui/cards.js";
import { mountSlots } from "./ui/components.js";
import { createGallery } from "./ui/gallery.js";
import { initShell } from "./ui/shell.js";

mountSlots();

const detail = byId("productDetail");
const relatedSection = byId("relatedSection");

const TRUST_ITEMS = [
  ["shield", "Calidad garantizada"],
  ["truck", "Envíos a todo el país"],
  ["chat", "Atención por WhatsApp"],
];

const SKELETON = `
<div class="product-detail__gallery">
  <div class="skeleton skeleton--main"></div>
  <div class="skeleton-thumbs">${'<div class="skeleton skeleton--thumb"></div>'.repeat(3)}</div>
</div>
<div class="product-detail__info">
  <div class="skeleton skeleton--badge-row"></div>
  <div class="skeleton skeleton--title"></div>
  <div class="skeleton skeleton--title skeleton--title-short"></div>
  <div class="skeleton skeleton--price"></div>
  <div class="skeleton skeleton--meta"></div>
  <div class="skeleton skeleton--btn"></div>
</div>`;

const messageTemplate = (iconName, title, text, isError = false) => `
<div class="product-not-found">
  <div class="product-not-found__icon${isError ? " is-error" : ""}">${icon(iconName, 32, 1.4)}</div>
  <h1 class="product-not-found__title${isError ? " is-error" : ""}">${title}</h1>
  <p class="product-not-found__text">${text}</p>
  <a href="./catalogo.html" class="product-not-found__btn">Volver al catálogo</a>
</div>`;

const arrowButton = (step) =>
  `<button class="product-detail__arrow product-detail__arrow--${step < 0 ? "prev" : "next"}" type="button" aria-label="Imagen ${step < 0 ? "anterior" : "siguiente"}" data-step="${step}">${icon(step < 0 ? "chevLeft" : "chevRight", 16, 2.5)}</button>`;

const metaItem = (label, value) => `
<div class="product-detail__meta-item">
  <div class="product-detail__meta-label">${label}</div>
  <div class="product-detail__meta-value">${escapeHtml(value)}</div>
</div>`;

function detailTemplate(p) {
  const title = escapeHtml(p.title);
  const hasMany = p.images.length > 1;
  const whatsappText = `Hola! Me interesa el producto: ${p.title} (Cód: ${p.code})`;

  return `
<div class="product-detail__gallery">
  <div class="product-detail__main-image-wrap">
    <img class="product-detail__main-image" src="${escapeHtml(p.images[0])}" alt="${title}" loading="eager" />
    ${hasMany ? arrowButton(-1) + arrowButton(1) : ""}
    <div class="product-detail__zoom-hint" aria-hidden="true">${icon("zoom", 14)} Zoom</div>
  </div>
  ${
    hasMany
      ? `<div class="product-detail__thumbs">${p.images
          .map(
            (src, i) => `
    <button class="product-detail__thumb${i === 0 ? " is-active" : ""}" type="button" data-index="${i}" aria-label="Ver imagen ${i + 1}">
      <img src="${escapeHtml(src)}" alt="${title} — imagen ${i + 1}" loading="lazy" />
    </button>`,
          )
          .join("")}</div>`
      : ""
  }
</div>

<div class="product-detail__info">
  <h1 class="product-detail__title">${title}</h1>
  <div class="badges">
    <span class="badge">${escapeHtml(p.brand)}</span>
    ${p.rim ? `<span class="badge">Rod. ${escapeHtml(p.rim)}</span>` : ""}
  </div>
  <div class="product-detail__price"><span class="product-detail__price-main">${formatPrice(p.price)}</span></div>
  ${p.descripcion ? `<div class="product-detail__description">${escapeHtml(p.descripcion).replace(/\n/g, "<br>")}</div>` : ""}
  <div class="product-detail__meta-grid">
    ${metaItem("Marca", p.brand)}
    ${metaItem("Categoría", categoryLabel(p.category))}
    ${p.rim ? metaItem("Rodado", p.rim) : ""}
  </div>
  <div class="product-detail__trust">
    ${TRUST_ITEMS.map(([iconName, text]) => `<div class="trust-item">${icon(iconName, 15)}${text}</div>`).join("")}
  </div>
  <div class="product-detail__actions">
    <button class="product-detail__add" type="button" data-add-to-cart="${escapeHtml(p.code)}">${icon("cart", 18)}Agregar al carrito</button>
    <a class="product-detail__wa" href="${escapeHtml(whatsappUrl(whatsappText))}">${whatsappIcon()}Consultar por WhatsApp</a>
  </div>
</div>`;
}

function openLightbox(src) {
  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.innerHTML = `<img src="${escapeHtml(src)}" alt="">`;

  const close = () => {
    document.removeEventListener("keydown", onKey);
    overlay.classList.add("is-closing");
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = "";
    }, 200);
  };
  const onKey = (e) => e.key === "Escape" && close();

  overlay.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
}

function setupGallery(images) {
  const wrap = detail.querySelector(".product-detail__main-image-wrap");
  const thumbs = [...detail.querySelectorAll(".product-detail__thumb")];
  const gallery = createGallery(wrap.querySelector("img"), images, (index) =>
    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle("is-active", i === index);
      if (i === index)
        thumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
    }),
  );

  wrap.addEventListener("click", (e) => {
    const arrow = e.target.closest("[data-step]");
    if (arrow) gallery.step(Number(arrow.dataset.step));
    else openLightbox(wrap.querySelector("img").src);
  });

  if (images.length < 2) return;

  thumbs.forEach((thumb) =>
    thumb.addEventListener("click", () =>
      gallery.go(Number(thumb.dataset.index)),
    ),
  );
  onSwipe(
    wrap,
    () => gallery.step(1),
    () => gallery.step(-1),
    40,
  );
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select, textarea")) return;
    if (e.key === "ArrowLeft") gallery.step(-1);
    if (e.key === "ArrowRight") gallery.step(1);
  });
  whenIdle(gallery.preload);
}

async function boot() {
  initShell();
  detail.innerHTML = SKELETON;

  try {
    const products = await loadProducts();
    setCatalog(products);
    initCart();

    const code = (new URLSearchParams(location.search).get("code") ?? "")
      .trim()
      .toUpperCase();
    const product = products.find((p) => p.code === code);

    if (!product) {
      detail.innerHTML = messageTemplate(
        "searchCircle",
        "Producto no encontrado",
        "No pudimos encontrar este producto. Puede que haya sido removido o que el enlace sea incorrecto.",
      );
      relatedSection.hidden = true;
      return;
    }

    document.title = `${product.title} | Los Del Sur Accesorios`;
    byId("breadcrumbProduct").textContent = product.title;
    detail.innerHTML = detailTemplate(product);
    setupGallery(product.images);

    const related = products
      .filter((p) => p.code !== product.code && p.category === product.category)
      .slice(0, 4);
    relatedSection.hidden = !related.length;
    renderProducts(related, byId("relatedProductsGrid"));
  } catch (err) {
    console.error("Error al cargar detalle de producto:", err);
    detail.innerHTML = messageTemplate(
      "warning",
      "Error al cargar",
      "No se pudo cargar la información. Intentá recargar la página.",
      true,
    );
    relatedSection.hidden = true;
  }
}

boot();
