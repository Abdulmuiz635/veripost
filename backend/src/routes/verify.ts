import { Router } from "express";
import { z } from "zod";
import { requireClientKey } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { nipost, providerName } from "../lib/nipost";
import { isValidCode, format, matchDepth, depthRank } from "../lib/postcode";
import { prisma } from "../lib/prisma";
import { signRecord } from "../lib/record";
import { scoreVerification } from "../lib/scoring";

export const verifyRouter = Router();

const bodySchema = z.object({
  postcode: z.string().min(1),
  customer_ref: z.string().min(1).max(128),
  location: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .optional(),
  max_distance_m: z.number().min(0).max(250).optional(),
});

// A presence reading counts as a confirmation when it lands at area level or
// deeper and within 150m of a real unit.
export function isConfirming(depth: string, distanceM: number | null): boolean {
  return (
    depthRank(depth as never) >= depthRank("area") &&
    distanceM != null &&
    distanceM <= 150
  );
}

verifyRouter.post("/verify", requireClientKey, async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid body", "bad_request");
    }
    const { postcode, customer_ref, location, max_distance_m } = parsed.data;
    const clientId = req.client!.id;
    const api = nipost();

    // Fast reject on malformed input, before spending any lookup credit.
    if (!isValidCode(postcode)) {
      const v = await prisma.verification.create({
        data: {
          clientId,
          customerRef: customer_ref,
          claimedPostcode: format(postcode),
          matchDepth: "none",
          score: 0,
          status: "REJECTED",
          provider: providerName(),
        },
      });
      return res.json(shape(v, {
        reason: "Postcode is malformed and is not a valid NIPOST code.",
        breakdown: null,
        record: null,
      }));
    }

    // L2 lookup: validity + official administrative and house address.
    const lookup = await api.lookup(postcode, 2);
    const resolvedAddress = lookup.valid
      ? {
          administrative_address: lookup.administrative_address ?? null,
          recent_house_address: lookup.recent_house_address ?? null,
        }
      : null;

    // Reverse-geocode the live location to bind the address to the person.
    const reverse = location
      ? await api.reverse(location.lat, location.lng, max_distance_m ?? 250)
      : null;

    // Prior confirmations for this customer lift the score over time.
    const priorConfirmations = await prisma.presenceEvent.count({
      where: { customerRef: customer_ref },
    });

    const result = scoreVerification({
      claimedPostcode: postcode,
      valid: lookup.valid,
      reverse,
      presenceConfirmations: priorConfirmations,
    });

    // Sign a Verified Address Record for anything not outright rejected.
    let signed = null as null | ReturnType<typeof signRecord>;
    if (result.status !== "REJECTED") {
      signed = signRecord({
        postcode: format(postcode),
        status: result.status,
        score: result.score,
        address: resolvedAddress,
        customerRef: customer_ref,
        clientId,
        provider: providerName(),
      });
    }

    const verification = await prisma.verification.create({
      data: {
        clientId,
        customerRef: customer_ref,
        claimedPostcode: format(postcode),
        resolvedAddress: resolvedAddress ? JSON.stringify(resolvedAddress) : undefined,
        gpsLat: location?.lat,
        gpsLng: location?.lng,
        reversePostcode: result.reversePostcode ?? undefined,
        distanceM: result.distanceM ?? undefined,
        nipostConfidence: result.confidence ?? undefined,
        matchDepth: result.matchDepth,
        score: result.score,
        status: result.status,
        presenceConfirmations: priorConfirmations,
        recordJti: signed?.jti,
        provider: providerName(),
      },
    });

    // Record a presence event when the reading confirms the claim.
    if (reverse?.unit && isConfirming(result.matchDepth, result.distanceM)) {
      await prisma.presenceEvent.create({
        data: {
          verificationId: verification.id,
          customerRef: customer_ref,
          postcode: reverse.unit.postcode,
          distanceM: reverse.unit.distance_m,
          confidence: reverse.unit.confidence,
        },
      });
    }

    return res.json(
      shape(verification, {
        reason: result.reason,
        breakdown: result.breakdown,
        record: signed,
      })
    );
  } catch (e) {
    next(e);
  }
});

function shape(
  v: {
    id: string;
    customerRef: string;
    claimedPostcode: string;
    resolvedAddress: string | null;
    reversePostcode: string | null;
    distanceM: number | null;
    nipostConfidence: string | null;
    matchDepth: string;
    score: number;
    status: string;
    provider: string;
    createdAt: Date;
  },
  extra: { reason: string; breakdown: unknown; record: unknown }
) {
  return {
    id: v.id,
    customer_ref: v.customerRef,
    postcode: v.claimedPostcode,
    status: v.status,
    score: v.score,
    match_depth: v.matchDepth,
    distance_m: v.distanceM,
    confidence: v.nipostConfidence,
    reverse_postcode: v.reversePostcode,
    address: v.resolvedAddress ? JSON.parse(v.resolvedAddress) : null,
    reason: extra.reason,
    breakdown: extra.breakdown,
    record: extra.record,
    provider: v.provider,
    created_at: v.createdAt,
  };
}
