import { StudentNav } from "@/components/layout/student-nav";
import { StudentHeader } from "@/components/layout/student-header";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={{ background: "var(--ocean-950)" }}>
      {/* Sidebar desktop */}
      <div
        className="hidden md:flex md:w-56 md:flex-col md:h-screen md:sticky md:top-0 border-r"
        style={{ background: "var(--ocean-900)", borderColor: "var(--border)" }}
      >
        <div className="flex h-14 items-center px-5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="font-display text-base font-semibold" style={{ color: "var(--text-1)" }}>
            🏄 GestãoSurf
          </span>
        </div>
        <StudentNav />
      </div>

      <div className="flex flex-1 flex-col">
        <StudentHeader />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
