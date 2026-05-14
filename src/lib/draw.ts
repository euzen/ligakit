/** Slot = team identified by either a real teamId or a guest name */
export interface DrawSlot {
  teamId: string | null;
  teamName: string;
}

export interface GeneratedMatch {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  round: number;
  /** position within the round (0-indexed). Used for bracket advancement. */
  bracketPos?: number;
  /** optional group label, e.g. "A", "B" */
  group?: string;
  /** bracket stage label, e.g. "QF", "SF", "F" */
  stage?: string;
}

// ─────────────────────────────────────────────
//  CUP ADVANCEMENT CONFIGURATION
// ─────────────────────────────────────────────

export type CupAdvancementPreset =
  | "WINNERS_ONLY"      // 1 ze skupiny - současný default
  | "TOP2_CROSS"       // 2 ze skupiny, křížení: W_A vs 2_B, W_B vs 2_A
  | "TOP2_STRAIGHT"    // 2 ze skupiny, rovné: W_A vs 2_A, W_B vs 2_B (jen 2 skupiny)
  | "TOP2_BEST_3RD"    // 2 ze skupiny + nejlepší 3. místa (4 skupiny → osmifinále)
  | "TOP3_ALL"         // 3 ze skupiny
  | "CUSTOM";          // Vlastní konfigurace

export interface CupAdvancementConfig {
  preset: CupAdvancementPreset;
  teamsPerGroup: number;       // 1, 2, nebo 3
  thirdPlaceAdvance?: number;   // kolik nejlepších 3. míst postupuje
  customPairings?: CustomPairing[];
}

export interface CustomPairing {
  round: number;
  matchNumber: number;
  home: { groupIndex: number; position: 1 | 2 | 3 };  // 1=vítěz, 2=druhý, 3=třetí
  away: { groupIndex: number; position: 1 | 2 | 3 };
}

export const PRESET_LABELS_CS: Record<CupAdvancementPreset, { name: string; desc: string }> = {
  WINNERS_ONLY: { name: "Pouze vítězové", desc: "Z každé skupiny postupuje pouze vítěz" },
  TOP2_CROSS: { name: "První dva – křížení", desc: "W_A vs 2_B, W_B vs 2_A atd." },
  TOP2_STRAIGHT: { name: "První dva – rovné", desc: "W_A vs 2_A, W_B vs 2_B (jen 2 skupiny)" },
  TOP2_BEST_3RD: { name: "První dva + nejlepší třetí", desc: "2 ze skupiny + nejlepší 3. místa → 16 týmů" },
  TOP3_ALL: { name: "První tři", desc: "Z každé skupiny postupují první tři" },
  CUSTOM: { name: "Vlastní", desc: "Ručně definované párování" },
};

export const PRESET_LABELS_EN: Record<CupAdvancementPreset, { name: string; desc: string }> = {
  WINNERS_ONLY: { name: "Winners only", desc: "Only group winners advance" },
  TOP2_CROSS: { name: "Top 2 – crossed", desc: "W_A vs 2_B, W_B vs 2_A etc." },
  TOP2_STRAIGHT: { name: "Top 2 – straight", desc: "W_A vs 2_A, W_B vs 2_B (2 groups only)" },
  TOP2_BEST_3RD: { name: "Top 2 + best 3rd", desc: "2 from group + best 3rds → 16 teams" },
  TOP3_ALL: { name: "Top 3", desc: "Top 3 from each group advance" },
  CUSTOM: { name: "Custom", desc: "Manually defined pairings" },
};

/** Get available presets for given number of groups and teams */
export function getAvailablePresets(numGroups: number, teamsPerGroup: number): CupAdvancementPreset[] {
  const all: CupAdvancementPreset[] = ["WINNERS_ONLY", "CUSTOM"];

  if (teamsPerGroup >= 2) {
    if (numGroups === 2) {
      all.push("TOP2_STRAIGHT", "TOP2_CROSS");
    } else if (numGroups >= 2) {
      all.push("TOP2_CROSS");
    }
  }

  if (teamsPerGroup >= 2 && numGroups === 4 && teamsPerGroup === 2) {
    all.push("TOP2_BEST_3RD");
  }

  if (teamsPerGroup >= 3 && numGroups >= 2) {
    all.push("TOP3_ALL");
  }

  return all;
}

