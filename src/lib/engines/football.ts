import type { SportEngine, MatchEvent, EventTypeDefinition, ScoreResult } from "./types";

const FOOTBALL_EVENT_TYPES: EventTypeDefinition[] = [
  { name: "GOAL",        labelCs: "Gól",          labelEn: "Goal",        value: 1,    affectsScore: true,  color: "#22c55e", icon: "target",    sortOrder: 0 },
  { name: "OWN_GOAL",    labelCs: "Vlastní gól",  labelEn: "Own Goal",    value: null, affectsScore: true,  color: "#ef4444", icon: "target",    sortOrder: 1 },
  { name: "YELLOW_CARD", labelCs: "Žlutá karta",  labelEn: "Yellow Card", value: null, affectsScore: false, color: "#eab308", icon: "square",    sortOrder: 2 },
  { name: "RED_CARD",    labelCs: "Červená karta", labelEn: "Red Card",   value: null, affectsScore: false, color: "#ef4444", icon: "square",    sortOrder: 3 },
  { name: "PENALTY",     labelCs: "Penalta",      labelEn: "Penalty",     value: null, affectsScore: false, color: "#6366f1", icon: "circle",    sortOrder: 4 },
  { name: "SUBSTITUTION",labelCs: "Střídání",     labelEn: "Substitution",value: null, affectsScore: false, color: "#94a3b8", icon: "arrow-right-left", sortOrder: 5 },
];

const SCORE_EVENTS = new Set(["GOAL", "OWN_GOAL"]);

/**
 * Football engine — hardcoded scoring logic matching original recalcScores().
 * GOAL adds 1 to the scoring side; OWN_GOAL adds 1 to the opponent.
 * Ignores eventTypes from DB — uses built-in definitions.
 */
export const footballEngine: SportEngine = {
  key: "football",

  recalcScores(events: MatchEvent[], _eventTypes: EventTypeDefinition[]): ScoreResult {
    let homeScore = 0;
    let awayScore = 0;

    for (const e of events) {
      if (!SCORE_EVENTS.has(e.type)) continue;
      if (e.type === "GOAL") {
        if (e.teamSide === "HOME") homeScore++;
        else awayScore++;
      } else if (e.type === "OWN_GOAL") {
        if (e.teamSide === "HOME") awayScore++;
        else homeScore++;
      }
    }

    return { homeScore, awayScore };
  },

  getAllowedEventTypes(_eventTypes: EventTypeDefinition[]): EventTypeDefinition[] {
    return FOOTBALL_EVENT_TYPES;
  },

  validateEvent(type: string, teamSide: string, _eventTypes: EventTypeDefinition[]): true | string {
    if (teamSide !== "HOME" && teamSide !== "AWAY") return "INVALID_SIDE";
    const known = FOOTBALL_EVENT_TYPES.some((et) => et.name === type);
    if (!known) return `UNKNOWN_EVENT_TYPE: ${type}`;
    return true;
  },
};
