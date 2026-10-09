import { requireUser, isAuthFailure } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isAuthFailure(auth)) return auth;
  // Return only after session verification is implemented.
  return Response.json({ data: { id: auth.userId } }, { headers: { "Cache-Control": "no-store" } });
}