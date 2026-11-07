import { CATEGORIES, CONTACT } from "./config.js";

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};
const MONEY = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const byId = (id) => document.getElementById(id);

export const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

export const formatPrice = (amount) => MONEY.format(amount);

export const normalizeText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const categoryLabel = (category) =>
  CATEGORIES[category] ?? category.charAt(0) + category.slice(1).toLowerCase();

export const catalogUrl = (category = "") =>
  `./catalogo.html${category ? `?cat=${category}` : ""}`;

export const productUrl = (code) =>
  `./product.html?code=${encodeURIComponent(code)}`;

export const whatsappUrl = (text = "") =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Safari no implementa requestIdleCallback.
export const whenIdle = (callback) =>
  "requestIdleCallback" in window
    ? requestIdleCallback(callback)
    : setTimeout(callback, 1);

export function restartAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

export function onSwipe(element, onLeft, onRight, threshold = 50) {
  let startX = 0;
  element.addEventListener(
    "touchstart",
    (e) => (startX = e.changedTouches[0].clientX),
    { passive: true },
  );
  element.addEventListener(
    "touchend",
    (e) => {
      const delta = startX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > threshold) (delta > 0 ? onLeft : onRight)();
    },
    { passive: true },
  );
}
