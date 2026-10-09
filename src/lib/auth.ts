import { apiError, requestId } from "@/lib/http";

/**
 * Authentication deliberately fails closed until the Neon Auth server-side
 * session verifier is wired and tested. Never trust user IDs from request data.
 */
export async function requireUser(request: Request): Promise<{ userId: string } | Response> {
  const id = requestId(request);
  if (!process.env.NEON_AUTH_BASE_URL || !process.env.NEON_AUTH_SECRET) {
    return apiError(503, "auth_not_configured", "Authentication is not configured yet.", id);
  }

  // TODO(api-foundation): integrate the official Neon Auth server session API.
  // Do not replace this with decoding an unverified JWT or trusting x-user-id.
  return apiError(503, "auth_verifier_unavailable", "Authentication is not ready yet.", id);
}

export function isAuthFailure(value: { userId: string } | Response): value is Response {
  return value instanceof Response;
}