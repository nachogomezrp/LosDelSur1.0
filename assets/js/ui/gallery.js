const FADE_MS = 150;

/**
 * Cambia el `src` de una imagen con fundido (clase `is-fading`).
 * `onChange` recibe el índice activo.
 */
export function createGallery(img, images, onChange) {
  let current = 0;
  let busy = false;

  const go = (index) => {
    const next = (index + images.length) % images.length;
    if (busy || next === current) return;
    busy = true;
    current = next;
    img.classList.add("is-fading");
    setTimeout(() => {
      img.onload = img.onerror = () => {
        img.classList.remove("is-fading");
        busy = false;
      };
      img.src = images[current];
    }, FADE_MS);
    onChange?.(current);
  };

  return {
    go,
    step: (delta) => go(current + delta),
    preload: () =>
      images.slice(1).forEach((src) => {
        new Image().src = src;
      }),
  };
}
