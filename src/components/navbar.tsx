"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, LogOut, LayoutDashboard, Shield, Users, UserCircle, Trophy, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const { data: session } = useSession();

  const otherLocale = locale === "cs" ? "en" : "cs";
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(cs|en)/, "") || "/";

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.slice(0, 2).toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return "U";
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="bg-blue-700 p-2 rounded-xl group-hover:rotate-6 transition-transform">
              <Trophy className="text-white size-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              liga<span className="text-blue-700 font-light">kit</span>
            </span>
          </a>

          <div className="flex items-center gap-2">
            {/* Docs */}
            <a
              href={`/${locale}/docs`}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <BookOpen className="size-4" />
              Docs
            </a>

            {/* Language */}
            <a
              href={`/${otherLocale}${pathWithoutLocale}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <Globe className="size-4" />
              <span className="hidden sm:inline">{otherLocale.toUpperCase()}</span>
            </a>

            <ThemeToggle />

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity ml-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <Avatar className="size-7">
                      <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? ""} />
                      <AvatarFallback className="text-xs bg-blue-700 text-white font-bold">
                        {getInitials(session.user?.name, session.user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-semibold leading-none text-slate-900">
                        {session.user?.name ?? session.user?.email}
                      </span>
                      <span className={`text-[10px] font-bold mt-0.5 ${session.user?.role === "ADMINISTRATOR" ? "text-blue-700" : "text-slate-400"}`}>
                        {tRoles(session.user?.role as "USER" | "ADMINISTRATOR")}
                      </span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl border-slate-100 shadow-xl p-1">
                  <DropdownMenuItem
                    onClick={() => (window.location.href = `/${locale}/dashboard`)}
                    className="rounded-xl"
                  >
                    <LayoutDashboard className="size-4" />
                    {t("dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => (window.location.href = `/${locale}/teams`)}
                    className="rounded-xl"
                  >
                    <Users className="size-4" />
                    {t("teams")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => (window.location.href = `/${locale}/competitions`)}
                    className="rounded-xl"
                  >
                    <Trophy className="size-4" />
                    {t("competitions")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => (window.location.href = `/${locale}/profile`)}
                    className="rounded-xl"
                  >
                    <UserCircle className="size-4" />
                    {locale === "cs" ? "Můj profil" : "My Profile"}
                  </DropdownMenuItem>
                  {session.user?.role === "ADMINISTRATOR" && (
                    <>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem
                        onClick={() => (window.location.href = `/${locale}/admin`)}
                        className="rounded-xl text-blue-700 focus:text-blue-700 focus:bg-blue-50"
                      >
                        <Shield className="size-4" />
                        {t("adminPanel")}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                    className="rounded-xl text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <a
                  href={`/${locale}/login`}
                  className="text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors px-3 py-1.5"
                >
                  {t("login")}
                </a>
                <a
                  href={`/${locale}/register`}
                  className="inline-flex items-center justify-center h-9 px-5 rounded-full bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 shadow-md shadow-blue-100 transition-all"
                >
                  {t("register")}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
