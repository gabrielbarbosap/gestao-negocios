"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { logout } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";

export function StudentHeader() {
  useAuth();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  return (
    <header
      style={{
        height: "56px", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 16px",
        background: "var(--bg-2)", borderBottom: "1px solid var(--border)",
      }}
      className="md:hidden"
    >
      <Link href="/" className="font-display" style={{ fontSize: "1.1rem", color: "var(--text-1)" }}>
        GestãoSurf
      </Link>

      {!loading && (
        user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-3)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </span>
            <button
              onClick={() => logout()}
              style={{ fontSize: "12px", color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px" }}
            >
              Sair
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "6px" }}>
            <Link href="/login" style={{ fontSize: "13px", color: "var(--text-2)", padding: "5px 10px", borderRadius: "7px" }}>
              Entrar
            </Link>
            <Link href="/registro" className="btn-primary" style={{ fontSize: "12px", padding: "5px 12px" }}>
              Criar conta
            </Link>
          </div>
        )
      )}
    </header>
  );
}
