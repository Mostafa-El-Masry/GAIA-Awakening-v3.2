/**
 * services/eleuthia/crypto.ts
 *
 * ELEUTHIA Crypto Wrapper
 * Client-side AES-GCM encryption/decryption using WebCrypto API.
 *
 * Usage:
 *   const ciphertext = await ELEUTHIA.encrypt("my secret data");
 *   const plaintext = await ELEUTHIA.decrypt(ciphertext);
 *
 *   const encObj = await ELEUTHIA.json.encrypt({ name: "Alice", age: 30 });
 *   const decObj = await ELEUTHIA.json.decrypt<{ name: string; age: number }>(encObj);
 */

const ALGORITHM = "AES-GCM";
const KEY_SIZE = 256; // bits
const IV_SIZE = 12; // bytes (96 bits recommended for GCM)
const SALT_SIZE = 16; // bytes (128 bits)

interface CryptoConfig {
  key?: CryptoKey;
  devKey?: string; // Base64 key for development (MUST be rotated in production)
}

class ELEUTHIACrypto {
  private key: CryptoKey | null = null;
  private devKeyB64: string = "";

  /**
   * Initialize the crypto module with a key.
   * For W4 baseline: uses a dev key from environment.
   * Week 6 will formalize key derivation via user auth.
   */
  async init(config: CryptoConfig = {}) {
    if (config.key) {
      this.key = config.key;
    } else if (config.devKey) {
      this.devKeyB64 = config.devKey;
      this.key = await this.importKeyFromB64(config.devKey);
    } else {
      // Try to get from environment (client-side, via globals or window)
      const envKey =
        (typeof window !== "undefined"
          ? (window as any).ELEUTHIA_DEV_KEY
          : process.env.NEXT_PUBLIC_ELEUTHIA_DEV_KEY) || "";

      if (!envKey) {
        throw new Error(
          "No ELEUTHIA encryption key provided. Set NEXT_PUBLIC_ELEUTHIA_DEV_KEY env var."
        );
      }

      this.devKeyB64 = envKey;
      this.key = await this.importKeyFromB64(envKey);
    }
  }

  /**
   * Encrypt a plaintext string to base64-encoded ciphertext
   */
  async encrypt(plain: string): Promise<string> {
    if (!this.key) await this.init();

    const encoder = new TextEncoder();
    const plainBytes = encoder.encode(plain);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));

    // Encrypt
    const cipherBytes = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      this.key!,
      plainBytes
    );

    // Combine IV + ciphertext and encode to base64
    const combined = new Uint8Array(iv.byteLength + cipherBytes.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBytes), iv.byteLength);

    return this.uint8ArrayToB64(combined);
  }

  /**
   * Decrypt a base64-encoded ciphertext to plaintext string
   */
  async decrypt(cipherB64: string): Promise<string> {
    if (!this.key) await this.init();

    const combined = this.b64ToUint8Array(cipherB64);

    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_SIZE);
    const cipherBytes = combined.slice(IV_SIZE);

    // Decrypt
    const plainBytes = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      this.key!,
      cipherBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(plainBytes);
  }

  /**
   * JSON-safe encrypt: stringify object, then encrypt
   */
  async encryptJson<T extends Record<string, any>>(obj: T): Promise<string> {
    const jsonStr = JSON.stringify(obj);
    return this.encrypt(jsonStr);
  }

  /**
   * JSON-safe decrypt: decrypt, then parse JSON
   */
  async decryptJson<T = unknown>(cipherB64: string): Promise<T> {
    const jsonStr = await this.decrypt(cipherB64);
    return JSON.parse(jsonStr) as T;
  }

  /**
   * Import a base64-encoded key for WebCrypto
   */
  private async importKeyFromB64(keyB64: string): Promise<CryptoKey> {
    const keyBytes = this.b64ToUint8Array(keyB64);
    return crypto.subtle.importKey(
      "raw",
      keyBytes as BufferSource,
      { name: ALGORITHM },
      false, // non-extractable
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Helper: Uint8Array to Base64
   */
  private uint8ArrayToB64(arr: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < arr.byteLength; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: Base64 to Uint8Array
   */
  private b64ToUint8Array(b64: string): Uint8Array {
    const binary = atob(b64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      arr[i] = binary.charCodeAt(i);
    }
    return arr;
  }
}

// Singleton instance
const eleuthiaCrypto = new ELEUTHIACrypto();

/**
 * ELEUTHIA public API
 */
export const ELEUTHIA = {
  /**
   * Initialize with optional custom config
   */
  init: (config?: CryptoConfig) => eleuthiaCrypto.init(config),

  /**
   * Encrypt plaintext string to base64 ciphertext
   */
  encrypt: (plain: string) => eleuthiaCrypto.encrypt(plain),

  /**
   * Decrypt base64 ciphertext to plaintext string
   */
  decrypt: (cipherB64: string) => eleuthiaCrypto.decrypt(cipherB64),

  /**
   * JSON helpers
   */
  json: {
    encrypt: <T extends Record<string, any>>(obj: T) =>
      eleuthiaCrypto.encryptJson(obj),
    decrypt: <T = unknown>(cipherB64: string): Promise<T> =>
      eleuthiaCrypto.decryptJson<T>(cipherB64),
  },
};
