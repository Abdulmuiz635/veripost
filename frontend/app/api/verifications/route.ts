import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function GET(req: Request) {
  const qs = new URL(req.url).searchParams.toString();
  const res = await backend.adminGet(`/admin/verifications${qs ? `?${qs}` : ""}`);
  const data = await res.json().catch(() => ({ verifications: [] }));
  return NextResponse.json(data, { status: res.status });
}
