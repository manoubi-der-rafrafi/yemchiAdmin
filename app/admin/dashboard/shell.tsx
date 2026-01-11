'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { JSX, useEffect, useMemo, useState } from "react";
import type { JwtPayload } from "@/lib/utils/jwt";

type NavItem = {
  label: string;
  href: string;
  icon: JSX.Element;
  section: string;
};

const IconWrap = ({ children }: { children: React.ReactNode }) => (
  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 via-sky-400/10 to-orange-400/20 text-base shadow-inner">
    {children}
  </span>
);

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-[1.8] text-sky-600">
      <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" className="opacity-20" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" />
      <rect x="3" y="13" width="6" height="8" rx="2" stroke="currentColor" />
      <rect x="11" y="11" width="10" height="10" rx="2.5" fill="none" stroke="currentColor" />
    </svg>
  ),
  demande: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-[1.8] text-sky-600">
      <path d="M5 4h14a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H7l-4 2.5V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" />
      <path d="M7 9h10M7 12h6" stroke="currentColor" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-[1.8] text-sky-600">
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-4.5 3v-3H6a2 2 0 0 1-2-2Z" fill="none" stroke="currentColor" />
      <path d="M7 8h10M7 11h6" stroke="currentColor" />
    </svg>
  ),
  commande: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-[1.8] text-sky-600">
      <path d="M4 5h2l1 12h10l1-10H7.5" fill="none" stroke="currentColor" />
      <circle cx="9" cy="19" r="1.4" fill="currentColor" />
      <circle cx="16" cy="19" r="1.4" fill="currentColor" />
      <path d="M10 9h6" stroke="currentColor" />
    </svg>
  ),
  livreur: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-[1.8] text-sky-600">
      <rect x="3" y="5" width="10" height="10" rx="2" fill="none" stroke="currentColor" />
      <path d="M13 9h3l3 3v3h-3" stroke="currentColor" />
      <circle cx="9" cy="18" r="1.4" fill="currentColor" />
      <circle cx="17" cy="18" r="1.4" fill="currentColor" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-[1.8] text-slate-700">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" />
      <path d="M19.4 12a7.4 7.4 0 0 0-.1-1l2-1.5-1.6-2.7-2.3 1a7.1 7.1 0 0 0-1.7-1l-.3-2.5h-3.2l-.3 2.5a7.1 7.1 0 0 0-1.7 1l-2.3-1-1.6 2.7 2 1.5a7.4 7.4 0 0 0-.1 1c0 .34.03.67.1 1l-2 1.5 1.6 2.7 2.3-1a7.1 7.1 0 0 0 1.7 1l.3 2.5h3.2l.3-2.5a7.1 7.1 0 0 0 1.7-1l2.3 1 1.6-2.7-2-1.5c.07-.33.1-.66.1-1Z" fill="none" stroke="currentColor" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-[1.8] text-white">
      <path d="M14 17v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v2" fill="none" stroke="currentColor" />
      <path d="M10 12h10m0 0-2.5-2.5M20 12l-2.5 2.5" stroke="currentColor" />
    </svg>
  ),
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: icons.dashboard, section: "Tableau de bord" },
  { label: "Gerer demande", href: "/admin/demande", icon: icons.demande, section: "Gestion" },
  { label: "Gerer commande", href: "/admin/commandes", icon: icons.commande, section: "Gestion" },
  { label: "Gerer livreur", href: "/admin/livreurs", icon: icons.livreur, section: "Gestion" },
  { label: "Gerer messages", href: "/admin/messages", icon: icons.messages, section: "Communication" },
  { label: "Setting", href: "/admin/settings", icon: icons.settings, section: "Paramètres" },
];

const sectionsOrder = ["Tableau de bord", "Gestion", "Communication", "Paramètres"] as const;

