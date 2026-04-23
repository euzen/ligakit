export interface StandingRow {
  teamId: string;
  teamName: string;
  teamLogo: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: ("W" | "D" | "L")[];
}

interface MatchResult {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeam: { id: string; name: string; logoUrl: string | null } | null;
  awayTeam: { id: string; name: string; logoUrl: string | null } | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  note?: string | null;
}

export interface GroupStandings {
  groupLabel: string;
  rows: StandingRow[];
}

/**
 * For CUP competitions: groups matches by their `note` field (e.g. "Skupina A")
 * and computes standings per group. Returns groups sorted alphabetically.
 */
export function computeGroupStandings(
  teams: { team: { id: string; name: string; logoUrl: string | null } }[],
  matches: MatchResult[],
): GroupStandings[] {
  // Collect unique group labels from match notes (only group-phase matches)
  const groupLabels = new Set<string>();
  for (const m of matches) {
    if (m.note && m.note.startsWith("Skupina")) groupLabels.add(m.note);
  }
  if (groupLabels.size === 0) return [];

  return [...groupLabels].sort().map((label) => {
    const groupMatches = matches.filter((m) => m.note === label);
    // Teams that appear in this group's matches
    const groupTeamKeys = new Set<string>();
    for (const m of groupMatches) {
      const hk = (m.homeTeamId ?? m.homeTeam?.id) || m.homeTeam?.name || m.homeTeamName;
      const ak = (m.awayTeamId ?? m.awayTeam?.id) || m.awayTeam?.name || m.awayTeamName;
      if (hk) groupTeamKeys.add(hk);
      if (ak) groupTeamKeys.add(ak);
    }
    const groupTeams = teams.filter((ct) =>
      groupTeamKeys.has(ct.team.id) || groupTeamKeys.has(ct.team.name),
    );
    return {
      groupLabel: label,
      rows: computeStandings(groupTeams, groupMatches),
    };
  });
}

export function computeStandings(
  teams: { team: { id: string; name: string; logoUrl: string | null } }[],
  matches: MatchResult[],
): StandingRow[] {
  // Primary map keyed by canonical id only (no duplicates in values())
  const map = new Map<string, StandingRow>();
  // Secondary alias map: team name → same StandingRow object for name-based lookup
  const byName = new Map<string, StandingRow>();

  for (const ct of teams) {
    const row: StandingRow = {
      teamId: ct.team.id,
      teamName: ct.team.name,
      teamLogo: ct.team.logoUrl,
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
      form: [],
    };
    map.set(ct.team.id, row);
    byName.set(ct.team.name, row);
  }

  const resolve = (id: string | null | undefined, name: string | null | undefined): StandingRow | undefined =>
    (id ? map.get(id) : undefined) ?? (name ? byName.get(name) : undefined);

  for (const m of matches) {
    if (m.status !== "PLAYED" || m.homeScore === null || m.awayScore === null) continue;

    const homeId = m.homeTeamId ?? m.homeTeam?.id ?? null;
    const awayId = m.awayTeamId ?? m.awayTeam?.id ?? null;
    const homeName = m.homeTeam?.name ?? m.homeTeamName ?? null;
    const awayName = m.awayTeam?.name ?? m.awayTeamName ?? null;

    const home = resolve(homeId, homeName);
    const away = resolve(awayId, awayName);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won++; home.points += 3; home.form.push("W");
      away.lost++; away.form.push("L");
    } else if (m.homeScore < m.awayScore) {
      away.won++; away.points += 3; away.form.push("W");
      home.lost++; home.form.push("L");
    } else {
      home.drawn++; home.points += 1; home.form.push("D");
      away.drawn++; away.points += 1; away.form.push("D");
    }
  }

  for (const row of map.values()) {
    row.goalDiff = row.goalsFor - row.goalsAgainst;
    row.form = row.form.slice(-5);
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}
