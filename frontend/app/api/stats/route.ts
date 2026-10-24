import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function GET() {
  const res = await backend.adminGet("/admin/stats");
  const data = await res.json().catch(() => ({ error: "bad_gateway" }));
  return NextResponse.json(data, { status: res.status });
}
