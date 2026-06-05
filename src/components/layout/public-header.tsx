"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth, isAdminUser } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth";
import { logout } from "@/lib/firebase/auth";

export function PublicHeader() {
  useAuth();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 20,
      borderBottom: "1px solid var(--border)",
      background: "rgba(14,11,7,0.9)",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: "672px", margin: "0 auto",
        padding: "0 20px", height: "56px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
      }}>
        {/* School identity */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "32px", height: "32px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "1.5px solid rgba(13,128,128,0.35)",
            flexShrink: 0,
          }}>
            <Image
              src="/escola/logo.jpg"
              alt="Ivan Silva Surf School"
              width={32}
              height={32}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <span className="font-display" style={{ fontSize: "1rem", color: "var(--text-1)", lineHeight: 1 }}>
            Ivan Silva
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Partiu.life badge — always visible */}
          <Link
            href="https://partiu.life"
            target="_blank"
            className="partiu-badge"
            style={{ display: "none" }}
          >
            partiu.life
          </Link>

          {!loading && (
            user ? (
              <>
                <a href={isAdminUser(user) ? "/admin" : "/aluno"} style={{ fontSize: "13px", fontWeight: 700, color: "var(--teal-light)", padding: "6px 12px", borderRadius: "7px", background: "rgba(13,128,128,0.08)", textDecoration: "none", transition: "background 0.15s" }}>
                  Minha área
                </a>
                <button onClick={() => logout()} style={{ fontSize: "13px", color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "7px" }}>
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-2)", padding: "6px 14px", borderRadius: "7px", textDecoration: "none", transition: "color 0.15s" }}>
                Entrar
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
