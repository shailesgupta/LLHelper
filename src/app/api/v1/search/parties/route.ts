import { getSql } from "@/lib/db";
import { isAuthFailure, requireUser } from "@/lib/auth";
import { apiError, requestId, requireQuery } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rid = requestId(request);
  const auth = await requireUser(request);
  if (isAuthFailure(auth)) return auth;

  const q = requireQuery(new URL(request.url).searchParams.get("q"), 2, 100);
  if (!q) return apiError(400, "invalid_query", "Enter at least 2 characters to search.", rid);

  try {
    const sql = getSql();
    const digits = q.replace(/\D/g, "");
    const normalized = q.toLocaleLowerCase("en-IN").replace(/\s+/g, " ").trim();
    const rows = await sql.transaction([
      sql`select set_config('app.user_id', ${auth.userId}, true)`,
      sql`select p.id, coalesce(nullif(p.name, ''), nullif(p.pan_name, ''), p.aadhaar_name) as display_name,
                 p.party_category, case when p.mobile is null or p.mobile = '' then null else '••••••' || right(regexp_replace(p.mobile, '[^0-9]', '', 'g'), 4) end as mobile, p.pin, p.record_version,
                 case
                   when upper(coalesce(p.pan, '')) = upper(${q}) then 0
                   when ${digits.length >= 10} and regexp_replace(coalesce(p.aadhaar, ''), '[^0-9]', '', 'g') = ${digits} then 1
                   when regexp_replace(coalesce(p.mobile, ''), '[^0-9]', '', 'g') = ${digits} then 2
                   when lower(coalesce(p.name, '')) = ${normalized} then 3
                   when lower(coalesce(p.pan_name, '')) = ${normalized} then 4
                   else 5
                 end as rank
          from public.parties p
          where p.deleted_at is null and (
            upper(coalesce(p.pan, '')) = upper(${q}) or
            (${digits.length >= 10} and regexp_replace(coalesce(p.aadhaar, ''), '[^0-9]', '', 'g') = ${digits}) or
            (${digits.length >= 7} and regexp_replace(coalesce(p.mobile, ''), '[^0-9]', '', 'g') like ${digits + "%"}) or
            lower(coalesce(p.name, '')) like ${normalized + "%"} or
            lower(coalesce(p.pan_name, '')) like ${normalized + "%"} or
            lower(coalesce(p.aadhaar_name, '')) like ${normalized + "%"} or
            exists (select 1 from public.tags t where t.user_id = ${auth.userId} and t.entity_type = 'party' and t.entity_id = p.id and t.normalized_tag like ${normalized + "%"})
          )
          order by rank asc, coalesce(p.name, p.pan_name, p.aadhaar_name) asc
          limit 10`
    ]);
    const results = rows[1] as Array<Record<string, unknown>>;
    return Response.json({ data: results.map(({ rank, ...item }) => item) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiError(503, "search_unavailable", "Search is temporarily unavailable.", rid);
  }
}