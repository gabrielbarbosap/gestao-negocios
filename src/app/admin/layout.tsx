"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { useAuth, isAdminUser } from "@/hooks/useAuth";
import { CircleNotch } from "@phosphor-icons/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect=/admin");
      return;
    }
    if (!isAdminUser(user)) {
      router.replace("/aluno");
    }
  }, [user, loading, router]);

  // Carregando auth
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <CircleNotch size={28} className="ph-spin" style={{ color: "var(--coral)" }} />
      </div>
    );
  }

  // Não é admin — não renderiza nada (o redirect já foi disparado)
  if (!user || !isAdminUser(user)) {
    return null;
  }

  return (
    <div className="admin-shell" style={{ background: "var(--bg)" }}>
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
