"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Trophy, TrendingUp, Home, Package } from "lucide-react";

const NAV = [
  { label: "Início",     href: "/aluno",            icon: Home         },
  { label: "Agendar",   href: "/aluno/agenda",      icon: CalendarDays },
  { label: "Conquistas",href: "/aluno/conquistas",  icon: Trophy       },
  { label: "Evolução",  href: "/aluno/evolucao",    icon: TrendingUp   },
  { label: "Pacotes",   href: "/aluno/pacotes",     icon: Package      },
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}
      className="fixed bottom-0 left-0 right-0 md:relative md:border-t-0 md:bg-transparent md:border-0"
    >
      <div
        style={{ display: "flex", justifyContent: "space-around", padding: "4px 4px 6px" }}
        className="md:flex-col md:justify-start md:gap-0.5 md:p-2"
      >
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/aluno" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link ${active ? "active" : ""}`}
              style={{
                flexDirection: "column", gap: "3px", padding: "6px 10px",
                fontSize: "10px",
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
