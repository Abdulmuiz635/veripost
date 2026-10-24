import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const res = await backend.adminGet(`/admin/verifications/${params.id}`);
  const data = await res.json().catch(() => ({ error: "bad_gateway" }));
  return NextResponse.json(data, { status: res.status });
}
