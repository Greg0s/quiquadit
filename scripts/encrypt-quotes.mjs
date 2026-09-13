import { readFile, writeFile, access } from "node:fs/promises";
import { webcrypto } from "node:crypto";

// webcrypto's methods need `webcrypto` as their receiver, so don't destructure them.
const { subtle } = webcrypto;

// Must stay in sync with src/crypto.ts, or decryption breaks silently.
const PASSWORD = "secte";
const PBKDF2_ITERATIONS = 250_000;

const SOURCE_PATH = new URL("../src/quotes.json", import.meta.url);
const OUTPUT_PATH = new URL("../public/quotes.enc.json", import.meta.url);

function toBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
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
  // src/quotes.json is gitignored (private source). In CI it isn't checked
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

  const quotesJson = await readFile(SOURCE_PATH, "utf-8");
  JSON.parse(quotesJson); // fail fast if the private source file is malformed

  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(PASSWORD, salt);
  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(quotesJson)
  );

  await writeFile(
    OUTPUT_PATH,
    JSON.stringify({
      salt: toBase64(salt),
      iv: toBase64(iv),
      ciphertext: toBase64(ciphertext),
    })
  );

  console.log(`Citations chiffrées écrites dans ${OUTPUT_PATH.pathname}`);
}

main();
