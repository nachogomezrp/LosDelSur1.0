import { STORAGE_KEYS } from "./config.js";
import { icon } from "./icons.js";
import {
  byId,
  escapeHtml,
  formatPrice,
  restartAnimation,
  whatsappUrl,
} from "./utils.js";

const EXIT_MS = 280;
const FEEDBACK_MS = 1100;

const EMPTY_HTML = `
<div class="cart-empty" role="status">
  <div class="cart-empty__icon">${icon("cart", 32, 1.4)}</div>
  <p class="cart-empty__text">Tu carrito está vacío</p>
  <p class="cart-empty__sub">Explorá el catálogo y agregá productos</p>
</div>`;

const CLEAR_HTML = `
<div class="cart__clear-wrap">
  <button class="cart__clear-btn" type="button" data-cart-action="clear" aria-label="Vaciar todo el carrito">
    ${icon("trash", 13)}Vaciar carrito
  </button>
</div>`;

let catalog = new Map();
let cart = new Map();
let ui;

export function setCatalog(products) {
  catalog = new Map(products.map((p) => [p.code, p]));
}

export function initCart() {
  ui = {
    drawer: byId("cartDrawer"),
    openBtn: byId("cartOpenBtn"),
    closeBtn: byId("cartCloseBtn"),
    overlay: byId("cartOverlay"),
    items: byId("cartItems"),
    count: byId("cartCount"),
    total: byId("cartTotal"),
    checkoutBtn: byId("checkoutBtn"),
  };

  cart = loadCart();
  render();

  ui.openBtn.addEventListener("click", () => setDrawer(true));
  ui.closeBtn.addEventListener("click", () => setDrawer(false));
  ui.overlay.addEventListener("click", () => setDrawer(false));
  ui.checkoutBtn.addEventListener("click", () =>
    window.open(whatsappUrl(orderMessage()), "_blank", "noopener,noreferrer"),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ui.drawer.classList.contains("is-open"))
      setDrawer(false);
  });
  document.addEventListener("click", onDocumentClick);
}

function setDrawer(open) {
  // El foco debe salir del drawer antes de marcarlo aria-hidden.
  if (open) render(true);
  else ui.openBtn.focus();

  ui.drawer.classList.toggle("is-open", open);
  ui.drawer.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
  if (open) setTimeout(() => ui.closeBtn.focus(), 120);
}

function onDocumentClick(e) {
  const addBtn = e.target.closest("[data-add-to-cart]");
  if (addBtn) return addToCart(addBtn);

  const actionBtn = e.target.closest("[data-cart-action]");
  if (actionBtn) runAction(actionBtn);
}

function addToCart(button) {
  const code = button.dataset.addToCart;
  if (!catalog.has(code)) return;

  change(code, 1);
  flashAdded(button);
  navigator.vibrate?.(45);
  document.dispatchEvent(
    new CustomEvent("cart:added", { detail: { source: button } }),
  );
}

// Evita capturar el HTML temporal como "original" si se hace click repetido.
function flashAdded(button) {
  if (button.classList.contains("is-added")) return;
  const original = button.innerHTML;
  button.style.minWidth = `${button.offsetWidth}px`;
  button.classList.add("is-added");
  button.innerHTML = `${icon("check", 14, 3)}¡Agregado!`;
  setTimeout(() => {
    button.innerHTML = original;
    button.classList.remove("is-added");
    button.style.minWidth = "";
  }, FEEDBACK_MS);
}

function runAction(button) {
  const { cartAction: action, code } = button.dataset;
  if (action === "inc") change(code, 1);
  else if (action === "dec") change(code, -1);
  else if (action === "rm")
    exitThen(button.closest(".cart-item"), () =>
      update(() => cart.delete(code)),
    );
  else if (action === "clear")
    exitThen(ui.items, () => update(() => cart.clear()));
}

function exitThen(element, done) {
  element.classList.add("is-leaving");
  setTimeout(() => {
    element.classList.remove("is-leaving");
    done();
  }, EXIT_MS);
}

function change(code, delta) {
  update(() => {
    const qty = (cart.get(code) ?? 0) + delta;
    if (qty > 0) cart.set(code, qty);
    else cart.delete(code);
  });
}

function update(mutation) {
  mutation();
  saveCart();
  render();
}

function loadCart() {
  try {
    const { items } = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)) ?? {};
    return new Map(
      (Array.isArray(items) ? items : [])
        .filter(
          (item) => catalog.has(String(item?.code)) && Number(item.qty) > 0,
        )
        .map((item) => [String(item.code), Number(item.qty)]),
    );
  } catch {
    return new Map();
  }
}

function saveCart() {
  try {
    const items = [...cart].map(([code, qty]) => ({ code, qty }));
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify({ v: 1, items }));
  } catch {
    // Storage no disponible (modo privado o cuota): el carrito sigue en memoria.
  }
}

function totals() {
  let count = 0;
  let total = 0;
  for (const [code, qty] of cart) {
    count += qty;
    total += catalog.get(code).price * qty;
  }
  return { count, total };
}

function orderMessage() {
  const lines = [...cart].map(([code, qty]) => {
    const p = catalog.get(code);
    return `• ${p.description} (Cód: ${code}) x${qty} — ${formatPrice(p.price)}`;
  });
  return (
    `¡Hola! Me gustaría hacer el siguiente pedido:\n\n${lines.join("\n")}` +
    `\n\n*Total aprox.:* ${formatPrice(totals().total)}\n\n¡Quedo a la espera, gracias!`
  );
}

function render(animate = false) {
  const { count, total } = totals();

  if (ui.count.textContent !== String(count)) {
    ui.count.textContent = count;
    restartAnimation(ui.count, "bump");
  }
  ui.total.textContent = formatPrice(total);
  ui.checkoutBtn.disabled = !cart.size;
  ui.items.classList.toggle("is-animated", animate);
  ui.items.innerHTML = cart.size
    ? [...cart].map(rowTemplate).join("") + CLEAR_HTML
    : EMPTY_HTML;
}

const actionButton = (action, code, className, label, iconName, size, stroke) =>
  `<button class="${className}" type="button" data-cart-action="${action}" data-code="${escapeHtml(code)}" aria-label="${label}">${icon(iconName, size, stroke)}</button>`;

function rowTemplate([code, qty], index) {
  const p = catalog.get(code);
  const name = escapeHtml(p.description);
  const meta = [p.brand, p.rim && `Rod. ${p.rim}`, `Cód. ${code}`]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" · ");

  return `
<div class="cart-item" style="--i:${index}">
  <div class="cart-item__img"><img src="${escapeHtml(p.images[0])}" alt="${name}" loading="lazy" /></div>
  <div class="cart-item__top">
    <p class="cart-item__name">${name}</p>
    <p class="cart-item__meta">${meta}</p>
    <p class="cart-item__unit">${formatPrice(p.price)} c/u</p>
    <div class="cart-item__bottom">
      <div class="qty" role="group" aria-label="Cantidad">
        ${actionButton("dec", code, "qty__btn", "Quitar uno", "minus", 11, 3)}
        <span class="qty__value" aria-live="polite">${qty}</span>
        ${actionButton("inc", code, "qty__btn", "Agregar uno", "plus", 11, 3)}
      </div>
      <span class="cart-item__price">${formatPrice(p.price * qty)}</span>
      ${actionButton("rm", code, "cart-item__remove", `Eliminar ${name}`, "trash", 13, 2)}
    </div>
  </div>
</div>`;
}
