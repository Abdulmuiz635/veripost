// The Verified Address Record (VAR): a signed, auditable attestation the bank
// stores and can re-verify offline with VeriPost's public verify endpoint.
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config";
import type { Status } from "./scoring";

export interface VarPayload {
  postcode: string;
  status: Status;
  score: number;
  address: unknown;
  customerRef: string;
  clientId: string;
  provider: "live" | "mock" | "hybrid";
}

export interface SignedRecord {
  jti: string;
  token: string;
  issuedAt: string;
  expiresAt: string;
}

const TTL_DAYS = 90;

export function signRecord(payload: VarPayload): SignedRecord {
  const jti = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TTL_DAYS * 24 * 60 * 60;

  const token = jwt.sign(
    {
      jti,
      iss: "veripost",
      iat: now,
      exp,
      sub: payload.customerRef,
      postcode: payload.postcode,
      status: payload.status,
      score: payload.score,
      address: payload.address,
      client_id: payload.clientId,
      source: payload.provider,
    },
    config.jwtSigningKey,
    { algorithm: "HS256" }
  );

  return {
    jti,
    token,
    issuedAt: new Date(now * 1000).toISOString(),
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

export function verifyRecord(token: string): Record<string, unknown> | null {
  try {
    return jwt.verify(token, config.jwtSigningKey, {
      algorithms: ["HS256"],
    }) as Record<string, unknown>;
  } catch {
    return null;
  }
}
