import type { Action, Profile } from "./types";

const BANDS = [
  { max: 50, label: "Good" },
  { max: 100, label: "Moderate" },
  { max: 150, label: "Unhealthy for sensitive groups" },
  { max: 200, label: "Unhealthy" },
  { max: 300, label: "Very unhealthy" },
  { max: Infinity, label: "Hazardous" },
] as const;

/** Maps a US AQI value to its EPA band (level 0-5). */
export function categorize(aqi: number): { label: string; level: number } {
  const level = Math.max(0, BANDS.findIndex((b) => aqi <= b.max));
  return { label: BANDS[level]!.label, level };
}

/** Children, older adults and people with respiratory conditions feel pollution one band worse. */
export function effectiveLevel(aqi: number, p: Profile): number {
  const sensitive = p.children || p.elderly || p.respiratory;
  return Math.min(5, categorize(aqi).level + (sensitive ? 1 : 0));
}

/** Deterministic, explainable recommendations. The LLM only rephrases these, never invents them. */
export function buildActions(aqi: number, p: Profile): Action[] {
  const lvl = effectiveLevel(aqi, p);
  const out: Action[] = [];
  const add = (a: Action) => out.push(a);

  if (lvl >= 3) {
    add({ category: "routine", title: "Move exercise and play indoors today",
      why: "Heavy breathing outdoors pulls fine particles (PM2.5) deep into the lungs; staying in cuts that dose." });
    add({ category: "routine", title: "Keep errands short and avoid early-morning and evening peaks",
      why: "Winter inversions trap smoke and traffic fumes near the ground at those hours." });
  } else if (lvl <= 1) {
    add({ category: "routine", title: "Good day for outdoor activity and a walk",
      why: "Low particle levels mean outdoor exercise is worth the benefit." });
  }
  if (lvl >= 2 && (p.commute === "walk" || p.commute === "cycle")) {
    add({ category: "routine", title: "Wear a fitted N95/FFP2 mask on your commute, or take transit",
      why: "Walking or cycling raises breathing rate, so you inhale more polluted air per minute; a well-fitted mask filters most fine particles." });
  }
  if (p.commute === "car") {
    add({ category: "alternative", title: "Carpool or use public transport at least some days",
      why: "Fewer cars and less idling means less local PM2.5 and NOx, which smog is made of." });
  }
  if (aqi > 100) {
    add({ category: "indoor", title: "Keep windows closed and seal door and window gaps",
      why: "Reduces outdoor smoke entering your home." });
    add({ category: "indoor", title: p.hasPurifier
        ? "Run your purifier on high in the room you use most, doors closed"
        : "Consider a HEPA purifier sized for your main room, or damp-mop daily",
      why: "HEPA filtration removes fine particles from indoor air; damp-mopping stops settled dust being re-suspended." });
    add({ category: "indoor", title: "Avoid candles, incense and indoor burning",
      why: "They add particles to air you are trying to keep clean." });
  } else if (aqi <= 50) {
    add({ category: "indoor", title: "Ventilate for 10 minutes now",
      why: "Clean outdoor air flushes out indoor pollutants from cooking and cleaning products." });
  }
  if (p.cooking !== "electric") {
    add({ category: "indoor", title: "Use the exhaust fan and cover pots while cooking",
      why: "Gas and biomass cooking emit PM2.5 and NO2 directly into your kitchen." });
    add({ category: "alternative", title: "Switch gradually to induction or electric cooking",
      why: "Removes the largest indoor combustion source and lowers household emissions." });
  }
  add({ category: "alternative", title: "Never burn waste or leaves; report open burning to local authorities",
    why: "Open burning is a major winter smog source, and community action lowers everyone's exposure." });
  return out;
}
