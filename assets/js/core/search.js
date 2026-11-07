import { normalizeText } from "./utils.js";

export const tokenize = (text) =>
  normalizeText(text).split(/\s+/).filter(Boolean);

function levenshtein(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] =
        a[i - 1] === b[j - 1]
          ? previous[j - 1]
          : 1 + Math.min(previous[j], current[j - 1], previous[j - 1]);
    }
    previous = current;
  }
  return previous[b.length];
}

// Suma, por palabra buscada, la menor distancia contra los tokens del producto.
// Los tokens con más de 4 caracteres de diferencia se descartan sin calcular.
function fuzzyScore(product, words) {
  const tokens = product.searchText.split(/\s+/).filter(Boolean);
  return words.reduce((sum, word) => {
    let best = 10;
    for (const token of tokens) {
      if (Math.abs(token.length - word.length) <= 4)
        best = Math.min(best, levenshtein(word, token));
    }
    return sum + best;
  }, 0);
}

export function fuzzySearch(
  products,
  words,
  { threshold = 3, limit = 8 } = {},
) {
  return products
    .map((product) => ({ product, score: fuzzyScore(product, words) }))
    .filter(({ score }) => score / words.length <= threshold)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ product }) => product);
}
