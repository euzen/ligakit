import type { SportEngine, MatchEvent, EventTypeDefinition, ScoreResult } from "./types";

/**
 * Generic engine — scoring rules are fully driven by EventType records in the DB.
 * Any sport configured with engine: "generic" (or no engine key at all) uses this.
 * Admin creates EventType entries with affectsScore=true and a numeric value;
 * this engine sums them up per side.
 */
export const genericEngine: SportEngine = {
  key: "generic",

  recalcScores(events: MatchEvent[], eventTypes: EventTypeDefinition[]): ScoreResult {
    const typeMap = new Map<string, EventTypeDefinition>();
    for (const et of eventTypes) typeMap.set(et.name, et);

    let homeScore = 0;
    let awayScore = 0;

    for (const e of events) {
      const def = typeMap.get(e.type);
      if (!def || !def.affectsScore) continue;
      const val = def.value ?? 1;
      if (e.teamSide === "HOME") homeScore += val;
      else if (e.teamSide === "AWAY") awayScore += val;
    }

    return { homeScore, awayScore };
  },

  getAllowedEventTypes(eventTypes: EventTypeDefinition[]): EventTypeDefinition[] {
    return [...eventTypes].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  validateEvent(type: string, teamSide: string, eventTypes: EventTypeDefinition[]): true | string {
    if (teamSide !== "HOME" && teamSide !== "AWAY") return "INVALID_SIDE";
    const known = eventTypes.some((et) => et.name === type);
    if (!known) return `UNKNOWN_EVENT_TYPE: ${type}`;
    return true;
  },
};
