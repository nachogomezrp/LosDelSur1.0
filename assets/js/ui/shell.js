import { byId, escapeHtml, restartAnimation } from "../core/utils.js";

function initHeaderScroll() {
  const header = byId("mainHeader");
  const update = () =>
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initCursorGlow() {
  const glow = byId("cursorGlow");
  if (matchMedia("(pointer: coarse)").matches) return glow.remove();

  let frame;
  document.addEventListener(
    "mousemove",
    ({ clientX, clientY }) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        glow.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
      });
    },
    { passive: true },
  );
}

function initMobileNav() {
  const button = byId("mobileMenuBtn");
  const nav = byId("mainNav");
  const setOpen = (open) => {
    nav.classList.toggle("is-mobile-open", open);
    button.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
  };

  button.addEventListener("click", () =>
    setOpen(!nav.classList.contains("is-mobile-open")),
  );
  nav.addEventListener("click", (e) => e.target.closest("a") && setOpen(false));
  document.addEventListener(
    "click",
    (e) => !e.target.closest(".header") && setOpen(false),
  );
}

function initReveal() {
  const observer = new IntersectionObserver(
    (entries, obs) =>
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add("is-visible");
        obs.unobserve(target);
      }),
    { rootMargin: "0px 0px -60px 0px", threshold: 0.08 },
  );
  document
    .querySelectorAll(".reveal-item")
    .forEach((el) => observer.observe(el));
}

function flyToCart(source) {
  const fly = byId("flyItem");
  const target = document.querySelector(".cart-trigger__icon");
  const origin = (rect) => [
    rect.left + rect.width / 2 - 26,
    rect.top + rect.height / 2 - 26,
  ];
  const [startX, startY] = origin(source.getBoundingClientRect());
  const [endX, endY] = origin(target.getBoundingClientRect());

  const image =
    source.closest(".card")?.querySelector(".card__img img") ??
    document.querySelector(".product-detail__main-image");

  fly.style.left = `${startX}px`;
  fly.style.top = `${startY}px`;
  fly.style.setProperty("--fly-x", `${endX - startX}px`);
  fly.style.setProperty("--fly-y", `${endY - startY}px`);
  fly.innerHTML = image
    ? `<img src="${escapeHtml(image.currentSrc || image.src)}" alt="">`
    : "";
  restartAnimation(fly, "is-flying");
  fly.onanimationend = () => {
    fly.classList.remove("is-flying");
    restartAnimation(byId("cartCount"), "bump");
  };
}

export function initShell() {
  initHeaderScroll();
  initCursorGlow();
  initMobileNav();
  initReveal();
  document.addEventListener("cart:added", (e) => flyToCart(e.detail.source));
}
