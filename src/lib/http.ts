import { NextResponse } from "next/server";

export function apiError(status: number, code: string, message: string, requestId?: string) {
  return NextResponse.json(
    { error: { code, message, ...(requestId ? { requestId } : {}) } },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export function requestId(request: Request) {
  return request.headers.get("x-vercel-id") ?? crypto.randomUUID();
}

export function requireQuery(value: string | null, min = 2, max = 100) {
  const q = (value ?? "").trim().replace(/\s+/g, " ");
  if (q.length < min || q.length > max) return null;
  return q;
}