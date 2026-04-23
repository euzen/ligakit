import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

export async function canManageMatch(
  session: Session | null,
  matchId: string,
): Promise<boolean> {
  if (!session) return false;
  if (session.user.role === "ADMINISTRATOR") return true;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { competition: { select: { organizerId: true } } },
  });
  return match?.competition.organizerId === session.user.id;
}

export async function canControlByToken(
  matchId: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const ref = await prisma.matchRefereeToken.findUnique({ where: { token } });
  if (!ref || ref.matchId !== matchId) return false;
  if (ref.expiresAt && ref.expiresAt < new Date()) return false;
  return true;
}

export async function canManageCompetition(
  session: Session | null,
  competitionId: string,
): Promise<boolean> {
  if (!session) return false;
  if (session.user.role === "ADMINISTRATOR") return true;
  const c = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { organizerId: true },
  });
  return c?.organizerId === session.user.id;
}
