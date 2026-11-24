export const COMMUTES = ["walk", "cycle", "transit", "car", "remote"] as const;
export const COOKING = ["gas", "electric", "biomass"] as const;

export interface Profile {
  location: string;
  children: boolean;
  elderly: boolean;
  respiratory: boolean;
  hasPurifier: boolean;
  commute: (typeof COMMUTES)[number];
  cooking: (typeof COOKING)[number];
}

export interface Action {
  category: "routine" | "indoor" | "alternative";
  title: string;
  why: string; // direct impact of the choice
}

export interface AdviceResponse {
  place: string;
  aqi: number;
  pm25: number | null;
  category: string;
  summary: string;
  actions: Action[];
  source: "gemini" | "rules";
}
