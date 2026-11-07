import {
  IMAGE_BASE,
  PLACEHOLDER_IMG,
  SHEET_CSV_URL,
  STORAGE_KEYS,
} from "./config.js";
import { normalizeText } from "./utils.js";

// Parser RFC 4180: soporta comillas escapadas y saltos de línea dentro de celdas.
function parseCsv(text) {
  const source = text.replace(/\r\n?/g, "\n");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char !== '"') cell += char;
      else if (source[i + 1] === '"') ((cell += '"'), i++);
      else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ",") (row.push(cell), (cell = ""));
    else if (char === "\n")
      (row.push(cell), rows.push(row), (row = []), (cell = ""));
    else cell += char;
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim()));
}

// Acepta "1.234,56", "1,234.56" y "1234".
function parsePrice(value) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(/,(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

const parseRim = (description) => {
  const match = description.match(/\bR(\d{2})\b/i);
  return match ? `R${match[1]}` : "";
};

// Descarta la ruta que venga de la hoja y conserva solo el nombre de archivo.
const parseImages = (value) =>
  value
    .split("|")
    .map((src) => src.trim())
    .filter(Boolean)
    .map((src) => IMAGE_BASE + src.split("/").pop());

function toProduct(row) {
  const price = parsePrice(row.price);
  const isActive = ["1", "true"].includes(row.active.toLowerCase());
  if (!isActive || price <= 0) return null;

  const category = row.category.toUpperCase();
  const brand = row.brand.toUpperCase();
  const code = row.code.toUpperCase();
  const images = parseImages(row.image_url);

  return {
    code,
    category,
    brand,
    brands: brand
      .split("-")
      .map((b) => b.trim())
      .filter(Boolean),
    title: row.detalle || row.name,
    description: row.name,
    descripcion: row.descripcion,
    price,
    images: images.length ? images : [PLACEHOLDER_IMG],
    rim: category === "TAZAS" ? parseRim(row.name) : "",
    compat: row.compatibilidades
      ? row.compatibilidades
          .split("/")
          .map((m) => m.trim().toUpperCase())
          .filter(Boolean)
      : [],
    searchText: normalizeText(
      [
        category,
        brand,
        code,
        row.name,
        row.detalle,
        row.descripcion,
        row.compatibilidades,
      ].join(" "),
    ),
  };
}

function toProducts(csv) {
  const [header, ...rows] = parseCsv(csv);
  if (!header) return [];
  const keys = header.map((h) => h.trim().toLowerCase());
  return rows
    .map((cells) =>
      toProduct(
        Object.fromEntries(
          keys.map((key, i) => [key, (cells[i] ?? "").trim()]),
        ),
      ),
    )
    .filter(Boolean);
}

export async function loadProducts() {
  try {
    const cached = sessionStorage.getItem(STORAGE_KEYS.products);
    if (cached) return JSON.parse(cached);
  } catch {
    // Caché ilegible o storage bloqueado: se vuelve a pedir la hoja.
  }

  const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
  if (!response.ok)
    throw new Error(`No se pudo cargar la base de datos (${response.status})`);
  const products = toProducts(await response.text());

  try {
    sessionStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  } catch {
    // Cuota excedida o storage bloqueado: se continúa sin caché.
  }
  return products;
}
