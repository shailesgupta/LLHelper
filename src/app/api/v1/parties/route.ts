import { z } from "zod";
import { getSql } from "@/lib/db";
import { isAuthFailure, requireUser } from "@/lib/auth";
import { apiError, requestId } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const optionalText = z.string().trim().max(2000).optional().transform(v => v || null);
const partySchema = z.object({
  party_category: z.string().trim().min(1).max(40).default("individual"),
  name: optionalText,
  pan_name: optionalText,
  aadhaar_name: optionalText,
  gender: optionalText,
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  age: z.number().int().min(0).max(120).optional().nullable(),
  age_as_of_year: z.number().int().min(1900).max(2200).optional().nullable(),
  aadhaar: z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().regex(/^\d{12}$/)).optional().nullable(),
  pan: z.string().transform(v => v.trim().toUpperCase()).pipe(z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/)).optional().nullable(),
  mobile: z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().regex(/^\d{10}$/)).optional().nullable(),
  pin: z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().regex(/^\d{6}$/)).optional().nullable(),
  address: optionalText,
  email: z.string().trim().email().max(320).optional().nullable(),
  mother_name: optionalText,
  alias_name: optionalText,
  occupation_id: optionalText,
  extra_fields: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: Request) {
  const rid = requestId(request);
  const auth = await requireUser(request);
  if (isAuthFailure(auth)) return auth;
  let raw: unknown;
  try { raw = await request.json(); } catch { return apiError(400, "invalid_json", "Request body must be JSON.", rid); }
  const parsed = partySchema.safeParse(raw);
  if (!parsed.success) return apiError(400, "invalid_party", "One or more party fields are invalid.", rid);

  try {
    const p = parsed.data;
    const sql = getSql();
    const results = await sql.transaction([
      sql`select set_config('app.user_id', ${auth.userId}, true)`,
      sql`select id from public.parties where deleted_at is null and (
        (${p.pan ?? null}::text is not null and upper(pan) = ${p.pan ?? null}) or
        (${p.aadhaar ?? null}::text is not null and regexp_replace(coalesce(aadhaar, ''), '[^0-9]', '', 'g') = ${p.aadhaar ?? null})
      ) limit 1`,
      sql`insert into public.parties
        (user_id, party_category, name, pan_name, aadhaar_name, gender, dob, age, age_as_of_year,
         aadhaar, pan, mobile, pin, address, email, mother_name, alias_name, occupation_id, extra_fields)
        select ${auth.userId}::uuid, ${p.party_category}, ${p.name ?? null}, ${p.pan_name ?? null},
         ${p.aadhaar_name ?? null}, ${p.gender ?? null}, ${p.dob ?? null}::date, ${p.age ?? null},
         ${p.age_as_of_year ?? null}, ${p.aadhaar ?? null}, ${p.pan ?? null}, ${p.mobile ?? null},
         ${p.pin ?? null}, ${p.address ?? null}, ${p.email ?? null}, ${p.mother_name ?? null},
         ${p.alias_name ?? null}, ${p.occupation_id ?? null}, ${JSON.stringify(p.extra_fields ?? {})}::jsonb
        where not exists (
          select 1 from public.parties existing where existing.deleted_at is null and (
            (${p.pan ?? null}::text is not null and upper(existing.pan) = ${p.pan ?? null}) or
            (${p.aadhaar ?? null}::text is not null and regexp_replace(coalesce(existing.aadhaar, ''), '[^0-9]', '', 'g') = ${p.aadhaar ?? null})
          )
        )
        returning id, party_category, name, pan_name, aadhaar_name, gender, dob, age, age_as_of_year,
          aadhaar, pan, mobile, pin, address, email, mother_name, alias_name, occupation_id, extra_fields, record_version, created_at, updated_at`
    ]);
    const duplicate = (results[1] as Array<Record<string, unknown>>)[0];
    const created = (results[2] as Array<Record<string, unknown>>)[0];
    if (duplicate) return apiError(409, "duplicate_party", "A party with this PAN or Aadhaar already exists. Review the existing record before updating.", rid);
    if (!created) return apiError(409, "duplicate_party", "A party with this PAN or Aadhaar already exists. Review the existing record before updating.", rid);
    return Response.json({ data: created }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiError(503, "party_create_unavailable", "Could not save the party right now.", rid);
  }
}