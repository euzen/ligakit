// Football formations with tactical positions
// Coordinates: x (0-100, left-right), y (0-100, top-bottom, 0=opponent goal, 100=own goal)

export interface Position {
  x: number;
  y: number;
  role: "GK" | "DEF" | "MID" | "FWD";
  label: string;
}

export interface Formation {
  key: string;
  name: string;
  positions: Position[];
}

export const FORMATIONS: Formation[] = [
  {
    key: "4-4-2",
    name: "4-4-2 Classic",
    positions: [
      { x: 50, y: 95, role: "GK", label: "GK" },
      { x: 15, y: 78, role: "DEF", label: "LB" },
      { x: 38, y: 78, role: "DEF", label: "CB" },
      { x: 62, y: 78, role: "DEF", label: "CB" },
      { x: 85, y: 78, role: "DEF", label: "RB" },
      { x: 15, y: 52, role: "MID", label: "LM" },
      { x: 38, y: 52, role: "MID", label: "CM" },
      { x: 62, y: 52, role: "MID", label: "CM" },
      { x: 85, y: 52, role: "MID", label: "RM" },
      { x: 35, y: 25, role: "FWD", label: "ST" },
      { x: 65, y: 25, role: "FWD", label: "ST" },
    ],
  },
  {
    key: "4-3-3",
    name: "4-3-3 Attacking",
    positions: [
      { x: 50, y: 95, role: "GK", label: "GK" },
      { x: 15, y: 78, role: "DEF", label: "LB" },
      { x: 38, y: 78, role: "DEF", label: "CB" },
      { x: 62, y: 78, role: "DEF", label: "CB" },
      { x: 85, y: 78, role: "DEF", label: "RB" },
      { x: 30, y: 55, role: "MID", label: "CM" },
      { x: 50, y: 60, role: "MID", label: "CDM" },
      { x: 70, y: 55, role: "MID", label: "CM" },
      { x: 20, y: 30, role: "FWD", label: "LW" },
      { x: 50, y: 22, role: "FWD", label: "ST" },
      { x: 80, y: 30, role: "FWD", label: "RW" },
    ],
  },
  {
    key: "4-2-3-1",
    name: "4-2-3-1 Modern",
    positions: [
      { x: 50, y: 95, role: "GK", label: "GK" },
      { x: 15, y: 78, role: "DEF", label: "LB" },
      { x: 38, y: 78, role: "DEF", label: "CB" },
      { x: 62, y: 78, role: "DEF", label: "CB" },
      { x: 85, y: 78, role: "DEF", label: "RB" },
      { x: 35, y: 62, role: "MID", label: "CDM" },
      { x: 65, y: 62, role: "MID", label: "CDM" },
      { x: 20, y: 42, role: "MID", label: "LAM" },
      { x: 50, y: 38, role: "MID", label: "CAM" },
      { x: 80, y: 42, role: "MID", label: "RAM" },
      { x: 50, y: 20, role: "FWD", label: "ST" },
    ],
  },
  {
    key: "3-5-2",
    name: "3-5-2 Italian",
    positions: [
      { x: 50, y: 95, role: "GK", label: "GK" },
      { x: 25, y: 78, role: "DEF", label: "CB" },
      { x: 50, y: 80, role: "DEF", label: "CB" },
      { x: 75, y: 78, role: "DEF", label: "CB" },
      { x: 15, y: 50, role: "MID", label: "LWB" },
      { x: 35, y: 55, role: "MID", label: "CM" },
      { x: 50, y: 58, role: "MID", label: "CDM" },
      { x: 65, y: 55, role: "MID", label: "CM" },
      { x: 85, y: 50, role: "MID", label: "RWB" },
      { x: 35, y: 25, role: "FWD", label: "ST" },
      { x: 65, y: 25, role: "FWD", label: "ST" },
    ],
  },
  {
    key: "5-3-2",
    name: "5-3-2 Defensive",
    positions: [
      { x: 50, y: 95, role: "GK", label: "GK" },
      { x: 10, y: 76, role: "DEF", label: "LWB" },
      { x: 30, y: 80, role: "DEF", label: "CB" },
      { x: 50, y: 82, role: "DEF", label: "CB" },
      { x: 70, y: 80, role: "DEF", label: "CB" },
      { x: 90, y: 76, role: "DEF", label: "RWB" },
      { x: 30, y: 52, role: "MID", label: "CM" },
      { x: 50, y: 56, role: "MID", label: "CDM" },
      { x: 70, y: 52, role: "MID", label: "CM" },
      { x: 35, y: 25, role: "FWD", label: "ST" },
      { x: 65, y: 25, role: "FWD", label: "ST" },
    ],
  },
  {
    key: "3-4-3",
    name: "3-4-3 Offensive",
    positions: [
      { x: 50, y: 95, role: "GK", label: "GK" },
      { x: 25, y: 78, role: "DEF", label: "CB" },
      { x: 50, y: 80, role: "DEF", label: "CB" },
      { x: 75, y: 78, role: "DEF", label: "CB" },
      { x: 15, y: 52, role: "MID", label: "LM" },
      { x: 38, y: 55, role: "MID", label: "CM" },
      { x: 62, y: 55, role: "MID", label: "CM" },
      { x: 85, y: 52, role: "MID", label: "RM" },
      { x: 20, y: 28, role: "FWD", label: "LW" },
      { x: 50, y: 20, role: "FWD", label: "ST" },
      { x: 80, y: 28, role: "FWD", label: "RW" },
    ],
  },
  {
    key: "4-5-1",
    name: "4-5-1 Midfield",
    positions: [
      { x: 50, y: 95, role: "GK", label: "GK" },
      { x: 15, y: 78, role: "DEF", label: "LB" },
      { x: 38, y: 78, role: "DEF", label: "CB" },
      { x: 62, y: 78, role: "DEF", label: "CB" },
      { x: 85, y: 78, role: "DEF", label: "RB" },
      { x: 15, y: 52, role: "MID", label: "LM" },
      { x: 32, y: 55, role: "MID", label: "CM" },
      { x: 50, y: 58, role: "MID", label: "CDM" },
      { x: 68, y: 55, role: "MID", label: "CM" },
      { x: 85, y: 52, role: "MID", label: "RM" },
      { x: 50, y: 22, role: "FWD", label: "ST" },
    ],
  },
  {
    key: "1-2-1",
    name: "1-2-1 Futsal",
    positions: [
      { x: 50, y: 90, role: "GK", label: "GK" },
      { x: 30, y: 70, role: "DEF", label: "DF" },
      { x: 70, y: 70, role: "DEF", label: "DF" },
      { x: 50, y: 35, role: "FWD", label: "FP" },
    ],
  },
];

export function getFormation(key: string): Formation | undefined {
  return FORMATIONS.find((f) => f.key === key);
}

export function formationName(key: string, locale: string = "cs"): string {
  const f = getFormation(key);
  if (!f) return key;
  const [base] = f.name.split(" ");
  return locale === "cs" ? base : f.name;
}