/** Get total teams advancing for a preset */
export function getAdvancingTeamCount(
  numGroups: number,
  config: CupAdvancementConfig
): number {
  const { preset, teamsPerGroup, thirdPlaceAdvance = 0 } = config;

  switch (preset) {
    case "WINNERS_ONLY":
      return numGroups;
    case "TOP2_CROSS":
    case "TOP2_STRAIGHT":
      return numGroups * 2;
    case "TOP2_BEST_3RD":
      return numGroups * 2 + thirdPlaceAdvance;
    case "TOP3_ALL":
      return numGroups * 3;
    case "CUSTOM":
      return config.customPairings?.length ?? numGroups;
    default:
      return numGroups;
  }
}

/** Fisher-Yates shuffle (in-place, returns same array) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function slotPayload(s: DrawSlot) {
  return {
    homeTeamId: null as string | null,
    awayTeamId: null as string | null,
    homeTeamName: null as string | null,
    awayTeamName: null as string | null,
  };
}

function matchFromPair(
  home: DrawSlot,
  away: DrawSlot,
  round: number,
  extra?: Partial<GeneratedMatch>,
): GeneratedMatch {
  return {
    homeTeamId: home.teamId,
    awayTeamId: away.teamId,
    homeTeamName: home.teamId ? null : home.teamName,
    awayTeamName: away.teamId ? null : away.teamName,
    round,
    ...extra,
  };
}

// ─────────────────────────────────────────────
//  ROUND-ROBIN (league / cup groups)
//  Uses "circle method" — O(n^2) with proper
//  round scheduling so no team plays twice/round
// ─────────────────────────────────────────────
export function generateRoundRobin(
  teams: DrawSlot[],
  options: { doubleLegs?: boolean; groupLabel?: string; roundOffset?: number } = {},
): GeneratedMatch[] {
  const shuffled = shuffle([...teams]);
  const n = shuffled.length;
  const results: GeneratedMatch[] = [];
  const { doubleLegs = false, groupLabel, roundOffset = 0 } = options;

  // Add BYE if odd number
  const slots: (DrawSlot | null)[] = n % 2 === 0 ? [...shuffled] : [...shuffled, null];
  const total = slots.length;
  const rounds = total - 1;

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < total / 2; i++) {
      const home = slots[i];
      const away = slots[total - 1 - i];
      if (home && away) {
        results.push(matchFromPair(home, away, r + 1 + roundOffset, { group: groupLabel }));
      }
    }
    // Rotate: fix first element, rotate rest
    const last = slots.pop()!;
    slots.splice(1, 0, last);
  }

  if (doubleLegs) {
    const firstLeg = results.map((m) =>
      matchFromPair(
        { teamId: m.awayTeamId, teamName: m.awayTeamName ?? "" },
        { teamId: m.homeTeamId, teamName: m.homeTeamName ?? "" },
        m.round + rounds,
        { group: groupLabel },
      ),
    );
    results.push(...firstLeg);
  }

  return results;
}

// ─────────────────────────────────────────────
//  BERGER TABLES (round-robin with fixed seeding)
//  Teams are pre-assigned seed numbers 1..N.
//  Team at position N (or N+1 for odd) is fixed;
//  all others rotate clockwise each round.
//  BYE is added automatically for odd N.
// ─────────────────────────────────────────────

/**
 * Generate a round-robin schedule using Berger tables.
 * `seededTeams` must be ordered by seed: index 0 = seed 1, index 1 = seed 2, …
 * Pass teams in any order and provide `seedMap` to override the seed order.
 */
export function generateBerger(
  teams: DrawSlot[],
  options: { doubleLegs?: boolean; roundOffset?: number } = {},
): GeneratedMatch[] {
  const { doubleLegs = false, roundOffset = 0 } = options;
  const results: GeneratedMatch[] = [];

  // If odd, add a BYE placeholder at the end
  const slots: (DrawSlot | null)[] = teams.length % 2 === 0
    ? [...teams]
    : [...teams, null]; // null = BYE

  const n = slots.length; // always even
  const rounds = n - 1;

  // The last slot is fixed throughout
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < n / 2; i++) {
      const home = slots[i];
      const away = slots[n - 1 - i];
      // Skip BYE matchups
      if (home && away) {
        results.push(matchFromPair(home, away, r + 1 + roundOffset));
      }
    }
    // Rotate: fix slot[n-1] (last), rotate the rest clockwise
    // Move last-before-fixed to position 1, shift others right
    const fixed = slots[n - 1];
    const rotating = slots.slice(0, n - 1);
    const last = rotating.pop()!; // take last of rotating
    rotating.splice(1, 0, last);  // insert at position 1
    slots.splice(0, n - 1, ...rotating);
    slots[n - 1] = fixed;
  }

  if (doubleLegs) {
    const firstLeg = [...results];
    firstLeg.forEach((m) => {
      results.push(
        matchFromPair(
          { teamId: m.awayTeamId, teamName: m.awayTeamName ?? "" },
          { teamId: m.homeTeamId, teamName: m.homeTeamName ?? "" },
          m.round + rounds,
        ),
      );
    });
  }

  return results;
}

