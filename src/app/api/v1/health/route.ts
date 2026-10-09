import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    data: { service: "llhelper-api", version: "v1", status: "ok" }
  }, { headers: { "Cache-Control": "no-store" } });
}