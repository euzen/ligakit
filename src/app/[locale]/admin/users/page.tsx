import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AdminSearchInput } from "@/components/admin-search-input";
import { AdminPagination } from "@/components/admin-pagination";
import { AdminUsersTable } from "@/components/admin-users-table";
import { Suspense } from "react";

const PAGE_SIZE = 20;
const VALID_SORT = ["name", "email", "role", "createdAt"] as const;
type SortCol = (typeof VALID_SORT)[number];

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string; role?: string; sort?: string; order?: string }>;
}) {
  const { locale } = await params;
  const { q = "", page: pageStr = "1", role: roleFilter = "", sort: sortRaw = "createdAt", order: orderRaw = "desc" } = await searchParams;
  const session = await auth();

  if (!session) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMINISTRATOR") redirect(`/${locale}/dashboard`);

  const t = await getTranslations("admin");

  const page = Math.max(1, parseInt(pageStr) || 1);
  const sort: SortCol = VALID_SORT.includes(sortRaw as SortCol) ? (sortRaw as SortCol) : "createdAt";
  const order = orderRaw === "asc" ? "asc" : "desc";

  const where = {
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
    ...(roleFilter === "USER" || roleFilter === "ADMINISTRATOR" ? { role: roleFilter as "USER" | "ADMINISTRATOR" } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Administrace" : "Admin", href: `/${locale}/admin` },
            { label: t("users") },
          ]} />

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("users")}</h1>
            <p className="text-muted-foreground mt-1">{t("usersDesc")}</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>{t("users")}</CardTitle>
                  <CardDescription>{t("totalUsers")}: {total}</CardDescription>
                </div>
                <Suspense>
                  <AdminSearchInput placeholder={locale === "cs" ? "Hledat jméno nebo e-mail…" : "Search name or email…"} />
                </Suspense>
              </div>
            </CardHeader>
            <CardContent>
              <Suspense>
                <AdminUsersTable
                  users={users}
                  currentUserId={session.user.id}
                  locale={locale}
                  sort={sort}
                  order={order}
                  roleFilter={roleFilter}
                />
              </Suspense>
              <Suspense>
                <AdminPagination page={page} totalPages={totalPages} locale={locale} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
