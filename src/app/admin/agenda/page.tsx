"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays, Clock, MapPin, Users, Loader2, CircleSlash, Ban,
  ChevronLeft, ChevronRight, CalendarCheck,
} from "lucide-react";
import { useBusinessId } from "@/hooks/useBusinessId";
import { useAdminAgenda } from "@/hooks/useAdminAgenda";
import { getLocation } from "@/constants/locations";
import { formatTime } from "@/lib/utils";
import type { Session, SessionStatus } from "@/types/session";
import type { Reservation } from "@/types/reservation";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTH_NAMES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const STATUS_META: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  available: { label: "Aberta",    color: "var(--teal-light)", bg: "rgba(46,191,181,0.1)" },
  full:      { label: "Lotada",    color: "var(--gold)",       bg: "rgba(245,192,48,0.1)"  },
  blocked:   { label: "Bloqueada", color: "var(--text-2)",     bg: "rgba(255,255,255,0.04)" },
  cancelled: { label: "Cancelada", color: "var(--sunset-2)",   bg: "rgba(232,120,48,0.1)"  },
};

export default function AgendaPage() {
  const businessId = useBusinessId();
  const { loading, error, sessions, reservationsBySession } = useAdminAgenda(businessId);
  const [selected, setSelected] = useState<Date>(() => new Date());

  const selectedStr = fmtDate(selected);

  // aulas do dia selecionado (todas as localidades), ordenadas por horário
  const dayClasses = useMemo(
    () =>
      sessions
        .filter((s) => s.date === selectedStr && s.status !== "cancelled")
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [sessions, selectedStr],
  );

  const totalAlunos = useMemo(
    () => dayClasses.reduce((acc, s) => acc + (reservationsBySession[s.id]?.length ?? 0), 0),
    [dayClasses, reservationsBySession],
  );

  function shiftDay(delta: number) {
    setSelected((d) => { const x = new Date(d); x.setDate(d.getDate() + delta); return x; });
  }
  const isToday = selectedStr === fmtDate(new Date());

  return (
    <div className="admin-page" style={{ maxWidth: "820px", margin: "0 auto" }}>
      <header className="rise" style={{ marginBottom: "20px" }}>
        <span className="section-label" style={{ marginBottom: "12px" }}>
          <CalendarDays size={11} /> Agenda do dia
        </span>
        <h1 className="font-display admin-title" style={{ color: "var(--text-1)", lineHeight: 1.05, marginTop: "12px" }}>
          Aulas agendadas
        </h1>
        <p style={{ marginTop: "6px", fontSize: "13.5px", color: "var(--text-2)" }}>
          Veja todas as aulas e os alunos inscritos no dia escolhido.
        </p>
      </header>

      {/* seletor de dia */}
      <div className="card rise-2" style={{ padding: "14px 16px", marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => shiftDay(-1)} className="ag-nav" aria-label="Dia anterior"><ChevronLeft size={18} /></button>
          <div style={{ textAlign: "center", minWidth: "190px" }}>
            <p className="font-display" style={{ fontSize: "1.15rem", color: "var(--text-1)", lineHeight: 1.1 }}>
              {DAY_NAMES[selected.getDay()]}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-2)" }}>
              {pad(selected.getDate())} de {MONTH_NAMES[selected.getMonth()]} de {selected.getFullYear()}
            </p>
          </div>
          <button onClick={() => shiftDay(1)} className="ag-nav" aria-label="Próximo dia"><ChevronRight size={18} /></button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {!isToday && (
            <button onClick={() => setSelected(new Date())} className="ag-action"><CalendarCheck size={14} /> Hoje</button>
          )}
          <input
            type="date"
            value={selectedStr}
            onChange={(e) => { if (e.target.value) setSelected(new Date(e.target.value + "T00:00:00")); }}
            className="ag-dateinput"
          />
        </div>
      </div>

      {/* resumo */}
      {!loading && dayClasses.length > 0 && (
        <div className="rise-2" style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
          <Pill icon={<CalendarDays size={13} />} text={`${dayClasses.length} ${dayClasses.length === 1 ? "aula" : "aulas"}`} />
          <Pill icon={<Users size={13} />} text={`${totalAlunos} ${totalAlunos === 1 ? "aluno" : "alunos"}`} />
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: "16px", marginBottom: "18px", borderColor: "var(--border-warm)", color: "var(--sunset-2)", fontSize: "13.5px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "var(--text-3)" }}>
          <Loader2 size={26} className="ag-spin" />
        </div>
      ) : dayClasses.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <CircleSlash size={32} style={{ color: "var(--text-3)", margin: "0 auto 14px" }} />
          <h3 className="font-display" style={{ fontSize: "1.3rem", color: "var(--text-1)" }}>Nenhuma aula neste dia</h3>
          <p style={{ fontSize: "13px", color: "var(--text-2)", marginTop: "6px" }}>
            Libere horários em “Horários” para abrir aulas neste dia.
          </p>
        </div>
      ) : (
        <div className="rise-3" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {dayClasses.map((s) => (
            <ClassCard key={s.id} s={s} reservations={reservationsBySession[s.id] ?? []} />
          ))}
        </div>
      )}

      <style>{`
        .admin-page { padding: 32px 28px 60px; }
        .admin-title { font-size: 2.2rem; }
        .ag-spin { animation: ag-spin 0.9s linear infinite; }
        @keyframes ag-spin { to { transform: rotate(360deg); } }
        .ag-nav, .ag-action { display: inline-flex; align-items: center; gap: 6px; background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; color: var(--text-2); cursor: pointer; font-family: inherit; font-size: 12.5px; font-weight: 700; transition: all 0.14s; }
        .ag-nav { padding: 8px; }
        .ag-action { padding: 8px 12px; }
        .ag-nav:hover, .ag-action:hover { color: var(--teal-light); border-color: var(--border-lit); background: var(--bg-4); }
        .ag-dateinput { background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; color: var(--text-1); font-family: inherit; font-size: 13px; padding: 8px 10px; color-scheme: dark; }
        @media (max-width: 640px) {
          .admin-page { padding: 20px 16px 48px; }
          .admin-title { font-size: 1.7rem; }
        }
      `}</style>
    </div>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "var(--text-2)", background: "var(--bg-3)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: "99px" }}>
      <span style={{ color: "var(--teal-light)", display: "flex" }}>{icon}</span>{text}
    </span>
  );
}

