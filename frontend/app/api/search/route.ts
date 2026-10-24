import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const res = await backend.clientGet(`/v1/search/autocomplete?q=${encodeURIComponent(q)}`);
  const data = await res.json().catch(() => ({ data: { suggestions: [] } }));
  return NextResponse.json(data, { status: res.status });
}
