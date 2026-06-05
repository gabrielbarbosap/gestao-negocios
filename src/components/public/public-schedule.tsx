"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { LOCATIONS, type LocationId } from "@/constants/locations";
import { HOURS, fetchPublicAvailableSlots } from "@/lib/firebase/sessions";

const DAY_ABBR = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// segunda-feira da semana que contém `d`
function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = x.getDay();           // 0=Dom..6=Sáb
  const diff = wd === 0 ? -6 : 1 - wd;
  x.setDate(x.getDate() + diff);
  return x;
}

export function PublicSchedule() {
  const [activeLocation, setActiveLocation] = useState<LocationId>("maracaipe");
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [slotsSet, setSlotsSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { requireAuth } = useRequireAuth();

  // carrega as aulas disponíveis do local (uma vez por local)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicAvailableSlots(activeLocation)
      .then((s) => { if (!cancelled) setSlotsSet(s); })
      .catch((e) => { console.error("[public-schedule]", e); if (!cancelled) setSlotsSet(new Set()); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeLocation]);

  // as 7 datas da semana visível (Seg→Dom)
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const todayStr = fmtDate(new Date());

  // disponível se há uma aula liberada (sessão) naquela data/hora
  const isOn = (date: Date, h: number) => {
    if (fmtDate(date) < todayStr) return false;
    return slotsSet.has(`${fmtDate(date)}-${h}`);
  };

  // só mostra as horas com ao menos um dia disponível na semana
  const activeHours = useMemo(
    () => HOURS.filter((h) => days.some((d) => isOn(d, h))),
    [days, slotsSet], // eslint-disable-line react-hooks/exhaustive-deps
  );

  function weekLabel(): string {
    const a = days[0], b = days[6];
    const left = `${pad(a.getDate())} ${MONTH_ABBR[a.getMonth()]}`;
    const right = `${pad(b.getDate())} ${MONTH_ABBR[b.getMonth()]}`;
    return `${left} – ${right}`;
  }

  function shiftWeek(delta: number) {
    setWeekStart((w) => {
      const x = new Date(w);
      x.setDate(w.getDate() + delta * 7);
      return x;
    });
  }

  const atCurrentWeek = fmtDate(weekStart) <= fmtDate(mondayOf(new Date()));

  function handleBook(date: Date, h: number) {
    requireAuth(() =>
      alert(`Para reservar ${date.toLocaleDateString("pt-BR")} às ${pad(h)}:00, acesse "Agendar aula".`),
    );
  }

  return (
    <div>
      {/* Local + navegação de semana */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {LOCATIONS.map((loc) => {
            const active = activeLocation === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => setActiveLocation(loc.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  padding: "8px 16px", borderRadius: "9px",
                  fontSize: "13px", fontWeight: 700, border: "1px solid",
                  cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                  background: active ? "var(--teal-light)" : "var(--bg-3)",
                  borderColor: active ? "var(--teal-light)" : "var(--border)",
                  color: active ? "var(--bg)" : "var(--text-2)",
                }}
              >
                <span>{loc.emoji}</span>
                {loc.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button onClick={() => shiftWeek(-1)} className="ps-nav" disabled={atCurrentWeek} aria-label="Semana anterior"><ChevronLeft size={16} /></button>
          <span className="font-display" style={{ fontSize: "0.95rem", color: "var(--text-1)", minWidth: "118px", textAlign: "center" }}>
            {weekLabel()}
          </span>
          <button onClick={() => shiftWeek(1)} className="ps-nav" aria-label="Próxima semana"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Grade da semana (datas reais) */}
      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "44px", color: "var(--text-3)" }}>
            <Loader2 size={22} className="ps-spin" />
          </div>
        ) : activeHours.length === 0 ? (
          <p style={{ padding: "32px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>
            Nenhum horário disponível nesta semana. Use a seta › para ver as próximas.
          </p>
        ) : (
          <table style={{ width: "100%", minWidth: "440px", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "12px 14px 12px 18px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-3)", width: "76px", letterSpacing: "0.05em" }}>HORA</th>
                {days.map((d) => {
                  const isToday = fmtDate(d) === todayStr;
                  return (
                    <th key={d.toISOString()} style={{ padding: "10px 4px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: isToday ? "var(--teal-light)" : "var(--text-3)", letterSpacing: "0.05em" }}>
                        {DAY_ABBR[d.getDay()]}
                      </div>
                      <div className="font-display" style={{ fontSize: "1rem", color: isToday ? "var(--teal-light)" : "var(--text-1)", marginTop: "2px" }}>
                        {pad(d.getDate())}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {activeHours.map((h, i) => (
                <tr key={h} style={{ borderBottom: i < activeHours.length - 1 ? "1px solid var(--border)" : "none", background: i % 2 !== 0 ? "rgba(255,255,255,0.012)" : "transparent" }}>
                  <td style={{ padding: "8px 14px 8px 18px", fontSize: "11px", fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                    {pad(h)}–{pad(h + 1)}h
                  </td>
                  {days.map((d) => {
                    const on = isOn(d, h);
                    return (
                      <td key={d.toISOString()} style={{ padding: "5px 3px" }}>
                        {on ? (
                          <button
                            onClick={() => handleBook(d, h)}
                            title={`${d.toLocaleDateString("pt-BR")} ${pad(h)}:00`}
                            className="slot-on"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "32px", width: "100%", maxWidth: "46px", margin: "0 auto" }}
                          >
                            ●
                          </button>
                        ) : (
                          <div className="slot-off" style={{ height: "32px", width: "100%", maxWidth: "46px", margin: "0 auto" }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderTop: "1px solid var(--border)" }}>
          <span style={{ display: "inline-block", width: "9px", height: "9px", borderRadius: "50%", background: "var(--teal-light)", boxShadow: "0 0 6px var(--teal-light)" }} />
          <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Disponível — clique para agendar</span>
        </div>
      </div>

      <style>{`
        .ps-nav { display: inline-flex; align-items: center; justify-content: center; background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; color: var(--text-2); cursor: pointer; padding: 7px; transition: all 0.14s; }
        .ps-nav:hover:not(:disabled) { color: var(--teal-light); border-color: var(--border-lit); }
        .ps-nav:disabled { opacity: 0.35; cursor: not-allowed; }
        .ps-spin { animation: ps-spin 0.9s linear infinite; }
        @keyframes ps-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