function ClassCard({ s, reservations }: { s: Session; reservations: Reservation[] }) {
  const loc = getLocation(s.location);
  const meta = STATUS_META[s.status];
  const pct = s.maxCapacity > 0 ? Math.round((s.currentCapacity / s.maxCapacity) * 100) : 0;

  return (
    <div className="card" style={{ padding: "18px" }}>
      {/* cabeçalho da aula */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ textAlign: "center", minWidth: "84px" }}>
          <Clock size={13} style={{ color: "var(--text-2)" }} />
          <p className="font-display" style={{ fontSize: "1.05rem", color: "var(--text-1)", lineHeight: 1.15, marginTop: "2px", whiteSpace: "nowrap" }}>
            {formatTime(s.startTime)}–{formatTime(s.endTime)}
          </p>
        </div>

        <div style={{ width: "1px", alignSelf: "stretch", background: "var(--border)" }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "14px", color: "var(--text-1)", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
            <MapPin size={12} style={{ color: "var(--teal-light)", flexShrink: 0 }} /> {loc.emoji} {loc.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "7px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: meta.color, background: meta.bg, padding: "2px 9px", borderRadius: "99px" }}>{meta.label}</span>
            <span style={{ fontSize: "12px", color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Users size={12} /> {s.currentCapacity}/{s.maxCapacity}
            </span>
          </div>
          <div style={{ height: "4px", borderRadius: "99px", background: "var(--bg-4)", marginTop: "9px", overflow: "hidden", maxWidth: "260px" }}>
            <div style={{ height: "100%", width: `${pct}%`, borderRadius: "99px", background: pct >= 100 ? "var(--gold)" : "var(--teal)", transition: "width 0.5s" }} />
          </div>
        </div>
      </div>

      {/* alunos inscritos */}
      <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", marginBottom: "10px" }}>
          Alunos inscritos ({reservations.length})
        </p>
        {reservations.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-2)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Ban size={13} /> Nenhum aluno inscrito ainda.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {reservations.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--bg-3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "var(--teal-light)", flexShrink: 0 }}>
                  {(r.customerName || "?").charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-1)", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.customerName}</span>
                {r.payment === "on_arrival" && (
                  <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--gold)", background: "rgba(245,192,48,0.1)", padding: "2px 8px", borderRadius: "99px", whiteSpace: "nowrap" }}>
                    Paga na aula
                  </span>
                )}
                <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: r.status === "confirmed" || r.status === "completed" ? "var(--teal-light)" : "var(--text-2)" }}>
                  {r.status === "reserved" ? "Reservado" : r.status === "confirmed" ? "Confirmado" : r.status === "completed" ? "Concluído" : r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
