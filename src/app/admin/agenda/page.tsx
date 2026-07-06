"use client";

import { useMemo, useState } from "react";
import {
  CalendarDots, Clock, MapPin, Users, CircleNotch,
  CaretLeft, CaretRight, CalendarCheck, WaveTriangle, Wallet,
} from "@phosphor-icons/react";
import { useBusinessId } from "@/hooks/useBusinessId";
import { useAdminAgenda } from "@/hooks/useAdminAgenda";
import { getLocation, LOCATIONS, type LocationId } from "@/constants/locations";
import { formatTime } from "@/lib/utils";
import type { Session } from "@/types/session";
import type { Reservation } from "@/types/reservation";

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTH_NAMES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function AgendaPage() {
  const businessId = useBusinessId();
  const { loading, error, sessions, reservationsBySession } = useAdminAgenda(businessId);
  const [selected, setSelected] = useState<Date>(() => new Date());
  const [locationFilter, setLocationFilter] = useState<LocationId | "todas">("todas");

  const selectedStr = fmtDate(selected);
  const isToday = selectedStr === fmtDate(new Date());

  const dayClasses = useMemo(() =>
    sessions
      .filter((s) =>
        s.date === selectedStr &&
        s.status !== "cancelled" &&
        s.status !== "blocked" &&
        (locationFilter === "todas" || s.location === locationFilter)
      )
      .sort((a, b) => {
        if (a.location !== b.location) return a.location.localeCompare(b.location);
        return a.startTime.localeCompare(b.startTime);
      }),
    [sessions, selectedStr, locationFilter],
  );

  const totalAlunos = useMemo(
    () => dayClasses.reduce((acc, s) => acc + (reservationsBySession[s.id]?.filter(r => r.status !== "cancelled").length ?? 0), 0),
    [dayClasses, reservationsBySession],
  );

  // Agrupa por local
  const byLocation = useMemo(() => {
    const map = new Map<LocationId, Session[]>();
    dayClasses.forEach((s) => {
      if (!map.has(s.location)) map.set(s.location, []);
      map.get(s.location)!.push(s);
    });
    return map;
  }, [dayClasses]);

  function shiftDay(delta: number) {
    setSelected((d) => { const x = new Date(d); x.setDate(d.getDate() + delta); return x; });
  }

  const dateLabel = `${DAY_NAMES[selected.getDay()]}, ${pad(selected.getDate())} de ${MONTH_NAMES[selected.getMonth()]}. de ${selected.getFullYear()}`;

  return (
    <div className="admin-page" style={{ maxWidth: "860px", margin: "0 auto" }}>

      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <header className="rise" style={{ marginBottom: "22px" }}>
        <span className="section-label" style={{ marginBottom: "12px" }}>
          <CalendarDots size={11} /> Agenda do dia
        </span>
        <h1 className="font-display admin-title" style={{ color: "var(--text-1)", lineHeight: 1.05, marginTop: "12px" }}>
          Aulas do dia
        </h1>
      </header>

      {/* ── Seletor de dia ────────────────────────────────────────────────── */}
      <div className="card rise-2" style={{ padding: "14px 18px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => shiftDay(-1)} className="ag-nav" aria-label="Dia anterior"><CaretLeft size={18} /></button>
          <div style={{ textAlign: "center", minWidth: "200px" }}>
            <p className="font-display" style={{ fontSize: "1.2rem", color: "var(--text-1)", lineHeight: 1.1 }}>
              {DAY_NAMES[selected.getDay()]}
            </p>
            <p style={{ fontSize: "12.5px", color: "var(--text-2)", marginTop: "2px" }}>
              {pad(selected.getDate())} de {MONTH_NAMES[selected.getMonth()]}. de {selected.getFullYear()}
            </p>
          </div>
          <button onClick={() => shiftDay(1)} className="ag-nav" aria-label="Próximo dia"><CaretRight size={18} /></button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {!isToday && (
            <button onClick={() => setSelected(new Date())} className="ag-action">
              <CalendarCheck size={14} /> Hoje
            </button>
          )}
          <input
            type="date" value={selectedStr}
            onChange={(e) => { if (e.target.value) setSelected(new Date(e.target.value + "T00:00:00")); }}
            className="ag-dateinput"
          />
        </div>
      </div>

      {/* ── Filtro de local ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {(["todas", ...LOCATIONS.map(l => l.id)] as const).map((loc) => {
          const active = locationFilter === loc;
          const label = loc === "todas" ? "Todas as praias" : getLocation(loc as LocationId).name;
          return (
            <button key={loc} onClick={() => setLocationFilter(loc as LocationId | "todas")}
              style={{
                padding: "7px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 700,
                border: "1px solid", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                background: active ? "var(--coral)" : "var(--bg-3)",
                borderColor: active ? "var(--coral)" : "var(--border)",
                color: active ? "#fff" : "var(--text-2)",
              }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Resumo ────────────────────────────────────────────────────────── */}
      {!loading && dayClasses.length > 0 && (
        <div className="rise-2" style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
          <Pill icon={<CalendarDots size={13} />} text={`${dayClasses.length} aula${dayClasses.length !== 1 ? "s" : ""}`} />
          <Pill icon={<Users size={13} />} text={`${totalAlunos} aluno${totalAlunos !== 1 ? "s" : ""} inscrito${totalAlunos !== 1 ? "s" : ""}`} />
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: "16px", marginBottom: "18px", borderColor: "var(--border-warm)", color: "var(--sunset-2)", fontSize: "13.5px" }}>
          {error}
        </div>
      )}

      {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <CircleNotch size={26} className="ph-spin" style={{ color: "var(--ocean)" }} />
        </div>
      ) : dayClasses.length === 0 ? (
        <div className="card" style={{ padding: "56px 24px", textAlign: "center" }}>
          <CalendarDots size={36} style={{ color: "var(--text-3)", margin: "0 auto 14px" }} />
          <h3 className="font-display" style={{ fontSize: "1.3rem", color: "var(--text-1)" }}>Nenhuma aula neste dia</h3>
          <p style={{ fontSize: "13px", color: "var(--text-2)", marginTop: "6px" }}>
            Libere horários para abrir aulas neste dia.
          </p>
          <a href="/admin/horarios" className="btn-outline" style={{ display: "inline-block", marginTop: "16px", padding: "9px 20px", fontSize: "13px" }}>
            Liberar horários
          </a>
        </div>
      ) : (
        <div className="rise-3" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Array.from(byLocation.entries()).map(([locId, locSessions]) => {
            const loc = getLocation(locId);
            const locAlunos = locSessions.reduce(
              (acc, s) => acc + (reservationsBySession[s.id]?.filter(r => r.status !== "cancelled").length ?? 0), 0
            );
            return (
              <section key={locId}>
                {/* Cabeçalho do local */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", paddingBottom: "10px", borderBottom: "2px solid var(--border-lit)" }}>
                  <MapPin size={16} weight="fill" style={{ color: "var(--ocean)" }} />
                  <h2 className="font-display" style={{ fontSize: "1.3rem", color: "var(--ocean)" }}>{loc.name}</h2>
                  <span style={{ fontSize: "12px", color: "var(--text-3)", marginLeft: "auto" }}>
                    {locSessions.length} aula{locSessions.length !== 1 ? "s" : ""} · {locAlunos} aluno{locAlunos !== 1 ? "s" : ""}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {locSessions.map((s) => (
                    <ClassCard
                      key={s.id}
                      s={s}
                      reservations={(reservationsBySession[s.id] ?? []).filter(r => r.status !== "cancelled")}
                      dateLabel={dateLabel}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <style>{`
        .admin-page { padding: 32px 28px 60px; }
        .admin-title { font-size: 2.2rem; }
        .ph-spin { animation: ph-spin 0.9s linear infinite; }
        @keyframes ph-spin { to { transform: rotate(360deg); } }
        .ag-nav, .ag-action { display: inline-flex; align-items: center; gap: 6px; background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; color: var(--text-2); cursor: pointer; font-family: inherit; font-size: 12.5px; font-weight: 700; transition: all 0.14s; }
        .ag-nav { padding: 8px; }
        .ag-action { padding: 8px 12px; }
        .ag-nav:hover, .ag-action:hover { color: var(--teal-light); border-color: var(--border-lit); background: var(--bg-4); }
        .ag-dateinput { background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; color: var(--text-1); font-family: inherit; font-size: 13px; padding: 8px 10px; color-scheme: dark; }
        @media (max-width: 640px) {
          .admin-page { padding: 20px 16px 48px; }
          .admin-title { font-size: 1.7rem; }
        }
        @media print {
          .admin-page { padding: 0; }
          .ag-nav, .ag-action, .ag-dateinput, button { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "var(--text-2)", background: "var(--bg-3)", border: "1px solid var(--border)", padding: "6px 14px", borderRadius: "99px" }}>
      <span style={{ color: "var(--ocean)", display: "flex" }}>{icon}</span>{text}
    </span>
  );
}

function ClassCard({ s, reservations, dateLabel }: { s: Session; reservations: Reservation[]; dateLabel: string }) {
  const pct = s.maxCapacity > 0 ? Math.round((reservations.length / s.maxCapacity) * 100) : 0;
  const isFull = reservations.length >= s.maxCapacity;
  const isEmpty = reservations.length === 0;

  return (
    <div className="card" style={{ overflow: "hidden", border: isFull ? "1px solid rgba(245,192,48,0.3)" : undefined }}>

      {/* ── Cabeçalho da aula ─────────────────────── */}
      <div style={{
        padding: "16px 20px",
        background: isFull ? "rgba(245,192,48,0.06)" : "var(--bg-3)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
      }}>
        {/* Horário — destaque máximo */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            background: "var(--bg-4)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "10px 18px", textAlign: "center",
          }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
              horário
            </p>
            <p className="font-display" style={{ fontSize: "1.6rem", color: "var(--text-1)", lineHeight: 1, whiteSpace: "nowrap" }}>
              {formatTime(s.startTime)}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-2)", marginTop: "2px" }}>
              até {formatTime(s.endTime)}
            </p>
          </div>

          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
              data
            </p>
            <p style={{ fontSize: "13.5px", color: "var(--text-1)", fontWeight: 700, textTransform: "capitalize" }}>
              {dateLabel}
            </p>
          </div>
        </div>

        {/* Ocupação */}
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", marginBottom: "8px" }}>
            <Users size={14} style={{ color: "var(--text-2)" }} />
            <span className="font-display" style={{ fontSize: "1.8rem", color: isFull ? "var(--gold)" : "var(--text-1)", lineHeight: 1 }}>
              {reservations.length}
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-3)" }}>/ {s.maxCapacity}</span>
          </div>
          {/* Barra de ocupação */}
          <div style={{ width: "120px", height: "6px", borderRadius: "99px", background: "var(--bg-4)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`, borderRadius: "99px",
              background: isFull ? "var(--gold)" : "var(--teal)",
              transition: "width 0.5s",
            }} />
          </div>
          <p style={{ fontSize: "11px", color: isFull ? "var(--gold)" : "var(--text-3)", marginTop: "4px", fontWeight: 700 }}>
            {isFull ? "LOTADA" : `${s.maxCapacity - reservations.length} vaga${s.maxCapacity - reservations.length !== 1 ? "s" : ""} livre${s.maxCapacity - reservations.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* ── Lista de alunos ───────────────────────── */}
      <div style={{ padding: "16px 20px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: "12px" }}>
          Alunos inscritos
        </p>

        {isEmpty ? (
          <p style={{ fontSize: "13px", color: "var(--text-3)", fontStyle: "italic" }}>
            Nenhum aluno inscrito nesta aula.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {reservations.map((r, idx) => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "11px 0",
                borderBottom: idx < reservations.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                {/* Número */}
                <span className="font-display" style={{ fontSize: "1.1rem", color: "var(--text-3)", minWidth: "24px", textAlign: "right" }}>
                  {idx + 1}.
                </span>

                {/* Avatar */}
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--bg-3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "var(--ocean)", flexShrink: 0 }}>
                  {(r.customerName || "?").charAt(0).toUpperCase()}
                </div>

                {/* Nome */}
                <p style={{ fontSize: "14px", color: "var(--text-1)", fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.customerName || "Aluno"}
                </p>

                {/* Badges */}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                  {r.payment === "pix" && r.status !== "confirmed" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "var(--gold)", background: "rgba(245,192,48,0.1)", border: "1px solid rgba(245,192,48,0.25)", padding: "3px 9px", borderRadius: "99px", whiteSpace: "nowrap" }}>
                      <Wallet size={11} /> PIX pendente
                    </span>
                  )}
                  {r.payment === "pix" && r.status === "confirmed" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "var(--ocean)", background: "rgba(46,191,181,0.1)", border: "1px solid rgba(46,191,181,0.25)", padding: "3px 9px", borderRadius: "99px", whiteSpace: "nowrap" }}>
                      <Wallet size={11} /> PIX pago
                    </span>
                  )}
                  {r.payment === "credit" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "var(--ocean)", background: "rgba(232,97,42,0.08)", border: "1px solid rgba(46,191,181,0.2)", padding: "3px 9px", borderRadius: "99px", whiteSpace: "nowrap" }}>
                      <WaveTriangle size={11} /> Credito
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
