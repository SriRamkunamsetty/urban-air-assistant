"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AdviceResponse } from "@/lib/types";

const GROUPS = { routine: "Daily routine", indoor: "Indoor air", alternative: "Sustainable alternatives" } as const;

export default function Home() {
  const [data, setData] = useState<AdviceResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (data) headingRef.current?.focus(); }, [data]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const has = (k: string) => f.get(k) === "on";
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("/api/advice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: f.get("location"), children: has("children"), elderly: has("elderly"),
          respiratory: has("respiratory"), hasPurifier: has("hasPurifier"),
          commute: f.get("commute"), cooking: f.get("cooking"),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  return (
    <main id="main">
      <h1>Urban Air Quality Assistant</h1>
      <p>Tell us about your household. We use live air data to suggest low-emission routines, indoor air tips and sustainable alternatives.</p>
      <form onSubmit={onSubmit} aria-busy={loading}>
        <label htmlFor="location">City or area</label>
        <input id="location" name="location" type="text" required minLength={2} maxLength={80} autoComplete="address-level2" placeholder="e.g. Delhi" />
        <fieldset><legend>Who is in your household?</legend>
          <label><input type="checkbox" name="children" />Children under 12</label>
          <label><input type="checkbox" name="elderly" />Adults over 65</label>
          <label><input type="checkbox" name="respiratory" />Someone with asthma or a lung or heart condition</label>
        </fieldset>
        <label htmlFor="commute">Main way you get around</label>
        <select id="commute" name="commute" defaultValue="transit">
          <option value="walk">Walk</option><option value="cycle">Cycle</option><option value="transit">Public transport</option>
          <option value="car">Car</option><option value="remote">Mostly at home</option>
        </select>
        <label htmlFor="cooking">Cooking fuel</label>
        <select id="cooking" name="cooking" defaultValue="gas">
          <option value="gas">Gas</option><option value="electric">Electric or induction</option><option value="biomass">Wood or biomass</option>
        </select>
        <label><input type="checkbox" name="hasPurifier" />I have an air purifier</label>
        <button type="submit" disabled={loading}>{loading ? "Checking air quality…" : "Get my plan"}</button>
      </form>
      <div role="status" aria-live="polite">
        {error && <p className="card error">{error}</p>}
        {data && (
          <section className="card" aria-labelledby="result">
            <h2 id="result" tabIndex={-1} ref={headingRef}>{data.place}: AQI {data.aqi} ({data.category})</h2>
            <p>{data.summary}</p>
            {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((k) => {
              const items = data.actions.filter((a) => a.category === k);
              return items.length === 0 ? null : (
                <div key={k}><h3>{GROUPS[k]}</h3>
                  <ul>{items.map((a) => <li key={a.title}><strong>{a.title}.</strong> {a.why}</li>)}</ul></div>
              );
            })}
            <p className="muted">Data: Open-Meteo. Summary by {data.source === "gemini" ? "Google Gemini" : "our rules engine"}. General guidance, not medical advice.</p>
          </section>
        )}
      </div>
    </main>
  );
}
