"use client";

import { useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Shuffle, Loader2, AlertTriangle, CheckCircle2, Trophy } from "lucide-react";
import {
  PRESET_LABELS_CS,
  PRESET_LABELS_EN,
  getAvailablePresets,
  getAdvancingTeamCount,
  type CupAdvancementPreset,
  type CupAdvancementConfig,
} from "@/lib/draw";

interface TeamSlot {
  id: string | null;
  name: string;
}

interface DrawWizardProps {
  competitionId: string;
  competitionType: "LEAGUE" | "CUP" | "TOURNAMENT";
  teamCount: number;
  teams?: TeamSlot[];
  hasExistingMatches: boolean;
  locale: string;
}

export function DrawWizard({
  competitionId,
  competitionType,
  teamCount,
  teams = [],
  hasExistingMatches,
  locale,
}: DrawWizardProps) {
  const router = useRouter();
  const isCS = locale === "cs";

  const [open, setOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState<{ created: number } | null>(null);

  // Options
  const [doubleLegs, setDoubleLegs] = useState(false);
  const [numGroups, setNumGroups] = useState(2);
  const [groupDoubleLegs, setGroupDoubleLegs] = useState(false);
  const [clearExisting, setClearExisting] = useState(true);
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(false);

  // Berger options
  const [berger, setBerger] = useState(false);
  const [seedNumbers, setSeedNumbers] = useState<Record<string, number>>({});

  const setSeed = (key: string, val: number) =>
    setSeedNumbers((prev) => ({ ...prev, [key]: val }));

  // CUP advancement options
  const [advancementPreset, setAdvancementPreset] = useState<CupAdvancementPreset>("WINNERS_ONLY");
  const [teamsPerGroup, setTeamsPerGroup] = useState(1);
  const [thirdPlaceAdvance, setThirdPlaceAdvance] = useState(0);

  const maxGroups = Math.max(2, Math.floor(teamCount / 2));

  const presetLabels = isCS ? PRESET_LABELS_CS : PRESET_LABELS_EN;
  const availablePresets = useMemo(() => getAvailablePresets(numGroups, teamsPerGroup), [numGroups, teamsPerGroup]);

  // Calculate expected bracket size
  const bracketPreview = useMemo(() => {
    const config: CupAdvancementConfig = {
      preset: advancementPreset,
      teamsPerGroup,
      thirdPlaceAdvance: advancementPreset === "TOP2_BEST_3RD" ? thirdPlaceAdvance : 0,
    };
    const advancing = getAdvancingTeamCount(numGroups, config);
    // Find next power of 2
    let bracketSize = 1;
    while (bracketSize < advancing) bracketSize *= 2;
    const rounds = Math.log2(bracketSize);
    const roundNames = isCS
      ? { 1: "Finále", 2: "Semifinále", 3: "Čtvrtfinále", 4: "Osmifinále", 5: "Šestnáctifinále" }
      : { 1: "Final", 2: "Semi-finals", 3: "Quarter-finals", 4: "Round of 16", 5: "Round of 32" };
    return {
      advancing,
      bracketSize,
      startRound: roundNames[rounds as keyof typeof roundNames] || `R${bracketSize}`,
      hasByes: bracketSize > advancing,
    };
  }, [advancementPreset, teamsPerGroup, thirdPlaceAdvance, numGroups, isCS]);

  const handleDraw = async () => {
    setIsDrawing(true);
    setResult(null);
    try {
      const advancementConfig: CupAdvancementConfig = {
        preset: advancementPreset,
        teamsPerGroup,
        ...(advancementPreset === "TOP2_BEST_3RD" ? { thirdPlaceAdvance } : {}),
      };

      const res = await fetch(`/api/competitions/${competitionId}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doubleLegs,
          numGroups,
          groupDoubleLegs,
          clearExisting,
          advancementConfig,
          thirdPlaceMatch,
          berger: competitionType === "LEAGUE" ? berger : false,
          seedNumbers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error === "NOT_ENOUGH_TEAMS"
          ? (isCS ? "Příliš málo týmů (min. 2)" : "Not enough teams (min. 2)")
          : data.error === "INTERNAL_ERROR"
          ? `${isCS ? "Chyba serveru" : "Server error"}: ${data.message || data.error}`
          : data.error || (isCS ? "Neznámá chyba" : "Unknown error");
        toast.error(errorMsg);
        return;
      }
      setResult({ created: data.created });
      toast.success(isCS ? `Losování dokončeno — ${data.created} zápasů` : `Draw complete — ${data.created} matches`);
      router.refresh();
      setOpen(false);
    } finally {
      setIsDrawing(false);
    }
  };

  const typeLabel = {
    LEAGUE: isCS ? "Liga (round-robin)" : "League (round-robin)",
    TOURNAMENT: isCS ? "Turnaj (vyřazovací pavouk)" : "Tournament (elimination bracket)",
    CUP: isCS ? "Pohár (skupiny + pavouk)" : "Cup (groups + bracket)",
  }[competitionType];

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => { setOpen(true); setResult(null); }}
        className="gap-1.5"
      >
        <Shuffle className="size-4" />
        {isCS ? "Losovat" : "Draw"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="size-5" />
              {isCS ? "Automatické losování" : "Automatic Draw"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type info */}
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{typeLabel}</span>
              <span className="ml-2">· {teamCount} {isCS ? "týmů" : "teams"}</span>
            </div>

            {/* LEAGUE options */}
            {competitionType === "LEAGUE" && (
              <div className="space-y-4">
                <ToggleRow
                  id="doubleLegs"
                  label={isCS ? "Doma i venku (2× každý pár)" : "Home & away (2× each pair)"}
                  checked={doubleLegs}
                  onChange={setDoubleLegs}
                />
                <ToggleRow
                  id="berger"
                  label={isCS ? "Bergerovy tabulky (přiřadit čísla týmům)" : "Berger tables (assign seed numbers)"}
                  checked={berger}
                  onChange={(v) => { setBerger(v); if (!v) setSeedNumbers({}); }}
                />
                {berger && teams.length > 0 && (
                  <div className="space-y-2 pl-3 border-l-2 border-primary/30">
                    <p className="text-xs text-muted-foreground">
                      {isCS
                        ? "Přiřaďte každému týmu číslo (1 = první v tabulce Bergera). Nepřiřazené týmy dostanou čísla automaticky."
                        : "Assign a number to each team (1 = first in Berger table). Unassigned teams get numbers automatically."
                      }
                    </p>
                    <div className="grid grid-cols-[1fr_80px] gap-x-3 gap-y-1.5 items-center">
                      <span className="text-xs font-semibold text-muted-foreground">{isCS ? "Tým" : "Team"}</span>
                      <span className="text-xs font-semibold text-muted-foreground text-center">{isCS ? "Číslo" : "Seed"}</span>
                      {teams.map((t) => {
                        const key = t.id ?? t.name;
                        return (
                          <Fragment key={key}>
                            <span className="text-sm truncate">{t.name}</span>
                            <input
                              type="number"
                              min={1}
                              max={teamCount}
                              placeholder="—"
                              value={seedNumbers[key] ?? ""}
                              onChange={(e) => {
                                const v = e.target.value === "" ? undefined : Number(e.target.value);
                                if (v === undefined) {
                                  setSeedNumbers((prev) => { const n = { ...prev }; delete n[key]; return n; });
                                } else {
                                  setSeed(key, v);
                                }
                              }}
                              className="w-full border rounded px-2 py-1 text-sm text-center tabular-nums bg-background"
                            />
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CUP options */}
            {competitionType === "CUP" && (
              <div className="space-y-4">
                {/* Number of groups */}
                <div className="space-y-1.5">
                  <Label htmlFor="numGroups">
                    {isCS ? "Počet skupin" : "Number of groups"}
                    <span className="ml-1 text-muted-foreground text-xs">
                      ({isCS ? "max" : "max"} {maxGroups})
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="numGroups"
                      type="range"
                      min={2}
                      max={maxGroups}
                      value={numGroups}
                      onChange={(e) => {
                        const newGroups = Number(e.target.value);
                        setNumGroups(newGroups);
                        // Reset preset if not compatible with new group count
                        if (advancementPreset === "TOP2_STRAIGHT" && newGroups !== 2) {
                          setAdvancementPreset("WINNERS_ONLY");
                        }
                      }}
                      className="flex-1"
                    />
                    <span className="w-6 text-center font-semibold tabular-nums">{numGroups}</span>
                  </div>
                </div>

                {/* Teams advancing per group */}
                <div className="space-y-1.5">
                  <Label>{isCS ? "Postupující ze skupiny" : "Teams advancing per group"}</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setTeamsPerGroup(n);
                          setAdvancementPreset("WINNERS_ONLY"); // Reset preset selection
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          teamsPerGroup === n
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {n === 1 ? (isCS ? "1 tým" : "1 team") : `${n} ${isCS ? "týmy" : "teams"}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advancement preset selection */}
                <div className="space-y-1.5">
                  <Label>{isCS ? "Model postupu" : "Advancement model"}</Label>
                  <div className="grid gap-2">
                    {availablePresets.map((preset) => {
                      const label = presetLabels[preset];
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAdvancementPreset(preset)}
                          className={`text-left p-2.5 rounded-lg border transition-colors ${
                            advancementPreset === preset
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="font-medium text-sm">{label.name}</div>
                          <div className="text-xs text-muted-foreground">{label.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Third place advance (for TOP2_BEST_3RD) */}
                {advancementPreset === "TOP2_BEST_3RD" && (
                  <div className="space-y-1.5 pl-3 border-l-2 border-primary/30">
                    <Label className="text-sm">
                      {isCS ? "Nejlepší třetí místa" : "Best third places"}
                    </Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setThirdPlaceAdvance(n)}
                          className={`px-2.5 py-1 rounded text-sm transition-colors ${
                            thirdPlaceAdvance === n
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {n === 0 ? "—" : `+${n}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bracket preview */}
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="size-4 text-primary" />
                    <span className="font-medium">
                      {isCS ? "Náhled pavouka" : "Bracket preview"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isCS
                      ? `${bracketPreview.advancing} týmů → ${bracketPreview.startRound}${bracketPreview.hasByes ? " (s volnými postupy)" : ""}`
                      : `${bracketPreview.advancing} teams → ${bracketPreview.startRound}${bracketPreview.hasByes ? " (with byes)" : ""}`
                    }
                  </p>
                </div>

                <ToggleRow
                  id="groupDoubleLegs"
                  label={isCS ? "Ve skupinách doma i venku" : "Groups home & away"}
                  checked={groupDoubleLegs}
                  onChange={setGroupDoubleLegs}
                />
                <ToggleRow
                  id="thirdPlaceMatchCup"
                  label={isCS ? "Zápas o 3. místo" : "3rd place match"}
                  checked={thirdPlaceMatch}
                  onChange={setThirdPlaceMatch}
                />
              </div>
            )}

            {/* TOURNAMENT info + 3rd place toggle */}
            {competitionType === "TOURNAMENT" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {isCS
                    ? `Vygeneruje se single-elimination pavouk. Pokud počet týmů není mocninou 2, přidají se volné postupy (bye).`
                    : `Single-elimination bracket. If team count isn't a power of 2, byes are added automatically.`
                  }
                </p>
                <ToggleRow
                  id="thirdPlaceMatch"
                  label={isCS ? "Zápas o 3. místo" : "3rd place match"}
                  checked={thirdPlaceMatch}
                  onChange={setThirdPlaceMatch}
                />
              </div>
            )}

            {/* Clear existing */}
            {hasExistingMatches && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">
                    {isCS ? "Soutěž již obsahuje zápasy." : "Competition already has matches."}
                  </p>
                </div>
                <ToggleRow
                  id="clearExisting"
                  label={isCS ? "Smazat stávající zápasy před losováním" : "Delete existing matches before draw"}
                  checked={clearExisting}
                  onChange={setClearExisting}
                  variant="destructive"
                />
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="size-4 shrink-0" />
                {isCS
                  ? `Vygenerováno ${result.created} zápasů`
                  : `Generated ${result.created} matches`
                }
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDrawing} type="button">
              {isCS ? "Zavřít" : "Close"}
            </Button>
            <Button onClick={handleDraw} disabled={isDrawing || teamCount < 2} className="gap-1.5">
              {isDrawing
                ? <><Loader2 className="size-4 animate-spin" />{isCS ? "Losuji…" : "Drawing…"}</>
                : <><Shuffle className="size-4" />{isCS ? "Spustit losování" : "Run draw"}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
  variant = "default",
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  variant?: "default" | "destructive";
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked
            ? variant === "destructive" ? "bg-destructive" : "bg-primary"
            : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className={`text-sm ${variant === "destructive" ? "text-destructive" : ""}`}>{label}</span>
    </label>
  );
}
