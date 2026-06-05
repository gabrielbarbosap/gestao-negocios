import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell" style={{ background: "var(--bg)" }}>
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
