export interface MatchEvent {
  id: string;
  type: string;
  teamSide: string;
  minute: number | null;
  addedTime: number | null;
  playerName: string | null;
  createdAt: Date;
}

export interface EventTypeDefinition {
  name: string;
  labelCs: string;
  labelEn: string;
  value: number | null;
  affectsScore: boolean;
  color: string | null;
  icon: string | null;
  sortOrder: number;
}

export interface ScoreResult {
  homeScore: number;
  awayScore: number;
}

export interface SportConfig {
  engine?: string;
  periods?: number;
  periodDuration?: number;
  overtimeAllowed?: boolean;
  tiebreak?: "none" | "extra_time" | "penalties" | "shootout";
  winPoints?: number;
  drawPoints?: number;
  lossPoints?: number;
}

export interface SportEngine {
  readonly key: string;

  /**
   * Recalculates homeScore/awayScore from the full list of match events.
   * eventTypes is provided for engines that read scoring rules from DB.
   */
  recalcScores(events: MatchEvent[], eventTypes: EventTypeDefinition[]): ScoreResult;

  /**
   * Returns the list of event type names this engine recognises.
   * Used by the live tracker UI to show only relevant buttons.
   * If empty, all eventTypes from DB are shown.
   */
  getAllowedEventTypes(eventTypes: EventTypeDefinition[]): EventTypeDefinition[];

  /**
   * Validates an incoming event before it is persisted.
   * Returns true if valid, or an error string if not.
   */
  validateEvent(type: string, teamSide: string, eventTypes: EventTypeDefinition[]): true | string;
}
