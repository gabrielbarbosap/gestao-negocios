"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDots, Clock, Users, Money, ChartBar, SquaresFour, Gear, SignOut, List, X } from "@phosphor-icons/react";
import { logout } from "@/lib/firebase/auth";

const NAV = [
  { label: "Dashboard",    href: "/admin",               icon: SquaresFour },
  { label: "Agenda",       href: "/admin/agenda",        icon: CalendarDots    },
  { label: "Horários",     href: "/admin/horarios",      icon: Clock           },
  { label: "Alunos",       href: "/admin/alunos",        icon: Users           },
  { label: "Financeiro",   href: "/admin/financeiro",    icon: Money      },
  { label: "Relatórios",   href: "/admin/relatorios",    icon: ChartBar       },
  { label: "Configurações",href: "/admin/configuracoes", icon: Settings        },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = (
    <nav style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
      {NAV.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`nav-link ${active ? "active" : ""}`}
            style={{ marginBottom: "2px" }}
          >
            <Icon size={15} style={{ flexShrink: 0 }} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div style={{ padding: "8px", borderTop: "1px solid var(--border)" }}>
      <button
        onClick={() => logout()}
        className="nav-link"
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}
        onMouseEnter={e => {(e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.06)";}}
        onMouseLeave={e => {(e.currentTarget as HTMLElement).style.color = ""; (e.currentTarget as HTMLElement).style.background = "";}}
      >
        <SignOut size={15} style={{ flexShrink: 0 }} />
        Sair
      </button>

      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <a href="https://partiu.life" target="_blank" rel="noopener noreferrer" className="partiu-badge" style={{ fontSize: "10px" }}>
          ⚡ partiu.life
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Top bar mobile ─────────────────────────────────────────────── */}
      <header className="admin-topbar">
        <button
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
          style={{ background: "none", border: "none", color: "var(--text-1)", cursor: "pointer", display: "flex", padding: "6px" }}
        >
          <Menu size={22} />
        </button>
        <Link href="/" className="font-display" style={{ fontSize: "1.1rem", color: "var(--text-1)" }}>
          Ivan Silva Surf School
        </Link>
        <div style={{ width: "34px" }} />
      </header>

      {/* ── Overlay mobile ─────────────────────────────────────────────── */}
      {open && <div className="admin-overlay" onClick={() => setOpen(false)} />}

      {/* ── Sidebar (desktop fixa / mobile drawer) ─────────────────────── */}
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", borderBottom: "1px solid var(--border)" }}>
          <Link href="/" className="font-display" style={{ fontSize: "1.1rem", color: "var(--text-1)" }} onClick={() => setOpen(false)}>
            Ivan Silva Surf School
          </Link>
          <button
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="admin-close"
            style={{ background: "none", border: "none", color: "var(--text-2)", cursor: "pointer", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {navItems}
        {footer}
      </aside>
    </>
  );
}
