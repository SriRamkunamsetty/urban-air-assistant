import { NextResponse } from "next/server";
import { buildActions, categorize } from "@/lib/aqi";
import { currentAir, geocode, summarize } from "@/lib/external";
import { allow } from "@/lib/rateLimit";
import type { AdviceResponse } from "@/lib/types";
import { parseProfile } from "@/lib/validate";

const MAX_BODY = 2_000;
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!allow(ip)) return fail("Too many requests. Please wait a minute.", 429);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return fail("Request too large.", 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return fail("Invalid JSON.", 400); }

  const parsed = parseProfile(body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const profile = parsed.value;

  try {
    const geo = await geocode(profile.location);
    if (!geo) return fail("We could not find that place. Try a nearby city.", 404);
    const { aqi, pm25 } = await currentAir(geo.lat, geo.lon);
    const { label } = categorize(aqi);
    const actions = buildActions(aqi, profile);

    const facts = `Place: ${geo.place}. US AQI: ${aqi} (${label}). PM2.5: ${pm25 ?? "n/a"} ug/m3. ` +
      `Actions: ${actions.map((a) => a.title).join("; ")}.`;
    const ai = await summarize(facts);
    const summary = ai ?? `Air quality in ${geo.place} is ${label.toLowerCase()} (AQI ${aqi}). Follow the steps below to lower your exposure.`;

    const result: AdviceResponse = { place: geo.place, aqi, pm25, category: label, summary, actions, source: ai ? "gemini" : "rules" };
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail("Air quality data is temporarily unavailable. Please try again.", 502);
  }
}
