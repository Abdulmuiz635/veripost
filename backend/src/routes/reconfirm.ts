import { Router } from "express";
import { z } from "zod";
import { requireClientKey } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { nipost, providerName } from "../lib/nipost";
import { format, matchDepth } from "../lib/postcode";
import { prisma } from "../lib/prisma";
import { signRecord } from "../lib/record";
import { scoreVerification } from "../lib/scoring";
import { isConfirming } from "./verify";

export const reconfirmRouter = Router();

const bodySchema = z.object({
  customer_ref: z.string().min(1).max(128),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  postcode: z.string().optional(),
  max_distance_m: z.number().min(0).max(250).optional(),
});

// Re-run the presence check on a later session. A confirming reading is logged
// and can lift a previously FLAGGED customer to VERIFIED.
reconfirmRouter.post("/reconfirm", requireClientKey, async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid body", "bad_request");
    }
    const { customer_ref, location, postcode, max_distance_m } = parsed.data;
    const clientId = req.client!.id;

    // Find the most recent verification for this customer to anchor the claim.
    const latest = await prisma.verification.findFirst({
      where: { clientId, customerRef: customer_ref },
      orderBy: { createdAt: "desc" },
    });
    const claimed = postcode ? format(postcode) : latest?.claimedPostcode;
    if (!claimed) {
      throw new ApiError(
        404,
        "No prior verification for this customer. Call /verify first or pass a postcode.",
        "no_prior"
      );
    }

    const reverse = await nipost().reverse(location.lat, location.lng, max_distance_m ?? 250);
    const depth = reverse.unit ? matchDepth(claimed, reverse.unit.postcode) : "none";

    if (reverse.unit && isConfirming(depth, reverse.unit.distance_m)) {
      await prisma.presenceEvent.create({
        data: {
          verificationId: latest?.id,
          customerRef: customer_ref,
          postcode: reverse.unit.postcode,
          distanceM: reverse.unit.distance_m,
          confidence: reverse.unit.confidence,
        },
      });
    }

    const confirmations = await prisma.presenceEvent.count({
      where: { customerRef: customer_ref },
    });

    const result = scoreVerification({
      claimedPostcode: claimed,
      valid: true,
      reverse,
      presenceConfirmations: confirmations,
    });

    // Update the anchor verification to reflect the new standing.
    let record = null as null | ReturnType<typeof signRecord>;
    if (latest) {
      if (result.status === "VERIFIED" && latest.status !== "VERIFIED") {
        record = signRecord({
          postcode: claimed,
          status: result.status,
          score: result.score,
          address: latest.resolvedAddress ? JSON.parse(latest.resolvedAddress) : null,
          customerRef: customer_ref,
          clientId,
          provider: providerName(),
        });
      }
      await prisma.verification.update({
        where: { id: latest.id },
        data: {
          score: result.score,
          status: result.status,
          presenceConfirmations: confirmations,
          reversePostcode: result.reversePostcode ?? latest.reversePostcode,
          distanceM: result.distanceM ?? latest.distanceM,
          nipostConfidence: result.confidence ?? latest.nipostConfidence,
          matchDepth: result.matchDepth,
          recordJti: record?.jti ?? latest.recordJti,
        },
      });
    }

    return res.json({
      customer_ref,
      postcode: claimed,
      status: result.status,
      score: result.score,
      match_depth: result.matchDepth,
      distance_m: result.distanceM,
      confidence: result.confidence,
      presence_confirmations: confirmations,
      reason: result.reason,
      record,
    });
  } catch (e) {
    next(e);
  }
});
