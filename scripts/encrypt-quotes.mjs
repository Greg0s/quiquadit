import { readFile, writeFile, access } from "node:fs/promises";
import { webcrypto } from "node:crypto";

// webcrypto's methods need `webcrypto` as their receiver, so don't destructure them.
const { subtle } = webcrypto;

// Must stay in sync with src/crypto.ts, or decryption breaks silently.
const PBKDF2_ITERATIONS = 250_000;

const ENV_PATH = new URL("../.env", import.meta.url);
const SOURCE_PATH = new URL("../src/quotes.csv", import.meta.url);
const OUTPUT_PATH = new URL("../public/quotes.enc.json", import.meta.url);

function toBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

// Minimal .env loader (KEY=value per line, # comments) so the password can be
// set without touching code or relying on shell-specific env var syntax.
async function loadEnvFile(path) {
  let content;
  try {
    content = await readFile(path, "utf-8");
  } catch {
    return;
  }
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed
      .slice(eqIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

// Small RFC4180-ish CSV parser: handles quoted fields, escaped "" quotes,
// commas/newlines inside quotes. No external dependency needed for this.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"' && normalized[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);

  return rows;
}

function csvToQuotes(text) {
  const rows = parseCsv(text).filter((cells) =>
    cells.some((cell) => cell.trim() !== "")
  );
  if (rows.length === 0) return [];

  const [header, ...dataRows] = rows;
  const columns = header.map((cell) => cell.trim().toLowerCase());
  const quoteIdx = columns.indexOf("quote");
  const authorIdx = columns.indexOf("author");
  const contextIdx = columns.indexOf("context");

  if (quoteIdx === -1 || authorIdx === -1) {
    throw new Error(
      `${SOURCE_PATH.pathname} doit avoir un en-tête avec au moins les colonnes "quote" et "author" (colonne "context" optionnelle).`
    );
  }

  return dataRows
    .map((cells) => ({
      quote: (cells[quoteIdx] ?? "").trim(),
      author: (cells[authorIdx] ?? "").trim(),
      context: contextIdx === -1 ? "" : (cells[contextIdx] ?? "").trim(),
    }))
    .filter((entry) => entry.quote && entry.author);
}

async function deriveKey(password, salt) {
  const keyMaterial = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
}

async function main() {
  await loadEnvFile(ENV_PATH);
  const password = process.env.QUOTES_PASSWORD;

  // src/quotes.csv is gitignored (private source). In CI it isn't checked
  // out, so if the already-encrypted output is present, reuse it as-is.
  const sourceExists = await access(SOURCE_PATH).then(() => true, () => false);
  if (!sourceExists) {
    const outputExists = await access(OUTPUT_PATH).then(() => true, () => false);
    if (outputExists) {
      console.log(
        `${SOURCE_PATH.pathname} introuvable, ${OUTPUT_PATH.pathname} déjà présent : encryption ignorée.`
      );
      return;
    }
    throw new Error(
      `${SOURCE_PATH.pathname} introuvable et aucun ${OUTPUT_PATH.pathname} existant à réutiliser.`
    );
  }

  if (!password) {
    throw new Error(
      `QUOTES_PASSWORD non défini. Copiez .env.example vers .env et définissez QUOTES_PASSWORD.`
    );
  }

  const csvText = await readFile(SOURCE_PATH, "utf-8");
  const quotes = csvToQuotes(csvText);
  if (quotes.length === 0) {
    throw new Error(`Aucune citation valide trouvée dans ${SOURCE_PATH.pathname}.`);
  }

  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(quotes))
  );

  await writeFile(
    OUTPUT_PATH,
    JSON.stringify({
      salt: toBase64(salt),
      iv: toBase64(iv),
      ciphertext: toBase64(ciphertext),
    })
  );

  console.log(
    `${quotes.length} citation(s) chiffrée(s) écrite(s) dans ${OUTPUT_PATH.pathname}`
  );
}

main();
