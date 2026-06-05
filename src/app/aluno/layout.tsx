"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentSidebarNav, StudentBottomNav } from "@/components/layout/student-nav";
import { StudentHeader } from "@/components/layout/student-header";
import { useAuth, isAdminUser } from "@/hooks/useAuth";
import { CircleNotch } from "@phosphor-icons/react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect=/aluno");
      return;
    }
    // Admin vai para o painel admin
    if (isAdminUser(user)) {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <CircleNotch size={28} className="ph-spin" style={{ color: "var(--coral)" }} />
      </div>
    );
  }

  if (!user || isAdminUser(user)) return null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={{ background: "var(--bg)" }}>

      {/* ── Sidebar — desktop only ─────────────────────────────────────── */}
      <aside
        className="hidden md:flex md:flex-col md:h-screen md:sticky md:top-0"
        style={{ width: "220px", flexShrink: 0, background: "var(--bg-2)", borderRight: "1px solid var(--border)" }}
      >
        <div style={{
          height: "60px", display: "flex", alignItems: "center",
          padding: "0 18px", borderBottom: "1px solid var(--border)", gap: "10px",
        }}>
          <div>
            <p className="font-display" style={{ fontSize: "0.95rem", color: "var(--text-1)", lineHeight: 1.1 }}>Ivan Silva</p>
            <p style={{ fontSize: "10px", color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Surf School</p>
          </div>
        </div>
        <StudentSidebarNav />
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        <StudentHeader />
        <main style={{ flex: 1 }}>
          <div className="p-4 pb-24 md:p-6 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* ── Bottom nav — mobile only ───────────────────────────────────── */}
      <StudentBottomNav />
    </div>
  );
}
