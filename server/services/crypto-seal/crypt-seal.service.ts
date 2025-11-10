import * as Iron from "@hapi/iron";

const SECRET = process.env.CRYPTO_SEAL_SECRET || "";

if (!SECRET) throw new Error("CRYPTO_SEAL_SECRET is not set");

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type CryptoSealPayload = Record<string, unknown>;

export class CryptoSealService {
  /**
   * Seal (encrypt+auth) a payload into a URL-safe token.
   * @param payload - Data to seal (typed via CryptoSealPayload or your own interface)
   * @param ttlMs - Optional TTL in ms; defaults to 7 days
   */
  async seal<T extends CryptoSealPayload>(
    payload: T,
    ttlMs: number = DEFAULT_TTL_MS,
  ): Promise<string> {
    const opts = { ...Iron.defaults, ttl: ttlMs };

    return Iron.seal(payload, SECRET, opts);
  }

  /**
   * Unseal a token back to its original payload (or null if invalid/tampered/expired).
   */

  async unseal<T = unknown>(token: string): Promise<T | null> {
    try {
      const obj = (await Iron.unseal(token, SECRET, Iron.defaults)) as T;

      return obj;
    } catch {
      return null;
    }
  }
}

export default new CryptoSealService();
