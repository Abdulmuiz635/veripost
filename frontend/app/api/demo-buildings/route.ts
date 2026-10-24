import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function GET() {
  const res = await backend.publicGet("/v1/demo/buildings");
  const data = await res.json().catch(() => ({ buildings: [] }));
  return NextResponse.json(data, { status: res.status });
}
