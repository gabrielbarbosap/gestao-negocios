"use client";

import {
  CalendarDots, Users, Money, TrendUp,
  Waves, ArrowUpRight, Clock, MapPin, Plus, Sparkle, CircleNotch,
} from "@phosphor-icons/react";
import { useBusinessId } from "@/hooks/useBusinessId";
import { useAdminDashboard, type DashboardData } from "@/hooks/useAdminDashboard";
import { getLocation } from "@/constants/locations";
import { formatCurrency, formatTime } from "@/lib/utils";
import type { Session } from "@/types/session";
import type { Payment } from "@/types/payment";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function AdminDashboard() {
  const businessId = useBusinessId();
  const d = useAdminDashboard(businessId) as DashboardData & { revenueTotal: number };

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const stats: { label: string; value: string; icon: typeof CalendarDots; accent: string; note?: string }[] = [
    { label: "Reservas esta semana",  value: String(d.sessionsThisWeek),      icon: CalendarDots, accent: "var(--teal-light)" },
    { label: "Alunos ativos",      value: String(d.activeStudents),         icon: Users,        accent: "var(--gold)" },
    { label: "Receita bruta",      value: formatCurrency(d.revenueTotal),   icon: Money,        accent: "var(--teal-mid)", note: "Sem descontar taxas Stripe (~2,99% + R$0,39/venda)" },
    { label: "Ocupação média",     value: `${d.avgOccupancy}%`,             icon: TrendUp,      accent: "var(--sunset-2)" },
  ];

  return (
    <div className="admin-page" style={{ maxWidth: "1100px", margin: "0 auto" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="rise admin-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
        <div>
          <span className="section-label" style={{ marginBottom: "12px" }}>
            <Waves size={11} /> Ivan Silva Surf School
          </span>
          <h1 className="font-display admin-title" style={{ color: "var(--text-1)", lineHeight: 1.05, marginTop: "12px" }}>
            {greeting()}, Ivan
          </h1>
          <p style={{ marginTop: "6px", fontSize: "13.5px", color: "var(--text-2)", textTransform: "capitalize" }}>
            {today}
          </p>
        </div>
        <a href="/admin/horarios" className="btn-primary admin-cta" style={{ height: "44px", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px", textDecoration: "none" }}>
          <Plus size={17} /> Liberar horários
        </a>
      </header>

      {d.error && (
        <div className="card" style={{ padding: "16px", marginBottom: "18px", borderColor: "var(--border-warm)", color: "var(--sunset-2)", fontSize: "13.5px" }}>
          {d.error}
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px", marginBottom: "18px" }}>
        {stats.map(({ label, value, icon: Icon, accent, note }, i) => (
          <div key={label} className={`card rise-${Math.min(i + 1, 4)}`} style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
            <div aria-hidden style={{
              position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px",
              background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: "none",
            }} />
            <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: `${accent}1a`, border: `1px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={18} style={{ color: accent }} />
            </div>
            <p className="font-display" style={{ fontSize: "2.1rem", color: "var(--text-1)", marginTop: "16px", lineHeight: 1, minHeight: "2.1rem" }}>
              {d.loading ? <CircleNotch size={22} className="ph-spin" style={{ color: "var(--text-3)" }} /> : value}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-2)", marginTop: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {label}
            </p>
            {note && (
              <p style={{ fontSize: "10.5px", color: "var(--text-3)", marginTop: "5px", lineHeight: 1.4 }}>
                * {note}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Grid: ocupação + próximas aulas ──────────────────────────────── */}
      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "14px", marginBottom: "14px" }}>

        {/* Ocupação semanal */}
        <div className="card rise-2" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
            <div>
              <h3 className="font-display" style={{ fontSize: "1.25rem", color: "var(--text-1)" }}>Ocupação da semana</h3>
              <p style={{ fontSize: "12px", color: "var(--text-2)", marginTop: "2px" }}>Taxa de preenchimento das aulas</p>
            </div>
            <Sparkle size={16} style={{ color: "var(--gold)" }} />
          </div>

          {d.loading ? <DashSkeleton h={150} /> : d.weekOccupancy.every(w => w.v === 0) ? (
            <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: "13px", color: "var(--text-3)" }}>Nenhuma aula esta semana</p>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "10px", height: "150px" }}>
              {d.weekOccupancy.map(({ d: day, v }) => (
                <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%" }}>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <div title={`${v}%`} style={{
                      width: "100%", maxWidth: "32px", height: `${Math.max(v, 3)}%`, borderRadius: "7px 7px 3px 3px",
                      background: v >= 90 ? "linear-gradient(180deg, var(--gold), var(--sunset))" : "linear-gradient(180deg, var(--teal-light), var(--teal-dim))",
                      boxShadow: v >= 90 ? "0 0 16px rgba(245,192,48,0.35)" : v > 0 ? "0 0 12px rgba(0,180,200,0.3)" : "none",
                      opacity: v > 0 ? 1 : 0.2,
                      transition: "height 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                    }} />
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-2)", fontWeight: 600 }}>{day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas aulas */}
        <div className="card rise-3" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <h3 className="font-display" style={{ fontSize: "1.25rem", color: "var(--text-1)" }}>Próximas aulas</h3>
            <a href="/admin/agenda" style={{ fontSize: "12px", color: "var(--ocean)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "2px", textDecoration: "none" }}>
              Ver agenda <ArrowUpRight size={13} />
            </a>
          </div>

          {d.loading ? <DashSkeleton h={200} /> : d.upcoming.length === 0 ? (
            <EmptyState text="Nenhuma aula agendada." cta="Liberar horários" href="/admin/horarios" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {d.upcoming.map((s) => <UpcomingRow key={s.id} s={s} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Últimos pagamentos ────────────────────────────────────────────── */}
      <div className="card rise-4" style={{ padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <h3 className="font-display" style={{ fontSize: "1.25rem", color: "var(--text-1)" }}>Últimos pagamentos</h3>
        </div>

        {d.loading ? <DashSkeleton h={160} /> : d.recentPayments.length === 0 ? (
          <EmptyState text="Nenhum pagamento registrado ainda." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {d.recentPayments.map((p, i) => <PaymentRow key={p.id} p={p} first={i === 0} />)}
          </div>
        )}
      </div>

      <style>{`
        .admin-page { padding: 32px 28px 60px; }
        .admin-title { font-size: 2.4rem; }
        .ph-spin { animation: ph-spin 0.9s linear infinite; }
        @keyframes ph-spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) { .admin-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) {
          .admin-page { padding: 20px 16px 48px; }
          .admin-title { font-size: 1.85rem; }
          .admin-header { align-items: stretch; }
          .admin-cta { width: 100%; }
        }
        @media (max-width: 420px) { .admin-title { font-size: 1.6rem; } }
      `}</style>
    </div>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function UpcomingRow({ s }: { s: Session }) {
  const loc = getLocation(s.location);
  const full = s.currentCapacity >= s.maxCapacity;
  const dateLabel = new Date(s.date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  return (
    <div className="card-interactive" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "48px" }}>
        <Clock size={13} style={{ color: "var(--text-2)", marginBottom: "2px" }} />
        <span className="font-display" style={{ fontSize: "1rem", color: "var(--text-1)" }}>{formatTime(s.startTime)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13px", color: "var(--text-1)", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
          <MapPin size={11} style={{ color: "var(--ocean)", flexShrink: 0 }} /> {loc.name}
        </p>
        <p style={{ fontSize: "11.5px", color: "var(--text-2)", marginTop: "2px", textTransform: "capitalize" }}>{dateLabel}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
        <span style={{
          fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "99px", whiteSpace: "nowrap",
          color: full ? "var(--sunset-2)" : "var(--teal-light)",
          background: full ? "rgba(232,120,48,0.12)" : "rgba(46,191,181,0.1)",
          border: `1px solid ${full ? "var(--border-warm)" : "rgba(46,191,181,0.25)"}`,
        }}>
          {s.currentCapacity}/{s.maxCapacity} alunos
        </span>
      </div>
    </div>
  );
}

function PaymentRow({ p, first }: { p: Payment; first: boolean }) {
  const raw = p as unknown as Record<string, unknown>;
  const amount = typeof p.amount === "number"
    ? p.amount
    : typeof raw.amountTotal === "number" ? (raw.amountTotal as number) / 100 : 0;
  const name = p.customerName || "Aluno";
  const desc = p.description || (raw.credits ? `${raw.credits} crédito(s)` : "Pagamento");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 4px", borderTop: first ? "none" : "1px solid var(--border)" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--bg-3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "var(--ocean)", flexShrink: 0 }}>
        {name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13.5px", color: "var(--text-1)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
        <p style={{ fontSize: "11.5px", color: "var(--text-2)", marginTop: "1px" }}>{desc}</p>
      </div>
      <span className="font-display" style={{ fontSize: "1.05rem", color: "var(--text-1)", minWidth: "72px", textAlign: "right" }}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

function DashSkeleton({ h }: { h: number }) {
  return <div style={{ height: h, borderRadius: "10px", background: "linear-gradient(90deg, var(--bg-3) 0%, var(--bg-4) 50%, var(--bg-3) 100%)", backgroundSize: "200% 100%", animation: "admin-shimmer 1.4s ease infinite" }} />;
}

function EmptyState({ text, cta, href }: { text: string; cta?: string; href?: string }) {
  return (
    <div style={{ padding: "28px 12px", textAlign: "center" }}>
      <p style={{ fontSize: "13px", color: "var(--text-2)" }}>{text}</p>
      {cta && href && (
        <a href={href} className="btn-outline" style={{ display: "inline-block", marginTop: "12px", padding: "8px 16px", fontSize: "13px" }}>{cta}</a>
      )}
    </div>
  );
}
