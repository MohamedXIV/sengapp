"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useClerk } from "@clerk/nextjs";
import { Shield, Settings, MessageSquareHeart, UsersRound, Sun, Moon } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  userRole?: "operator" | "member";
  displayName?: string;
  handle?: string;
  locale?: "en" | "ar";
  textDirection?: "ltr" | "rtl" | "auto";
}

export function AppShell({
  children,
  userRole = "member",
  displayName = "Member",
  handle = "squirrel",
  locale = "en",
  textDirection = "auto",
}: AppShellProps) {
  const { theme, setTheme } = useTheme();
  const { signOut } = useClerk();
  const resolvedDir =
    textDirection === "auto" ? (locale === "ar" ? "rtl" : "ltr") : textDirection;

  return (
    <div
      dir={resolvedDir}
      className="min-h-screen bg-background text-foreground flex flex-col md:flex-row"
    >
      <aside
        aria-label="Primary Navigation"
        className="w-full md:w-72 border-b md:border-b-0 md:border-e border-border bg-card p-5 flex flex-col justify-between"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/home"
              className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
            >
              <span
                aria-hidden="true"
                className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm"
              >
                🐿️
              </span>
              <div>
                <span className="font-semibold text-lg tracking-tight block">
                  Sengapp
                </span>
                <span className="text-xs text-muted-foreground block">
                  {locale === "ar"
                    ? "مكان صغير لحوارات كبيرة"
                    : "A little place for big conversations"}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              <Sun className="h-4 w-4 hidden dark:block" />
              <Moon className="h-4 w-4 block dark:hidden" />
            </button>
          </div>

          <nav className="space-y-1.5">
            <Link
              href="/home"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
            >
              <MessageSquareHeart className="h-4 w-4 text-primary" />
              <span>{locale === "ar" ? "الردهة الخاصة" : "Cozy Lounge"}</span>
            </Link>

            <Link href="/connections"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
              <UsersRound className="h-4 w-4 text-primary" />
              <span>{locale === "ar" ? "جهات الاتصال" : "Connections"}</span>
            </Link>

            <Link
              href="/settings/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
            >
              <Settings className="h-4 w-4 text-primary" />
              <span>
                {locale === "ar"
                  ? "الملف الشخصي والخصوصية"
                  : "Profile & Presence"}
              </span>
            </Link>

            {userRole === "operator" && (
              <Link
                href="/admin/invitations"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Shield className="h-4 w-4 text-primary" />
                <span>
                  {locale === "ar" ? "أدوات الإدارة" : "Operator Tools"}
                </span>
              </Link>
            )}
          </nav>
        </div>

        <div className="pt-4 mt-6 border-t border-border flex items-center justify-between text-sm">
          <div className="truncate">
            <p className="font-medium truncate" dir="auto">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">@{handle}</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">
            {userRole}
          </span>
          <button className="text-xs underline" type="button" onClick={async () => {
            await signOut({ redirectUrl: "/login" });
          }}>Sign out</button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-5xl">{children}</main>
    </div>
  );
}
