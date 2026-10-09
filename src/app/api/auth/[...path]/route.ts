import { auth } from "@/lib/auth-server";
import { apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

if (!auth) {
  const unavailable = () => apiError(503, "auth_not_configured", "Authentication is not configured yet.");
  export const GET = unavailable;
  export const POST = unavailable;
} else {
  export const { GET, POST } = auth.handler();
}