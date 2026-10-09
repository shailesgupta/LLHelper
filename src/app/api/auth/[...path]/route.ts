import { auth } from "@/lib/auth-server";
import { apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unavailable = () => apiError(503, "auth_not_configured", "Authentication is not configured yet.");
const handlers = auth?.handler();

export const GET = handlers?.GET ?? unavailable;
export const POST = handlers?.POST ?? unavailable;