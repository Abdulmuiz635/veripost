import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { generateClientKey } from "../lib/keys";
import { prisma } from "../lib/prisma";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

// ---- Analytics ------------------------------------------------------------

adminRouter.get("/stats", async (_req, res, next) => {
  try {
    const [total, byStatus, since24h, recent] = await Promise.all([
      prisma.verification.count(),
      prisma.verification.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.verification.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.verification.findMany({
        orderBy: { createdAt: "desc" },
        take: 500,
        select: { status: true, score: true, createdAt: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {
      VERIFIED: 0,
      FLAGGED: 0,
      UNVERIFIED: 0,
      REJECTED: 0,
    };
    for (const row of byStatus) statusCounts[row.status] = row._count._all;

    const scored = recent.filter((r) => r.status !== "REJECTED");
    const avgScore =
      scored.length > 0
        ? Math.round(scored.reduce((a, r) => a + r.score, 0) / scored.length)
        : 0;

    // 14-day daily series.
    const days: { date: string; total: number; verified: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const inDay = recent.filter((r) => r.createdAt >= d && r.createdAt < next);
      days.push({
        date: d.toISOString().slice(0, 10),
        total: inDay.length,
        verified: inDay.filter((r) => r.status === "VERIFIED").length,
      });
    }

    const passRate =
      total > 0 ? Math.round((statusCounts.VERIFIED / total) * 100) : 0;

    res.json({
      total,
      last_24h: since24h,
      avg_score: avgScore,
      pass_rate: passRate,
      status_counts: statusCounts,
      daily: days,
    });
  } catch (e) {
    next(e);
  }
});

// ---- Verifications --------------------------------------------------------

adminRouter.get("/verifications", async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const q = req.query.q ? String(req.query.q).trim() : undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const rows = await prisma.verification.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              // SQLite LIKE is case-insensitive for ASCII, so no mode needed.
              OR: [
                { claimedPostcode: { contains: q } },
                { customerRef: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { client: { select: { name: true } } },
    });

    res.json({
      verifications: rows.map((v) => ({
        id: v.id,
        client: v.client.name,
        customer_ref: v.customerRef,
        postcode: v.claimedPostcode,
        status: v.status,
        score: v.score,
        match_depth: v.matchDepth,
        distance_m: v.distanceM,
        confidence: v.nipostConfidence,
        provider: v.provider,
        presence_confirmations: v.presenceConfirmations,
        created_at: v.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/verifications/:id", async (req, res, next) => {
  try {
    const v = await prisma.verification.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { name: true } },
        presenceEvents: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!v) throw new ApiError(404, "Verification not found", "not_found");
    res.json({
      id: v.id,
      client: v.client.name,
      customer_ref: v.customerRef,
      postcode: v.claimedPostcode,
      status: v.status,
      score: v.score,
      match_depth: v.matchDepth,
      distance_m: v.distanceM,
      confidence: v.nipostConfidence,
      reverse_postcode: v.reversePostcode,
      address: v.resolvedAddress ? JSON.parse(v.resolvedAddress) : null,
      gps: v.gpsLat != null ? { lat: v.gpsLat, lng: v.gpsLng } : null,
      record_jti: v.recordJti,
      provider: v.provider,
      presence_confirmations: v.presenceConfirmations,
      presence_events: v.presenceEvents.map((p) => ({
        id: p.id,
        postcode: p.postcode,
        distance_m: p.distanceM,
        confidence: p.confidence,
        created_at: p.createdAt,
      })),
      created_at: v.createdAt,
    });
  } catch (e) {
    next(e);
  }
});

// ---- Clients and keys -----------------------------------------------------

adminRouter.get("/clients", async (_req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { verifications: true, apiKeys: true } },
        apiKeys: {
          where: { revokedAt: null },
          select: { id: true, label: true, keyPrefix: true, createdAt: true },
        },
      },
    });
    res.json({
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        created_at: c.createdAt,
        verifications: c._count.verifications,
        active_keys: c.apiKeys,
      })),
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/clients", async (req, res, next) => {
  try {
    const schema = z.object({ name: z.string().min(2).max(120) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Client name required", "bad_request");
    const client = await prisma.client.create({ data: { name: parsed.data.name } });
    res.status(201).json({ id: client.id, name: client.name });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/clients/:id/keys", async (req, res, next) => {
  try {
    const schema = z.object({
      label: z.string().min(1).max(80).default("default"),
      mode: z.enum(["live", "test"]).default("live"),
    });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) throw new ApiError(400, "Invalid key options", "bad_request");

    const client = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!client) throw new ApiError(404, "Client not found", "not_found");

    const gen = generateClientKey(parsed.data.mode);
    await prisma.apiKey.create({
      data: {
        clientId: client.id,
        label: parsed.data.label,
        keyHash: gen.hash,
        keyPrefix: gen.prefix,
      },
    });
    // Raw key returned exactly once.
    res.status(201).json({ key: gen.raw, prefix: gen.prefix, label: parsed.data.label });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/keys/:id", async (req, res, next) => {
  try {
    const key = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
    if (!key) throw new ApiError(404, "Key not found", "not_found");
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { revokedAt: new Date() },
    });
    res.json({ revoked: true });
  } catch (e) {
    next(e);
  }
});
