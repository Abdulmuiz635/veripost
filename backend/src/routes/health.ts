import { Router } from "express";
import { nipostHealth, providerName } from "../lib/nipost";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const nip = await nipostHealth();
  res.json({
    ok: true,
    service: "veripost-backend",
    provider: providerName(),
    nipost: nip,
    time: new Date().toISOString(),
  });
});
