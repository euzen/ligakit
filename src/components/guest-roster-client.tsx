"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2, Loader2, Trophy } from "lucide-react";

interface GuestPlayer {
  id: string;
  name: string;
  number: number | null;
}

interface Props {
  token: string;
  locale: string;
  teamName: string;
  competitionName: string;
  initialPlayers: GuestPlayer[];
}

export function GuestRosterClient({ token, locale, teamName, competitionName, initialPlayers }: Props) {
  const cs = locale === "cs";
  const [players, setPlayers] = useState<GuestPlayer[]>(initialPlayers);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/guest-roster/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), number: number ? Number(number) : null }),
      });
      if (!res.ok) { toast.error(cs ? "Chyba při přidávání" : "Error adding player"); return; }
      const player = await res.json();
      setPlayers((prev) => [...prev, player]);
      setName("");
      setNumber("");
      toast.success(cs ? "Hráč přidán" : "Player added");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/guest-roster/${token}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: id }),
      });
      if (!res.ok) { toast.error(cs ? "Chyba při odebírání" : "Error removing player"); return; }
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      toast.success(cs ? "Hráč odebrán" : "Player removed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trophy className="size-3.5" />
          {competitionName}
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="size-6" />
          {teamName}
        </h1>
        <p className="text-muted-foreground text-sm">
          {cs ? "Soupisku může upravovat kdokoli s tímto odkazem." : "Anyone with this link can edit this roster."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{cs ? "Přidat hráče" : "Add player"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={cs ? "Číslo dresu" : "Jersey number"}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              type="number"
              className="w-24 shrink-0"
            />
            <Input
              placeholder={cs ? "Jméno hráče" : "Player name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              className="flex-1"
            />
          </div>
          <Button onClick={handleAdd} disabled={!name.trim() || isAdding} className="gap-1.5 w-full">
            {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {cs ? "Přidat hráče" : "Add player"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>{cs ? "Hráči" : "Players"}</span>
            <span className="text-muted-foreground font-normal text-sm">{players.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Users className="size-8 opacity-30" />
              <p className="text-sm">{cs ? "Zatím žádní hráči" : "No players yet"}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {players
                .slice()
                .sort((a, b) => (a.number ?? 999) - (b.number ?? 999))
                .map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    {p.number !== null ? (
                      <span className="w-8 text-center font-bold tabular-nums text-sm text-muted-foreground shrink-0">
                        {p.number}
                      </span>
                    ) : (
                      <span className="w-8 shrink-0" />
                    )}
                    <span className="flex-1 font-medium text-sm">{p.name}</span>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      {deletingId === p.id
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Trash2 className="size-3.5" />}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
