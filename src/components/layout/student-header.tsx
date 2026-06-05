"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { logout } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { SignOut } from "@phosphor-icons/react";

export function StudentHeader() {
  useAuth();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  return (
    <header
      className="md:hidden"
      style={{
        position: "sticky", top: 0, zIndex: 40,
        height: "58px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
        background: "rgba(250,247,242,0.92)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {/* Logo + nome */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          border: "1.5px solid rgba(232,97,42,0.3)",
          boxShadow: "0 0 10px rgba(232,97,42,0.15)",
        }}>
          <Image src="/escola/logo.jpg" alt="Ivan Silva Surf School" width={32} height={32}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <p className="font-display" style={{ fontSize: "0.9rem", color: "var(--text-1)" }}>Ivan Silva</p>
          <p style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Surf School</p>
        </div>
      </Link>

      {/* Ações */}
      {!loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {user ? (
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
              <SignOut size={14} />
              Sair
            </button>
          ) : (
            <>
              <Link href="/login" style={{ fontSize: "12px", color: "var(--text-2)", padding: "5px 10px", borderRadius: "7px", textDecoration: "none" }}>
                Entrar
              </Link>
              <Link href="/registro" className="btn-primary" style={{ fontSize: "12px", padding: "5px 12px", textDecoration: "none" }}>
                Criar conta
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
