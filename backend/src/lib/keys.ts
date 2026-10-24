// Client API keys. We store only a sha256 hash. The raw key is returned once,
// at creation, and never again.
import crypto from "crypto";
import { customAlphabet } from "nanoid";

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const randomPart = customAlphabet(alphabet, 32);

export interface GeneratedKey {
  raw: string; // show once
  hash: string; // store
  prefix: string; // store, for display
}

export function generateClientKey(mode: "live" | "test" = "live"): GeneratedKey {
  const raw = `vp_${mode}_${randomPart()}`;
  const hash = hashKey(raw);
  const prefix = raw.slice(0, 12); // e.g. vp_live_ab12
  return { raw, hash, prefix };
}

export function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw.trim()).digest("hex");
}
