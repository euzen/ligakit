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
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <a
            href={`/${locale}`}
            className="font-bold text-lg text-primary hover:opacity-80 transition-opacity"
          >
            {tCommon("appName")}
          </a>

          <div className="flex items-center gap-2">
            <a
              href={`/${locale}/docs`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              <BookOpen className="size-4" />
              <span className="hidden sm:inline">{locale === "cs" ? "Docs" : "Docs"}</span>
            </a>
            <a
              href={`/${otherLocale}${pathWithoutLocale}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              <Globe className="size-4" />
              {otherLocale.toUpperCase()}
            </a>

            <ThemeToggle />

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <Avatar className="size-8">
                      <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? ""} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getInitials(session.user?.name, session.user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium leading-none">
                        {session.user?.name ?? session.user?.email}
                      </span>
                      <Badge
                        variant={
                          session.user?.role === "ADMINISTRATOR"
                            ? "default"
                            : "secondary"
                        }
                        className="text-[10px] h-4 mt-0.5"
                      >
                        {tRoles(session.user?.role as "USER" | "ADMINISTRATOR")}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = `/${locale}/dashboard`)
                    }
                  >
                    <LayoutDashboard className="size-4" />
                    {t("dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = `/${locale}/teams`)
                    }
                  >
                    <Users className="size-4" />
                    {t("teams")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = `/${locale}/competitions`)
                    }
                  >
                    <Trophy className="size-4" />
                    {t("competitions")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = `/${locale}/profile`)
                    }
                  >
                    <UserCircle className="size-4" />
                    {locale === "cs" ? "Můj profil" : "My Profile"}
                  </DropdownMenuItem>
                  {session.user?.role === "ADMINISTRATOR" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          (window.location.href = `/${locale}/admin`)
                        }
                      >
                        <Shield className="size-4" />
                        {t("adminPanel")}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href={`/${locale}/login`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted"
                >
                  {t("login")}
                </a>
                <a
                  href={`/${locale}/register`}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
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