// ─────────────────────────────────────────────
//  SINGLE-ELIMINATION BRACKET
//  Generates ALL rounds upfront with TBD slots.
//  bracketPos (0-indexed) identifies each match's
//  position so vítěz can be filled in immediately.
//
//  Advancement rule:
//    winner of pos p in round r → slot in round r+1
//    at pos floor(p/2), home if p even, away if p odd
// ─────────────────────────────────────────────
export const BRACKET_STAGE_LABELS: Record<number, string> = {
  2: "F",
  4: "SF",
  8: "QF",
  16: "R16",
  32: "R32",
};

const TBD: DrawSlot = { teamId: null, teamName: "TBD" };

export function generateBracket(
  teams: DrawSlot[],
  options: { roundOffset?: number; thirdPlaceMatch?: boolean } = {},
): GeneratedMatch[] {
  const shuffled = shuffle([...teams]);
  const { roundOffset = 0, thirdPlaceMatch = false } = options;

  // Pad to next power of 2
  let size = 1;
  while (size < shuffled.length) size *= 2;

  // totalRounds = log2(size)
  const totalRounds = Math.log2(size);
  const results: GeneratedMatch[] = [];

  // For each round, generate size/2^r matches
  // Round 1: size/2 matches, Round 2: size/4, ..., Final: 1
  for (let r = 1; r <= totalRounds; r++) {
    const matchesInRound = size / Math.pow(2, r);
    const slotsInRound = matchesInRound * 2; // teams "in" this round
    const stage = BRACKET_STAGE_LABELS[slotsInRound] ?? `R${slotsInRound}`;

    for (let pos = 0; pos < matchesInRound; pos++) {
      if (r === 1) {
        // First round: assign real teams (or BYE)
        const homeIdx = pos * 2;
        const awayIdx = pos * 2 + 1;
        const homeSlot = shuffled[homeIdx] ?? null;
        const awaySlot = shuffled[awayIdx] ?? null;

        // BYE: only one team → skip match (auto-advance)
        if (homeSlot && !awaySlot) continue;

        const home = homeSlot ?? TBD;
        const away = awaySlot ?? TBD;
        results.push({
          ...matchFromPair(home, away, r + roundOffset, { stage }),
          bracketPos: pos,
        });
      } else {
        // Future rounds: both slots TBD — will be filled as winners advance
        results.push({
          ...matchFromPair(TBD, TBD, r + roundOffset, { stage }),
          bracketPos: pos,
        });
      }
    }
  }

  // 3rd place match: same round as final, bracketPos = -1 (special sentinel)
  if (thirdPlaceMatch && totalRounds >= 2) {
    const finalRound = totalRounds + roundOffset;
    results.push({
      ...matchFromPair(TBD, TBD, finalRound, { stage: "3rd" }),
      bracketPos: -1,
    });
  }

  return results;
}

// ─────────────────────────────────────────────
//  CUP: groups (round-robin) + bracket from
//       group winners/runners-up with presets
// ─────────────────────────────────────────────

