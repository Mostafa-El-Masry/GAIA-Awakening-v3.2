'use client';

/**
 * ELEUTHIA crypto (browser-only)
 * - PBKDF2(SHA-256) -> AES-GCM(256)
 * - All data encrypted; only decrypted in memory
 * - Stored via the per-user Supabase-backed store (`eleu.meta` + `eleu.vault`)
 */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function b64encode(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function b64decode(base64: string): Uint8Array {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function makeSalt(len = 16): Promise<string> {
  const salt = new Uint8Array(len);
  crypto.getRandomValues(salt);
  return b64encode(salt);
}

export async function deriveKey(passphrase: string, saltB64: string, iterations = 250_000): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const saltBytes = b64decode(saltB64);
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes.buffer.slice(0) as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
}

export async function encryptJSON(key: CryptoKey, data: any): Promise<{ iv: string; ct: string }> {
  const ivBytes = new Uint8Array(12);
  crypto.getRandomValues(ivBytes);
  const encoded = textEncoder.encode(JSON.stringify(data));
  const buf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes.buffer.slice(0) as ArrayBuffer },
    key,
    encoded.buffer.slice(0) as ArrayBuffer
  );
  return { iv: b64encode(ivBytes), ct: b64encode(new Uint8Array(buf)) };
}

export async function decryptJSON<T = any>(key: CryptoKey, payload: { iv: string; ct: string }): Promise<T> {
  const ivBytes = b64decode(payload.iv);
  const dataBytes = b64decode(payload.ct);
  const buf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes.buffer.slice(0) as ArrayBuffer },
    key,
    dataBytes.buffer.slice(0) as ArrayBuffer
  );
  const json = textDecoder.decode(buf);
  return JSON.parse(json) as T;
}
