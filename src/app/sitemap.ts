import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const LOCALES = ["cs", "en"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const teams = await prisma.team.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  }).catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    {
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
  ]);

  const teamRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    teams.map((team) => ({
      url: `${BASE_URL}/${locale}/teams/${team.id}/public`,
      lastModified: team.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  return [...staticRoutes, ...teamRoutes];
}
