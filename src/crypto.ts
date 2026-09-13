import type { Quote } from "./types";

// Must stay in sync with scripts/encrypt-quotes.mjs, or decryption breaks silently.
const PBKDF2_ITERATIONS = 250_000;

type EncryptedPayload = {
  salt: string;
  iv: string;
  ciphertext: string;
};

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

export async function decryptQuotes(
  password: string,
  payload: EncryptedPayload
): Promise<Quote[]> {
  const key = await deriveKey(password, fromBase64(payload.salt));
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(payload.iv) },
    key,
    fromBase64(payload.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as Quote[];
}
