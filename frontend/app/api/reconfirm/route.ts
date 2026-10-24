import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const res = await backend.clientPost("/v1/reconfirm", body);
  const data = await res.json().catch(() => ({ error: "bad_gateway" }));
  return NextResponse.json(data, { status: res.status });
}
