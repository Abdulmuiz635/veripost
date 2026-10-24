import { Router } from "express";
import { requireClientKey } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { MOCK_BUILDINGS, nipost, providerName } from "../lib/nipost";
import { verifyRecord } from "../lib/record";

export const searchRouter = Router();

// Type-ahead for the postcode field. Proxies the NIPOST Search autocomplete.
searchRouter.get("/search/autocomplete", requireClientKey, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json({ data: { segment: "state", suggestions: [] } });
    const data = await nipost().autocomplete(q);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

// Verify a signed Verified Address Record. Public: it only checks the signature,
// so a bank can confirm a record offline without exposing anything.
searchRouter.post("/records/verify", (req, res) => {
  const token = String(req.body?.token || "");
  const claims = token ? verifyRecord(token) : null;
  if (!claims) {
    return res.status(400).json({ valid: false, error: "Invalid or expired record" });
  }
  res.json({ valid: true, claims });
});

// Sandbox helper for the demo only: exposes the mock buildings (and their
// coordinates) so the onboarding demo can simulate device location. Returns an
// empty list when running against the live API, where coordinates are gated.
searchRouter.get("/demo/buildings", (_req, res) => {
  // Fixtures back the location toggle in mock and hybrid. Pure live has no
  // coordinates available on a test/L1 key, so it returns none.
  if (providerName() === "live") {
    return res.json({ provider: "live", buildings: [] });
  }
  res.json({
    provider: providerName(),
    buildings: MOCK_BUILDINGS.map((b) => ({
      postcode: b.postcode,
      lat: b.lat,
      lng: b.lng,
      locality: b.admin.locality_name,
      state: b.admin.state_name,
    })),
  });
});
