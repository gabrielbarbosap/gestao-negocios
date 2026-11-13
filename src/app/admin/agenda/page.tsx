"use client";

import { useMemo, useState } from "react";
import {
  CalendarDots, Clock, MapPin, Users, CircleNotch,
  CaretLeft, CaretRight, CalendarCheck, WaveTriangle, Wallet, Copy, Check,
  Plus, X, FloppyDisk, WarningCircle,
} from "@phosphor-icons/react";
import { useBusinessId } from "@/hooks/useBusinessId";
import { useAdminAgenda } from "@/hooks/useAdminAgenda";
import { getLocation, LOCATIONS, type LocationId } from "@/constants/locations";
import { HOURS, DEFAULT_CAPACITY, createSession, DuplicateSessionError } from "@/lib/firebase/sessions";
import { formatTime } from "@/lib/utils";
import type { Session } from "@/types/session";
import type { Reservation } from "@/types/reservation";

// Monta um texto simples com a agenda do dia, pronto pra colar no WhatsApp.
function buildAgendaText(
  dateLabel: string,
  byLocation: Map<LocationId, Session[]>,
  reservationsBySession: Record<string, Reservation[]>,
): string {
  const lines: string[] = [`Aulas — ${dateLabel}`, ""];

  byLocation.forEach((locSessions, locId) => {
    lines.push(`📍 ${getLocation(locId).name}`);
    locSessions.forEach((s) => {
      const alunos = (reservationsBySession[s.id] ?? []).filter((r) => r.status !== "cancelled");
      lines.push(`${formatTime(s.startTime)}–${formatTime(s.endTime)} (${alunos.length}/${s.maxCapacity})`);
      if (alunos.length === 0) {
        lines.push("  sem alunos inscritos");
      } else {
        alunos.forEach((r, i) => lines.push(`  ${i + 1}. ${r.customerName || "Aluno"}`));
      }
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTH_NAMES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function AgendaPage() {
  const businessId = useBusinessId();
  const { loading, error, sessions, reservationsBySession, reload } = useAdminAgenda(businessId);
  const [selected, setSelected] = useState<Date>(() => new Date());
  const [locationFilter, setLocationFilter] = useState<LocationId | "todas">("todas");
  const [copied, setCopied] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

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

  async function handleCopy() {
    const text = buildAgendaText(dateLabel, byLocation, reservationsBySession);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
          <button onClick={() => setShowAdd(true)} className="ag-add">
            <Plus size={15} weight="bold" /> Adicionar aula
          </button>
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
        <div className="rise-2" style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
          <Pill icon={<CalendarDots size={13} />} text={`${dayClasses.length} aula${dayClasses.length !== 1 ? "s" : ""}`} />
          <Pill icon={<Users size={13} />} text={`${totalAlunos} aluno${totalAlunos !== 1 ? "s" : ""} inscrito${totalAlunos !== 1 ? "s" : ""}`} />
          <button onClick={handleCopy} className="ag-action" style={{ marginLeft: "auto" }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copiado!" : "Copiar agenda"}
          </button>
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
            Adicione uma aula para este dia ou libere vários horários de uma vez.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "16px" }}>
            <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 20px", fontSize: "13px" }}>
              <Plus size={15} weight="bold" /> Adicionar aula
            </button>
            <a href="/admin/horarios" className="btn-outline" style={{ display: "inline-block", padding: "9px 20px", fontSize: "13px" }}>
              Liberar horários
            </a>
          </div>
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

      {/* ── Modal: adicionar aula ─────────────────────────────────────────── */}
      {showAdd && businessId && (
        <AddClassModal
          businessId={businessId}
          date={selectedStr}
          dateLabel={dateLabel}
          defaultLocation={locationFilter === "todas" ? LOCATIONS[0].id : locationFilter}
          onClose={() => setShowAdd(false)}
          onCreated={(createdDate) => {
            setShowAdd(false);
            setSelected(new Date(createdDate + "T00:00:00"));
            reload();
          }}
        />
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
        .ag-add { display: inline-flex; align-items: center; gap: 6px; background: var(--coral); border: 1px solid var(--coral); border-radius: 8px; color: #fff; cursor: pointer; font-family: inherit; font-size: 12.5px; font-weight: 700; padding: 8px 14px; transition: all 0.14s; }
        .ag-add:hover { filter: brightness(1.07); }

        .ag-overlay { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.55); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .ag-modal { width: 100%; max-width: 440px; background: var(--card-bg); border: 1px solid var(--border-lit); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,0.45); overflow: hidden; }
        .ag-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--border); }
        .ag-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .ag-modal-foot { padding: 16px 20px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; }
        .ag-field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 7px; }
        .ag-input { width: 100%; background: var(--bg-3); border: 1px solid var(--border); border-radius: 9px; color: var(--text-1); font-family: inherit; font-size: 14px; padding: 10px 12px; color-scheme: dark; }
        .ag-input:focus { outline: none; border-color: var(--border-lit); }
        .ag-loc-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .ag-loc-btn { flex: 1; min-width: 120px; padding: 10px 12px; border-radius: 9px; font-size: 13px; font-weight: 700; border: 1px solid var(--border); background: var(--bg-3); color: var(--text-2); cursor: pointer; font-family: inherit; transition: all 0.14s; }
        .ag-loc-btn.active { background: var(--coral); border-color: var(--coral); color: #fff; }
        .ag-modal-close { background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; color: var(--text-2); cursor: pointer; padding: 7px; display: inline-flex; transition: all 0.14s; }
        .ag-modal-close:hover { color: var(--text-1); border-color: var(--border-lit); }
        .ag-dup { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--sunset-2); background: rgba(232,120,48,0.08); border: 1px solid var(--border-warm); border-radius: 9px; padding: 10px 12px; }
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

// ─── Modal: adicionar uma aula ao dia ──────────────────────────────────────
const hourLabel = (h: number) => `${pad(h)}h – ${pad(h + 1)}h`;

function AddClassModal({
  businessId, date, dateLabel, defaultLocation, onClose, onCreated,
}: {
  businessId: string;
  date: string;
  dateLabel: string;
  defaultLocation: LocationId;
  onClose: () => void;
  onCreated: (createdDate: string) => void;
}) {
  const [classDate, setClassDate] = useState(date);
  const [location, setLocation] = useState<LocationId>(defaultLocation);
  const [hour, setHour] = useState<number>(HOURS[1]); // 06h por padrão
  const [capacityInput, setCapacityInput] = useState(String(DEFAULT_CAPACITY));
  const [saving, setSaving] = useState(false);
  const [dupMsg, setDupMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (saving) return;
    setSaving(true);
    setDupMsg(null);
    setError(null);
    const n = parseInt(capacityInput, 10);
    const capacity = isNaN(n) ? DEFAULT_CAPACITY : Math.min(50, Math.max(1, n));
    try {
      await createSession(businessId, { location, date: classDate, startHour: hour, capacity });
      onCreated(classDate);
    } catch (e) {
      if (e instanceof DuplicateSessionError) {
        setDupMsg(e.message);
      } else {
        console.error("[agenda] createSession", e);
        setError("Não foi possível criar a aula. Tente novamente.");
      }
      setSaving(false);
    }
  }

  const sameDay = classDate === date;

  return (
    <div className="ag-overlay" onClick={onClose}>
      <div className="ag-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ag-modal-head">
          <div>
            <p className="font-display" style={{ fontSize: "1.25rem", color: "var(--text-1)", lineHeight: 1.1 }}>Nova aula</p>
            <p style={{ fontSize: "12.5px", color: "var(--text-2)", marginTop: "2px", textTransform: "capitalize" }}>
              {sameDay ? dateLabel : classDate}
            </p>
          </div>
          <button className="ag-modal-close" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
        </div>

        <div className="ag-modal-body">
          {/* Data */}
          <div>
            <label className="ag-field-label">Data</label>
            <input
              type="date" className="ag-input" value={classDate}
              onChange={(e) => { if (e.target.value) { setClassDate(e.target.value); setDupMsg(null); } }}
            />
          </div>

          {/* Praia */}
          <div>
            <label className="ag-field-label">Praia</label>
            <div className="ag-loc-row">
              {LOCATIONS.map((l) => (
                <button
                  key={l.id} type="button"
                  className={`ag-loc-btn ${location === l.id ? "active" : ""}`}
                  onClick={() => { setLocation(l.id); setDupMsg(null); }}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Horário + vagas */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label className="ag-field-label"><Clock size={11} style={{ verticalAlign: "-1px", marginRight: "4px" }} />Horário</label>
              <select
                className="ag-input" value={hour}
                onChange={(e) => { setHour(Number(e.target.value)); setDupMsg(null); }}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{hourLabel(h)}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label className="ag-field-label"><Users size={11} style={{ verticalAlign: "-1px", marginRight: "4px" }} />Vagas</label>
              <input
                type="number" min={1} max={50} className="ag-input" value={capacityInput}
                onChange={(e) => setCapacityInput(e.target.value)}
                onBlur={() => {
                  const n = parseInt(capacityInput, 10);
                  const clamped = isNaN(n) || n < 1 ? 1 : Math.min(50, n);
                  setCapacityInput(String(clamped));
                }}
              />
            </div>
          </div>

          {dupMsg && (
            <div className="ag-dup">
              <WarningCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{dupMsg}</span>
            </div>
          )}
          {error && (
            <div className="ag-dup" style={{ color: "var(--sunset-2)" }}>
              <WarningCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="ag-modal-foot">
          <button onClick={onClose} className="btn-outline" style={{ padding: "9px 18px", fontSize: "13px" }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 20px", fontSize: "13px" }}>
            {saving ? <CircleNotch size={16} className="ph-spin" /> : <FloppyDisk size={16} />}
            {saving ? "Criando..." : "Criar aula"}
          </button>
        </div>
      </div>
    </div>
  );
}
