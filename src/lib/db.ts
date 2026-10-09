import { neon } from "@neondatabase/serverless";

/**
 * Only configure DATABASE_URL with a dedicated restricted runtime role.
 * Do not use neondb_owner in deployed API runtime. Never expose this value to
 * the browser extension. Tenant queries must set app.user_id transaction-locally
 * from the verified auth session, not from client-supplied input.
 */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_OWNER_DATABASE_ROLE === "true") {
    throw new Error("Owner database roles are forbidden in production runtime");
  }
  return neon(url);
}