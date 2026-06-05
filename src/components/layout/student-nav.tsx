"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Trophy, TrendingUp, Home, Package } from "lucide-react";

const NAV = [
  { label: "Início",      href: "/aluno",           icon: Home         },
  { label: "Agendar",     href: "/aluno/agenda",     icon: CalendarDays },
  { label: "Pacotes",     href: "/aluno/pacotes",    icon: Package      },
  { label: "Evolução",    href: "/aluno/evolucao",   icon: TrendingUp   },
  { label: "Conquistas",  href: "/aluno/conquistas", icon: Trophy       },
];

function isActive(pathname: string, href: string) {
  if (href === "/aluno") return pathname === "/aluno";
  return pathname.startsWith(href);
}

// ── Bottom nav (mobile) ──────────────────────────────────────────────────
export function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="student-bottom-nav md:hidden">
      {NAV.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`nav-item ${isActive(pathname, href) ? "active" : ""}`}
        >
          <Icon
            size={20}
            strokeWidth={isActive(pathname, href) ? 2.5 : 1.8}
          />
          {label}
        </Link>
      ))}
    </nav>
  );
}

// ── Sidebar nav (desktop) ────────────────────────────────────────────────
export function StudentSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="student-sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 10px" }}>
      {NAV.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`nav-link ${isActive(pathname, href) ? "active" : ""}`}
        >
          <Icon size={16} strokeWidth={isActive(pathname, href) ? 2.5 : 1.8} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

// ── Legacy export (compat) ───────────────────────────────────────────────
export function StudentNav() {
  return <StudentSidebarNav />;
}
