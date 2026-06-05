"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { logout } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export function StudentHeader() {
  useAuth();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  return (
    <header
      className="md:hidden"
      style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "var(--bg-2)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
        <span style={{ fontSize: "18px" }}>🏄</span>
        <span className="font-display" style={{ fontSize: "1rem", color: "var(--text-1)" }}>
          Ivan Silva <span style={{ color: "var(--teal-light)" }}>Surf</span>
        </span>
      </Link>

      {!loading && user && (
        <button
          onClick={() => logout()}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            fontSize: "12px", color: "var(--text-3)",
            background: "none", border: "none", cursor: "pointer",
            padding: "6px 10px", borderRadius: "8px",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          <LogOut size={14} />
          Sair
        </button>
      )}

      {!loading && !user && (
        <div style={{ display: "flex", gap: "6px" }}>
          <Link href="/login" style={{ fontSize: "13px", color: "var(--text-2)", padding: "5px 10px", borderRadius: "7px", textDecoration: "none" }}>
            Entrar
          </Link>
          <Link href="/registro" className="btn-primary" style={{ fontSize: "12px", padding: "5px 12px" }}>
            Criar conta
          </Link>
        </div>
      )}
    </header>
  );
}
