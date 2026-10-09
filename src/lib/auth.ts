import { auth } from "@/lib/auth-server";
import { apiError, requestId } from "@/lib/http";

export async function requireUser(request: Request): Promise<{ userId: string } | Response> {
  const id = requestId(request);
  if (!auth) return apiError(503, "auth_not_configured", "Authentication is not configured yet.", id);
  try {
    const result = await auth.getSession();
    const user = result?.data?.user;
    if (!user?.id) return apiError(401, "unauthorized", "Please sign in to continue.", id);
    return { userId: user.id };
  } catch {
    return apiError(401, "unauthorized", "Please sign in to continue.", id);
  }
}

export function isAuthFailure(value: { userId: string } | Response): value is Response {
  return value instanceof Response;
}