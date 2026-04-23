import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AdminSearchInput } from "@/components/admin-search-input";
import { AdminPagination } from "@/components/admin-pagination";
import { Suspense } from "react";
import { ClipboardList } from "lucide-react";

const PAGE_SIZE = 30;

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DELETE: "destructive",
  ROLE_CHANGE: "default",
  CREATE: "secondary",
  UPDATE: "outline",
};

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { q = "", page: pageStr = "1" } = await searchParams;
  const session = await auth();

  if (!session) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMINISTRATOR") redirect(`/${locale}/dashboard`);

  const page = Math.max(1, parseInt(pageStr) || 1);
  const where = q
    ? {
        OR: [
          { actorEmail: { contains: q } },
          { entity: { contains: q } },
          { action: { contains: q } },
          { detail: { contains: q } },
        ],
      }
    : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Administrace" : "Admin", href: `/${locale}/admin` },
            { label: locale === "cs" ? "Audit log" : "Audit Log" },
          ]} />

          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <ClipboardList className="size-7" />
              {locale === "cs" ? "Audit log" : "Audit Log"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {locale === "cs" ? "Historie administrativních akcí" : "History of administrative actions"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>{locale === "cs" ? "Záznamy" : "Records"}</CardTitle>
                  <CardDescription>{total} {locale === "cs" ? "záznamů" : "records"}</CardDescription>
                </div>
                <Suspense>
                  <AdminSearchInput
                    placeholder={locale === "cs" ? "Hledat akci, entitu, uživatele…" : "Search action, entity, user…"}
                  />
                </Suspense>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  {locale === "cs" ? "Žádné záznamy" : "No records found"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === "cs" ? "Čas" : "Time"}</TableHead>
                      <TableHead>{locale === "cs" ? "Akce" : "Action"}</TableHead>
                      <TableHead>{locale === "cs" ? "Entita" : "Entity"}</TableHead>
                      <TableHead>{locale === "cs" ? "Detail" : "Detail"}</TableHead>
                      <TableHead>{locale === "cs" ? "Provedl" : "Actor"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString(locale === "cs" ? "cs-CZ" : "en-US")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ACTION_VARIANT[log.action] ?? "outline"} className="text-xs">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {log.entity}
                          {log.entityId && (
                            <span className="ml-1 text-xs text-muted-foreground font-mono">
                              #{log.entityId.slice(-6)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.detail ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.actorEmail ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
