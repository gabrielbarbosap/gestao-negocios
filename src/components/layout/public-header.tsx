"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth, isAdminUser } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth";
import { logout } from "@/lib/firebase/auth";
import { SignOut } from "@phosphor-icons/react";

export function PublicHeader() {
  useAuth();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      borderBottom: "1px solid var(--border)",
      background: "rgba(250,247,242,0.92)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
    }}>
      <div style={{
        maxWidth: "672px", margin: "0 auto",
        padding: "0 20px", height: "58px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
      }}>

        {/* Logo + nome */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%", overflow: "hidden", flexShrink: 0,
            border: "1.5px solid rgba(232,97,42,0.3)",
            boxShadow: "0 0 10px rgba(232,97,42,0.15)",
          }}>
            <Image src="/escola/logo.jpg" alt="Ivan Silva Surf School" width={34} height={34}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <p className="font-display" style={{ fontSize: "0.95rem", color: "var(--text-1)" }}>Ivan Silva</p>
            <p style={{ fontSize: "9.5px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Surf School</p>
          </div>
        </Link>

        {/* Ações */}
        {!loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {user ? (
              <>
                <Link
                  href={isAdminUser(user) ? "/admin" : "/aluno"}
                  style={{
                    fontSize: "13px", fontWeight: 700, color: "var(--ocean)",
                    padding: "7px 14px", borderRadius: "8px",
                    background: "rgba(232,97,42,0.08)", border: "1px solid rgba(232,97,42,0.18)",
                    textDecoration: "none", transition: "background 0.15s",
                  }}
                >
                  Minha área
                </Link>
                <button
                  onClick={() => logout()}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    fontSize: "12px", color: "var(--text-3)",
                    background: "none", border: "none", cursor: "pointer",
                    padding: "7px 10px", borderRadius: "8px",
                    transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-3)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "none"; }}
                >
                  <SignOut size={14} />
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    fontSize: "13px", fontWeight: 600, color: "var(--text-2)",
                    padding: "7px 12px", borderRadius: "8px", textDecoration: "none",
                    transition: "color 0.15s, background 0.15s",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                >
                  Entrar
                </Link>
                <Link href="/registro" className="btn-primary" style={{ fontSize: "13px", padding: "14px", textDecoration: "none" }}>
                  Criar conta
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
