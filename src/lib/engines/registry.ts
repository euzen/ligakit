import type { SportEngine, SportConfig } from "./types";
import { footballEngine } from "./football";
import { genericEngine } from "./generic";

const engines: Record<string, SportEngine> = {
  football: footballEngine,
  generic: genericEngine,
};

/**
 * Returns the SportEngine for a given engine key.
 * Falls back to the generic engine if the key is unknown or not provided.
 */
export function getEngine(engineKey?: string | null): SportEngine {
  if (!engineKey) return genericEngine;
  return engines[engineKey] ?? genericEngine;
}

/**
 * Parses the JSON config string stored in Sport.config.
 * Returns an empty object on parse failure.
 */
export function parseSportConfig(configJson: string | null | undefined): SportConfig {
  if (!configJson) return {};
  try {
    return JSON.parse(configJson) as SportConfig;
  } catch {
    return {};
  }
}

export { engines };
