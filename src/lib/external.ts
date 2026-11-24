const TIMEOUT_MS = 6000;

async function getJson(url: string, revalidate: number): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate } });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return res.json();
}

/** Resolves a place name to coordinates (Open-Meteo geocoding, no key needed). Cached 24h. */
export async function geocode(name: string) {
  const q = encodeURIComponent(name);
  const data = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1`, 86_400);
  const r = data?.results?.[0];
  if (!r) return null;
  return { place: [r.name, r.admin1, r.country].filter(Boolean).join(", "), lat: r.latitude as number, lon: r.longitude as number };
}

/** Current US AQI and PM2.5 (Open-Meteo air quality). Cached 10 min to save upstream calls. */
export async function currentAir(lat: number, lon: number) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5`;
  const c = (await getJson(url, 600))?.current;
  if (typeof c?.us_aqi !== "number") throw new Error("No AQI data");
  return { aqi: Math.round(c.us_aqi), pm25: typeof c.pm2_5 === "number" ? c.pm2_5 : null };
}

/** Asks Gemini to write a short, friendly summary. Receives only server-built facts, never raw user text. */
export async function summarize(facts: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text:
          "You are a calm air-quality assistant for families. In at most 80 words, plain language, explain today's " +
          "air quality and why the listed actions matter. Use only the facts given. No medical diagnosis; for symptoms advise seeing a doctor." }] },
        contents: [{ role: "user", parts: [{ text: facts }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
      }),
    });
    if (!res.ok) return null;
    const text = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}