/** Generate bracket slots based on advancement preset */
function generateBracketSlots(
  numGroups: number,
  config: CupAdvancementConfig,
): DrawSlot[] {
  const groupLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const { preset, teamsPerGroup, thirdPlaceAdvance = 0 } = config;

  const makeSlot = (groupIdx: number, position: 1 | 2 | 3): DrawSlot => ({
    teamId: null,
    teamName: `${position === 1 ? "1st" : position === 2 ? "2nd" : "3rd"} ${groupLabels[groupIdx] ?? `G${groupIdx + 1}`}`,
  });

  switch (preset) {
    case "WINNERS_ONLY":
      return Array.from({ length: numGroups }, (_, g) => makeSlot(g, 1));

    case "TOP2_CROSS": {
      // W_A vs 2_B, W_B vs 2_A etc. - křížení
      const slots: DrawSlot[] = [];
      for (let g = 0; g < numGroups; g++) {
        slots.push(makeSlot(g, 1));           // vítěz
        slots.push(makeSlot((g + 1) % numGroups, 2)); // druhý z další skupiny
      }
      return slots;
    }

    case "TOP2_STRAIGHT": {
      // W_A vs 2_A, W_B vs 2_B - jen 2 skupiny
      if (numGroups !== 2) throw new Error("TOP2_STRAIGHT requires exactly 2 groups");
      return [
        makeSlot(0, 1), makeSlot(0, 2),  // A1 vs A2
        makeSlot(1, 1), makeSlot(1, 2),  // B1 vs B2
      ];
    }

    case "TOP2_BEST_3RD": {
      // 2 ze skupiny + nejlepší třetí místa
      const slots: DrawSlot[] = [];
      for (let g = 0; g < numGroups; g++) {
        slots.push(makeSlot(g, 1));
        slots.push(makeSlot(g, 2));
      }
      // Přidáme placeholdery pro nejlepší třetí místa
      for (let i = 0; i < (thirdPlaceAdvance || 0); i++) {
        slots.push({ teamId: null, teamName: `Best 3rd #${i + 1}` });
      }
      return slots;
    }

    case "TOP3_ALL": {
      const slots: DrawSlot[] = [];
      for (let g = 0; g < numGroups; g++) {
        slots.push(makeSlot(g, 1));
        slots.push(makeSlot(g, 2));
        slots.push(makeSlot(g, 3));
      }
      return slots;
    }

    case "CUSTOM":
      // Vlastní párování - slots budou určeny z customPairings
      if (config.customPairings && config.customPairings.length > 0) {
        const uniqueTeams = new Set<string>();
        config.customPairings.forEach(p => {
          uniqueTeams.add(`${p.home.groupIndex}-${p.home.position}`);
          uniqueTeams.add(`${p.away.groupIndex}-${p.away.position}`);
        });
        return Array.from(uniqueTeams).map(key => {
          const [g, pos] = key.split("-").map(Number);
          return makeSlot(g, pos as 1 | 2 | 3);
        });
      }
      // Fallback na WINNERS_ONLY
      return Array.from({ length: numGroups }, (_, g) => makeSlot(g, 1));

    default:
      return Array.from({ length: numGroups }, (_, g) => makeSlot(g, 1));
  }
}

export function generateCup(
  teams: DrawSlot[],
  numGroups: number,
  options: {
    groupDoubleLegs?: boolean;
    advancementConfig?: CupAdvancementConfig;
    thirdPlaceMatch?: boolean;
  } = {},
): GeneratedMatch[] {
  const shuffled = shuffle([...teams]);
  const groups: DrawSlot[][] = Array.from({ length: numGroups }, () => []);

  // Distribute teams snake-style across groups
  shuffled.forEach((team, i) => groups[i % numGroups].push(team));

  const groupLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const results: GeneratedMatch[] = [];
  let maxRoundInGroups = 0;

  for (let g = 0; g < numGroups; g++) {
    const label = groupLabels[g] ?? `G${g + 1}`;
    const groupMatches = generateRoundRobin(groups[g], {
      doubleLegs: options.groupDoubleLegs,
      groupLabel: label,
    });
    results.push(...groupMatches);
    const maxR = groupMatches.reduce((acc, m) => Math.max(acc, m.round), 0);
    maxRoundInGroups = Math.max(maxRoundInGroups, maxR);
  }

  // Use advancement config or default to WINNERS_ONLY
  const config: CupAdvancementConfig = options.advancementConfig ?? {
    preset: "WINNERS_ONLY",
    teamsPerGroup: 1,
  };

  // Generate bracket slots based on preset
  const bracketSlots = generateBracketSlots(numGroups, config);

  const bracketMatches = generateBracket(bracketSlots, {
    roundOffset: maxRoundInGroups,
    thirdPlaceMatch: options.thirdPlaceMatch,
  });
  results.push(...bracketMatches);

  return results;
}