export function DashboardShell({
  payload,
  children,
  title = "Dashboard",
  subtitle = "Tableau de bord",
}: {
  payload: JwtPayload;
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const unreadMessages = 3;

  useEffect(() => {
    setMounted(true);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    navItems.forEach((item) => {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    });
    return map;
  }, []);

  const userName = (payload.nom as string) || (payload.prenom as string) || (payload.email as string) || "Admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-orange-50 text-slate-900 flex">
      <aside
        className={`group relative ${collapsed ? "w-24" : "w-80"} transition-all duration-300 bg-white/70 backdrop-blur-2xl border-r border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_0_12px_rgba(255,255,255,0.45),0_10px_50px_rgba(0,0,0,0.08)]`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100/40 via-white/40 to-orange-50/50 pointer-events-none rounded-r-3xl" />
        <div className="relative flex flex-col min-h-screen">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/60">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/80 shadow-lg bg-white/90 p-1.5 shadow-[0_8px_22px_rgba(14,165,233,0.18)]">
              <Image
                src="/LOGO_YEMCHI W YJI.jpg"
                alt="Yemchi w Yji"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm text-slate-500">Yemchi w Yji</p>
                <p className="text-lg font-semibold text-slate-900">Admin</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 border border-white/70 text-slate-500 hover:text-slate-900 hover:shadow transition-all"
              title={collapsed ? "Déployer" : "Réduire"}
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>

          <nav className="flex-1 px-3.5 py-5 space-y-8">
            {sectionsOrder.map((section) => (
              <div key={section} className="space-y-2.5">
                {!collapsed && (
                  <p className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {section}
                  </p>
                )}
                <div className="space-y-1">
                  {(grouped.get(section) ?? []).map((item) => {
                    const isActive =
                      mounted &&
                      (pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href)));
                    const showBadge = item.label === "Gerer messages" && unreadMessages > 0 && !collapsed;
                    return (
                      <Link key={item.href} href={item.href} title={item.label}>
                        <span
                          className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                            isActive
                              ? "bg-white/85 text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white/80"
                              : "text-slate-700 hover:text-slate-900 hover:bg-white/60 hover:shadow-[0_12px_30px_rgba(14,165,233,0.12)] hover:-translate-x-0.5 border border-transparent"
                          } ${collapsed ? "justify-center" : ""}`}
                        >
                          {isActive && (
                            <span className="absolute left-1 top-1 bottom-1 w-1 rounded-full bg-gradient-to-b from-sky-500 to-orange-500 shadow-[0_0_10px_rgba(14,165,233,0.35)]" />
                          )}
                          <span
                            className={`relative flex-shrink-0 transition-transform duration-200 ${
                              isActive ? "translate-x-0.5" : "group-hover:translate-x-0.5"
                            }`}
                          >
                            <IconWrap>{item.icon}</IconWrap>
                          </span>
                          {!collapsed && (
                            <span className="flex-1 relative z-10 transition-transform duration-150 group-hover:translate-x-0.5">
                              {item.label}
                            </span>
                          )}
                          {showBadge && (
                            <span className="ml-auto rounded-full bg-sky-500/15 text-sky-700 text-xs font-semibold px-2 py-0.5">
                              {unreadMessages}
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="px-3.5 pb-4 pt-4 border-t border-white/60 space-y-3">
            {!collapsed && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/85 border border-white/70 px-3.5 py-2.5 shadow-inner">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-orange-500 text-white font-semibold">
                  {userName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" title={userName}>
                    {userName}
                  </p>
                  <p className="text-xs text-emerald-600">En ligne</p>
                </div>
                <span className="ml-auto text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                  Admin
                </span>
              </div>
            )}

            <form action="/api/auth/logout" method="post">
              <button
                className="w-full relative overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 via-sky-500 to-orange-500 hover:from-sky-700 hover:via-sky-600 hover:to-orange-600 transition-all shadow-[0_10px_40px_rgba(14,165,233,0.35)] flex items-center justify-center gap-3 active:scale-[0.99]"
                title="Déconnexion"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  {icons.logout}
                </span>
                {!collapsed && <span>Deconnecter</span>}
              </button>
            </form>

            {!collapsed && (
              <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-xs text-slate-600 shadow-inner flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>Commandes aujourd&apos;hui</span>
                    <span className="font-semibold text-slate-900">12</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Livreurs en ligne</span>
                    <span className="font-semibold text-slate-900">3</span>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/80" />
                <div className="text-[11px] text-emerald-600 font-semibold">95%</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-10 py-10 space-y-4">
          <div>
            <p className="text-sm text-slate-500">{subtitle}</p>
            <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          </div>

          {children ?? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 backdrop-blur p-8 text-center text-slate-600 shadow-sm">
              Section en cours de construction.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
