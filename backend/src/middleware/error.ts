import type { NextFunction, Request, Response } from "express";
import { NipostError } from "../lib/nipost";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "not_found", message: "Not found" } });
}

// Express 4 error handler (4 args required).
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code || "error", message: err.message } });
  }
  if (err instanceof NipostError) {
    return res.status(502).json({
      error: {
        code: "nipost_upstream",
        message: `NIPOST API error (${err.status}): ${err.message}`,
      },
    });
  }
  const message = err instanceof Error ? err.message : "Internal error";
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  return res.status(500).json({ error: { code: "internal", message } });
}
