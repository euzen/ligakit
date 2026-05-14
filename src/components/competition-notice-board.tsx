"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Megaphone, Trash2, Send } from "lucide-react";

interface Post {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string | null; email: string };
}

interface CompetitionNoticeBoardProps {
  competitionId: string;
  canManage: boolean;
  locale: string;
}

export function CompetitionNoticeBoard({ competitionId, canManage, locale }: CompetitionNoticeBoardProps) {
  const isCS = locale === "cs";
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/competitions/${competitionId}/posts`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPosts(data); })
      .finally(() => setLoading(false));
  }, [competitionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) { toast.error(isCS ? "Chyba při odesílání" : "Failed to post"); return; }
      const post: Post = await res.json();
      setPosts((prev) => [post, ...prev]);
      setBody("");
      toast.success(isCS ? "Zpráva odeslána" : "Message posted");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    setDeletingId(postId);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        toast.success(isCS ? "Zpráva smazána" : "Message deleted");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString(isCS ? "cs-CZ" : "en-US", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      {canManage && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isCS ? "Napište zprávu pro účastníky…" : "Write a message for participants…"}
            rows={2}
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="self-end h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {isCS ? "Odeslat" : "Post"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Megaphone className="size-8 opacity-30" />
          <p className="text-sm">{isCS ? "Zatím žádné zprávy" : "No messages yet"}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="rounded-lg border bg-card px-4 py-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed flex-1 whitespace-pre-wrap">{p.body}</p>
                {canManage && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title={isCS ? "Smazat" : "Delete"}
                  >
                    {deletingId === p.id
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <Trash2 className="size-3.5" />}
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {p.author.name ?? p.author.email} · {fmt(p.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
