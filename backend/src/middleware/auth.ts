import type { NextFunction, Request, Response } from "express";
import { config } from "../config";
import { hashKey } from "../lib/keys";
import { prisma } from "../lib/prisma";
import { ApiError } from "./error";

// Attach the authenticated client to the request.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      client?: { id: string; name: string };
      apiKeyId?: string;
    }
  }
}

/** Bank-facing auth: X-Client-Key header, matched against stored key hashes. */
export async function requireClientKey(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const raw = req.header("X-Client-Key");
    if (!raw) throw new ApiError(401, "Missing X-Client-Key header", "missing_key");

    const key = await prisma.apiKey.findUnique({
      where: { keyHash: hashKey(raw) },
      include: { client: true },
    });
    if (!key || key.revokedAt) {
      throw new ApiError(401, "Invalid or revoked API key", "invalid_key");
    }

    req.client = { id: key.client.id, name: key.client.name };
    req.apiKeyId = key.id;
    next();
  } catch (e) {
    next(e);
  }
}

/** VeriPost-internal auth for the dashboard: X-Admin-Token. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token = req.header("X-Admin-Token");
  if (!token || token !== config.adminApiToken) {
    return next(new ApiError(401, "Admin authentication required", "admin_required"));
  }
  next();
}
