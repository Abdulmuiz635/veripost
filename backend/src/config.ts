import dotenv from "dotenv";

dotenv.config();

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const nipostKey = process.env.NIPOST_API_KEY || "";
let nipostMode = (process.env.NIPOST_MODE || "").toLowerCase();
// Modes:
//   mock   - everything from built-in fixtures (no network)
//   live   - everything from the NIPOST API (needs L2+ grant for addresses)
//   hybrid - live reference (states/LGAs) + fixtures for building/reverse,
//            which is what a test/L1 key can actually do today
if (!nipostMode || nipostMode === "auto") nipostMode = nipostKey ? "hybrid" : "mock";

export const config = {
  port: num("PORT", 8080),
  env: process.env.NODE_ENV || "development",

  databaseUrl: process.env.DATABASE_URL || "",

  nipost: {
    mode: nipostMode as "mock" | "live" | "hybrid",
    base: process.env.NIPOST_API_BASE || "https://api.postcode.gov.ng/v1",
    key: nipostKey,
  },

  jwtSigningKey: process.env.JWT_SIGNING_KEY || "dev-change-me",
  adminApiToken: process.env.ADMIN_API_TOKEN || "dev-admin-token-change-me",

  score: {
    verifiedMin: num("SCORE_VERIFIED_MIN", 75),
    flaggedMin: num("SCORE_FLAGGED_MIN", 40),
  },
};

export type Config = typeof config;
