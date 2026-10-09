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
    const normalized = q.toLocaleLowerCase("en-IN").replace(/\s+/g, " ").trim();
    const rows = await sql.transaction([
      sql`select set_config('app.user_id', ${auth.userId}, true)`,
      sql`select p.id, p.district_id, p.taluka_id, p.village_id, p.developed_land_types_id,
                 p.DAQ_262, p.DAQunit_262, p.DAR_262, p.DFP_262, p.DBD_262, p.AAQ_262,
                 p.DMI_262, p.DBK_262, p.DMJ_262, p.attribute_id, p.attribute_value,
                 p.attribute_value1, p.attribute_value2, p.record_version
          from public.properties p
          where p.deleted_at is null and (
            lower(coalesce(p.DFP_262, '')) like ${normalized + "%"} or
            lower(coalesce(p.DBD_262, '')) like ${normalized + "%"} or
            lower(coalesce(p.DBK_262, '')) like ${"%" + normalized + "%"} or
            lower(concat_ws(' ', p.DFP_262, p.DBD_262)) like ${normalized + "%"} or
            lower(concat_ws(' ', p.DMJ_262, p.attribute_value, p.attribute_value1, p.attribute_value2)) like ${normalized + "%"} or
            exists (select 1 from public.tags t where t.user_id = ${auth.userId} and t.entity_type = 'property' and t.entity_id = p.id and t.normalized_tag like ${normalized + "%"})
          )
          order by case when lower(concat_ws(' ', p.DFP_262, p.DBD_262)) = ${normalized} then 0 else 1 end,
                   p.updated_at desc
          limit 10`
    ]);
    return Response.json({ data: rows[1] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiError(503, "search_unavailable", "Search is temporarily unavailable.", rid);
  }
}