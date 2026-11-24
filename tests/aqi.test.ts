import { describe, expect, it } from "vitest";
import { buildActions, categorize, effectiveLevel } from "../src/lib/aqi";
import type { Profile } from "../src/lib/types";

const base: Profile = { location: "Delhi", children: false, elderly: false, respiratory: false, hasPurifier: false, commute: "transit", cooking: "electric" };

describe("categorize", () => {
  it.each([[0, "Good"], [50, "Good"], [51, "Moderate"], [151, "Unhealthy"], [301, "Hazardous"]])("AQI %i is %s", (aqi, label) => {
    expect(categorize(aqi).label).toBe(label);
  });
});

describe("effectiveLevel", () => {
  it("shifts one band for sensitive households, capped at 5", () => {
    expect(effectiveLevel(120, base)).toBe(2);
    expect(effectiveLevel(120, { ...base, children: true })).toBe(3);
    expect(effectiveLevel(400, { ...base, elderly: true })).toBe(5);
  });
});

describe("buildActions", () => {
  it("recommends indoor exercise and sealing windows in heavy smog", () => {
    const titles = buildActions(220, base).map((a) => a.title.toLowerCase());
    expect(titles.some((t) => t.includes("indoors"))).toBe(true);
    expect(titles.some((t) => t.includes("windows closed"))).toBe(true);
  });
  it("suggests a mask for walkers and kitchen ventilation for gas stoves", () => {
    const t = buildActions(130, { ...base, commute: "walk", cooking: "gas" }).map((a) => a.title.toLowerCase());
    expect(t.some((x) => x.includes("mask"))).toBe(true);
    expect(t.some((x) => x.includes("exhaust"))).toBe(true);
  });
  it("encourages outdoor activity when air is good and every action explains its impact", () => {
    const actions = buildActions(30, base);
    expect(actions[0]?.title).toMatch(/outdoor/i);
    expect(actions.every((a) => a.why.length > 10)).toBe(true);
  });
});
