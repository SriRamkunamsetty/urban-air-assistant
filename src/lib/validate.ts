import { COMMUTES, COOKING, type Profile } from "./types";

export type Parsed = { ok: true; value: Profile } | { ok: false; error: string };

const LOCATION = /^[\p{L}\p{M}\p{N}\s,.'-]{2,80}$/u;
const bool = (v: unknown) => v === true || v === false;

/** Strictly validates untrusted input; unknown fields are dropped. */
export function parseProfile(input: unknown): Parsed {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Invalid request body." };
  const o = input as Record<string, unknown>;
  const location = typeof o.location === "string" ? o.location.trim() : "";
  if (!LOCATION.test(location)) return { ok: false, error: "Enter a city or area name (2-80 letters)." };
  if (![o.children, o.elderly, o.respiratory, o.hasPurifier].every(bool))
    return { ok: false, error: "Household options must be true or false." };
  if (!COMMUTES.includes(o.commute as never)) return { ok: false, error: "Invalid commute option." };
  if (!COOKING.includes(o.cooking as never)) return { ok: false, error: "Invalid cooking option." };
  return { ok: true, value: {
    location, children: o.children as boolean, elderly: o.elderly as boolean,
    respiratory: o.respiratory as boolean, hasPurifier: o.hasPurifier as boolean,
    commute: o.commute as Profile["commute"], cooking: o.cooking as Profile["cooking"],
  } };
}
