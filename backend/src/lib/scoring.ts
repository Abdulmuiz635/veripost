// VeriPost scoring.
//
// The score answers one question: how confident are we that this postcode
// belongs to this customer? Validity (L1) is a GATE, not part of the score.
// The binding signal comes from reverse-geocoding the live location and
// comparing the nearest real postcode to the claimed one.
//
//   location depth (0-50) + distance (0-25) + nipost confidence (0-25) = 0-100
//
// A single far reading does not reject a customer. It flags them for step-up
// review, and repeated confirmations at the registered address (via /reconfirm)
// lift a FLAGGED result to VERIFIED over time.
import { config } from "../config";
import type { ReverseResult } from "./nipost";
import { MatchDepth, matchDepth } from "./postcode";

export type Status = "VERIFIED" | "FLAGGED" | "UNVERIFIED" | "REJECTED";

export interface ScoreInput {
  claimedPostcode: string;
  valid: boolean; // L1 result for the claimed code
  reverse: ReverseResult | null; // reverse geocode of the live location (optional)
  presenceConfirmations?: number;
}

export interface ScoreBreakdown {
  depthPoints: number;
  distancePoints: number;
  confidencePoints: number;
  presenceBonus: number;
}

export interface ScoreResult {
  score: number;
  status: Status;
  matchDepth: MatchDepth;
  distanceM: number | null;
  confidence: string | null;
  reversePostcode: string | null;
  breakdown: ScoreBreakdown;
  reason: string;
}

const DEPTH_POINTS: Record<MatchDepth, number> = {
  none: 0,
  state: 5,
  lga: 12,
  district: 25,
  area: 38,
  unit: 50,
};

function distancePoints(d: number): number {
  if (d <= 25) return 25;
  if (d <= 75) return 18;
  if (d <= 150) return 10;
  if (d <= 250) return 4;
  return 0;
}

function confidencePoints(c: string | undefined): number {
  if (c === "high") return 25;
  if (c === "medium") return 15;
  if (c === "low") return 5;
  return 0;
}

export function scoreVerification(input: ScoreInput): ScoreResult {
  const empty: ScoreBreakdown = {
    depthPoints: 0,
    distancePoints: 0,
    confidencePoints: 0,
    presenceBonus: 0,
  };

  // Gate: an invalid postcode can never be verified.
  if (!input.valid) {
    return {
      score: 0,
      status: "REJECTED",
      matchDepth: "none",
      distanceM: null,
      confidence: null,
      reversePostcode: null,
      breakdown: empty,
      reason: "Postcode is not valid in the NIPOST registry.",
    };
  }

  // No location supplied: we can confirm the address is real but cannot yet
  // bind it to the person. That is an explicit FLAGGED state, not a pass.
  if (!input.reverse || !input.reverse.found || !input.reverse.unit) {
    return {
      score: 0,
      status: "FLAGGED",
      matchDepth: "none",
      distanceM: null,
      confidence: null,
      reversePostcode: null,
      breakdown: empty,
      reason:
        "Valid postcode, but no location match yet. Awaiting a presence signal to bind the address to the customer.",
    };
  }

  const unit = input.reverse.unit;
  const depth = matchDepth(input.claimedPostcode, unit.postcode);
  const breakdown: ScoreBreakdown = {
    depthPoints: DEPTH_POINTS[depth],
    distancePoints: distancePoints(unit.distance_m),
    confidencePoints: confidencePoints(unit.confidence),
    presenceBonus: 0,
  };

  // Repeated confirmations lift confidence, capped so it cannot alone pass.
  const confirmations = Math.max(0, input.presenceConfirmations ?? 0);
  breakdown.presenceBonus = Math.min(confirmations * 10, 20);

  let score =
    breakdown.depthPoints +
    breakdown.distancePoints +
    breakdown.confidencePoints +
    breakdown.presenceBonus;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let status: Status;
  let reason: string;
  if (score >= config.score.verifiedMin) {
    status = "VERIFIED";
    reason = `Live location matches the claimed postcode to ${depth} level at ${unit.distance_m}m.`;
  } else if (score >= config.score.flaggedMin) {
    status = "FLAGGED";
    reason = `Partial match (${depth} level, ${unit.distance_m}m). Route to step-up review or reconfirm on later sessions.`;
  } else {
    status = "UNVERIFIED";
    reason = `Live location does not support the claimed postcode (${depth} level, ${unit.distance_m}m).`;
  }

  return {
    score,
    status,
    matchDepth: depth,
    distanceM: unit.distance_m,
    confidence: unit.confidence,
    reversePostcode: unit.postcode,
    breakdown,
    reason,
  };
}
