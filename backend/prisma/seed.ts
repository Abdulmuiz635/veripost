// Seeds a demo bank client, a fixed demo API key, and a spread of sample
// verifications so the dashboard looks alive on first run.
//
// The demo key is fixed so the frontend can reference it from its env.
// Run: npm run db:seed
import { PrismaClient } from "@prisma/client";
import { hashKey } from "../src/lib/keys";
import { MOCK_BUILDINGS } from "../src/lib/nipost";

const prisma = new PrismaClient();

const DEMO_CLIENT_KEY = "vp_test_demo_key_000000000000000000";

type Status = "VERIFIED" | "FLAGGED" | "UNVERIFIED" | "REJECTED";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function main() {
  const client = await prisma.client.upsert({
    where: { id: "demo-client" },
    update: {},
    create: { id: "demo-client", name: "First Harvest Bank (Demo)" },
  });

  const keyHash = hashKey(DEMO_CLIENT_KEY);
  const existing = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!existing) {
    await prisma.apiKey.create({
      data: {
        clientId: client.id,
        label: "Onboarding demo",
        keyHash,
        keyPrefix: DEMO_CLIENT_KEY.slice(0, 12),
      },
    });
  }

  // Clear and reseed sample verifications for a clean demo dataset.
  await prisma.presenceEvent.deleteMany({ where: { customerRef: { startsWith: "cust_" } } });
  await prisma.verification.deleteMany({ where: { customerRef: { startsWith: "cust_" } } });

  const plan: { status: Status; score: number; depth: string; dist: number | null; conf: string | null }[] = [
    { status: "VERIFIED", score: 92, depth: "unit", dist: 14, conf: "high" },
    { status: "VERIFIED", score: 88, depth: "unit", dist: 22, conf: "high" },
    { status: "VERIFIED", score: 81, depth: "area", dist: 41, conf: "medium" },
    { status: "VERIFIED", score: 90, depth: "unit", dist: 11, conf: "high" },
    { status: "FLAGGED", score: 58, depth: "district", dist: 120, conf: "medium" },
    { status: "FLAGGED", score: 47, depth: "area", dist: 190, conf: "low" },
    { status: "FLAGGED", score: 0, depth: "none", dist: null, conf: null },
    { status: "UNVERIFIED", score: 22, depth: "lga", dist: 240, conf: "low" },
    { status: "REJECTED", score: 0, depth: "none", dist: null, conf: null },
    { status: "VERIFIED", score: 85, depth: "unit", dist: 19, conf: "high" },
    { status: "VERIFIED", score: 79, depth: "area", dist: 55, conf: "medium" },
    { status: "FLAGGED", score: 51, depth: "district", dist: 140, conf: "medium" },
  ];

  let i = 0;
  for (const p of plan) {
    const b = pick(MOCK_BUILDINGS);
    const created = daysAgo(Math.floor((i / plan.length) * 14) + Math.floor(Math.random() * 2));
    const v = await prisma.verification.create({
      data: {
        clientId: client.id,
        customerRef: `cust_${String(1000 + i)}`,
        claimedPostcode: p.status === "REJECTED" ? "LA-99-Z99-ZZ-99" : b.postcode,
        resolvedAddress:
          p.status === "REJECTED"
            ? undefined
            : JSON.stringify({
                administrative_address: b.admin,
                recent_house_address: { recent: b.recent },
              }),
        gpsLat: p.dist != null ? b.lat : undefined,
        gpsLng: p.dist != null ? b.lng : undefined,
        reversePostcode: p.dist != null ? b.postcode : undefined,
        distanceM: p.dist ?? undefined,
        nipostConfidence: p.conf ?? undefined,
        matchDepth: p.depth,
        score: p.score,
        status: p.status,
        provider: "mock",
        createdAt: created,
      },
    });
    if (p.status === "VERIFIED" && p.dist != null && p.dist <= 150) {
      await prisma.presenceEvent.create({
        data: {
          verificationId: v.id,
          customerRef: v.customerRef,
          postcode: b.postcode,
          distanceM: p.dist,
          confidence: p.conf ?? "medium",
          createdAt: created,
        },
      });
    }
    i++;
  }

  console.log("\nSeed complete.");
  console.log("  Demo client:   First Harvest Bank (Demo)");
  console.log(`  Demo API key:  ${DEMO_CLIENT_KEY}`);
  console.log("  (set this as DEMO_CLIENT_KEY in the frontend .env)\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
