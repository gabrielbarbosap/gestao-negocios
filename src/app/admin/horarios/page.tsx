"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock, CaretLeft, CaretRight, Check, CircleNotch, FloppyDisk,
  Checks, Eraser, Users as UsersIcon,
} from "@phosphor-icons/react";
import { useBusinessId } from "@/hooks/useBusinessId";
import { LOCATIONS, type LocationId } from "@/constants/locations";
import { HOURS, DEFAULT_CAPACITY, listSessions, saveWeekGrid } from "@/lib/firebase/sessions";
import type { Session } from "@/types/session";

const DAY_ABBR = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = x.getDay();
  x.setDate(x.getDate() + (wd === 0 ? -6 : 1 - wd));
  return x;
}
const slotKey = (date: string, h: number) => `${date}_${pad(h)}:00`;

export default function HorariosPage() {
  const businessId = useBusinessId();
  const [location, setLocation] = useState<LocationId>(LOCATIONS[0].id);
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [capacity, setCapacity] = useState<number>(DEFAULT_CAPACITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const todayStr = fmtDate(new Date());

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart],
  );
  const weekDates = useMemo(() => days.map(fmtDate), [days]);

  // carrega as sessões da semana visível e monta o conjunto de liberados
  useEffect(() => {
    if (!businessId) { if (businessId === null) setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    listSessions(businessId)
      .then((all: Session[]) => {
        if (cancelled) return;
        const set = new Set<string>();
        let cap = DEFAULT_CAPACITY;
        all.forEach((s) => {
          if (s.location !== location || !weekDates.includes(s.date)) return;
          if (s.status === "available" || s.status === "full") {
            set.add(`${s.date}_${s.startTime}`);
            if (s.maxCapacity) cap = s.maxCapacity;
          }
        });
        setSelected(set);
        setCapacity(cap);
        setDirty(false);
      })
      .catch((e) => console.error("[horarios] load", e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [businessId, location, weekDates]);

  const isPast = (date: string) => date < todayStr;
  const isOn = (date: string, h: number) => selected.has(slotKey(date, h));

  const toggle = useCallback((date: string, h: number) => {
    if (isPast(date)) return;
    setSelected((p) => {
      const next = new Set(p);
      const k = slotKey(date, h);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
    setDirty(true); setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr]);

  const toggleColumn = useCallback((date: string) => {
    if (isPast(date)) return;
    setSelected((p) => {
      const next = new Set(p);
      const allOn = HOURS.every((h) => next.has(slotKey(date, h)));
      HOURS.forEach((h) => { const k = slotKey(date, h); allOn ? next.delete(k) : next.add(k); });
      return next;
    });
    setDirty(true); setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr]);

  const toggleRow = useCallback((h: number) => {
    setSelected((p) => {
      const next = new Set(p);
      const futureDates = weekDates.filter((d) => !isPast(d));
      const allOn = futureDates.every((d) => next.has(slotKey(d, h)));
      futureDates.forEach((d) => { const k = slotKey(d, h); allOn ? next.delete(k) : next.add(k); });
      return next;
    });
    setDirty(true); setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, todayStr]);

  const setWeek = useCallback((val: boolean) => {
    setSelected((p) => {
      const next = new Set(p);
      weekDates.filter((d) => !isPast(d)).forEach((d) =>
        HOURS.forEach((h) => { const k = slotKey(d, h); val ? next.add(k) : next.delete(k); }));
      return next;
    });
    setDirty(true); setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, todayStr]);

  function shiftWeek(delta: number) {
    setWeekStart((w) => { const x = new Date(w); x.setDate(w.getDate() + delta * 7); return x; });
  }
  const atCurrentWeek = fmtDate(weekStart) <= fmtDate(mondayOf(new Date()));

  const weekLabel = `${pad(days[0].getDate())} ${MONTH_ABBR[days[0].getMonth()]} – ${pad(days[6].getDate())} ${MONTH_ABBR[days[6].getMonth()]}`;
  const totalSemana = useMemo(
    () => weekDates.reduce((acc, d) => acc + HOURS.filter((h) => selected.has(slotKey(d, h))).length, 0),
    [weekDates, selected],
  );

  async function handleSave() {
    if (!businessId) return;
    setSaving(true); setSaved(false);
    try {
      const desired = new Set(
        [...selected].filter((k) => weekDates.includes(k.split("_")[0])),
      );
      await saveWeekGrid(businessId, location, weekDates, desired, capacity);
      setDirty(false); setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error("[horarios] save", e);
      alert("Erro ao salvar. Tente novamente.");
    } finally { setSaving(false); }
  }

  return (
    <div className="admin-page" style={{ maxWidth: "960px", margin: "0 auto" }}>
      <header className="rise" style={{ marginBottom: "18px" }}>
        <span className="section-label" style={{ marginBottom: "12px" }}>
          <Clock size={11} /> Liberação de horários
        </span>
        <h1 className="font-display admin-title" style={{ color: "var(--text-1)", lineHeight: 1.05, marginTop: "12px" }}>
          Liberar horários
        </h1>
        <p style={{ marginTop: "6px", fontSize: "13.5px", color: "var(--text-2)" }}>
          Navegue pelas semanas e toque nas datas para liberar ou bloquear cada horário.
        </p>
      </header>

      {/* tabs de local */}
      <div className="rise-2" style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        {LOCATIONS.map((l) => {
          const active = location === l.id;
          return (
            <button key={l.id} onClick={() => setLocation(l.id)}
              style={{
                fontSize: "13.5px", fontWeight: 700, padding: "9px 16px", borderRadius: "10px", cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
                color: active ? "var(--bg)" : "var(--text-2)",
                background: active ? "var(--teal-light)" : "var(--bg-3)",
                border: `1px solid ${active ? "var(--teal-light)" : "var(--border)"}`,
              }}>
              {l.emoji} {l.name}
            </button>
          );
        })}
      </div>

      {/* navegação de semana + ações */}
      <div className="card rise-2" style={{ padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => shiftWeek(-1)} className="hr-navbtn" disabled={atCurrentWeek} aria-label="Semana anterior"><CaretLeft size={18} /></button>
          <span className="font-display" style={{ fontSize: "1.05rem", color: "var(--text-1)", minWidth: "140px", textAlign: "center" }}>{weekLabel}</span>
          <button onClick={() => shiftWeek(1)} className="hr-navbtn" aria-label="Próxima semana"><CaretRight size={18} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--text-2)", fontWeight: 600 }}>
            <UsersIcon size={14} /> Vagas
            <input type="number" min={1} max={50} value={capacity}
              onChange={(e) => { setCapacity(Math.max(1, Number(e.target.value) || 1)); setDirty(true); }}
              style={{ width: "58px", height: "34px", textAlign: "center", background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-1)", fontFamily: "inherit", fontSize: "13px" }} />
          </label>
          <button onClick={() => setWeek(true)} className="hr-action"><Checks size={14} /> Liberar semana</button>
          <button onClick={() => setWeek(false)} className="hr-action"><Eraser size={14} /> Limpar</button>
        </div>
      </div>

      {/* grade */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "var(--text-3)" }}>
          <CircleNotch size={26} className="ph-spin" />
        </div>
      ) : (
        <div className="card rise-3" style={{ padding: "16px", overflowX: "auto" }}>
          <div className="hr-grid" style={{ minWidth: "620px" }}>
            <div />
            {days.map((d) => {
              const ds = fmtDate(d);
              const past = isPast(ds);
              const today = ds === todayStr;
              return (
                <button key={ds} onClick={() => toggleColumn(ds)} className="hr-colhead" disabled={past} title="Liberar/bloquear o dia">
                  <span style={{ fontSize: "10px", color: today ? "var(--teal-light)" : "var(--text-3)" }}>{DAY_ABBR[d.getDay()]}</span>
                  <span className="font-display" style={{ fontSize: "1rem", color: today ? "var(--teal-light)" : past ? "var(--text-3)" : "var(--text-1)", display: "block" }}>{pad(d.getDate())}</span>
                </button>
              );
            })}

            {HOURS.map((h) => (
              <div key={h} style={{ display: "contents" }}>
                <button onClick={() => toggleRow(h)} className="hr-rowhead" title="Liberar/bloquear a linha">
                  {pad(h)}–{pad(h + 1)}h
                </button>
                {days.map((d) => {
                  const ds = fmtDate(d);
                  const past = isPast(ds);
                  const on = isOn(ds, h);
                  return (
                    <button key={ds + h} onClick={() => toggle(ds, h)} disabled={past}
                      className={`hr-cell ${on ? "on" : ""} ${past ? "past" : ""}`} aria-pressed={on}>
                      {on && <Check size={15} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* barra inferior */}
      <div className="hr-savebar rise-4">
        <span style={{ fontSize: "13px", color: "var(--text-2)" }}>
          <strong style={{ color: "var(--teal-light)" }}>{totalSemana}</strong> horários liberados nesta semana
        </span>
        <button onClick={handleSave} disabled={saving || !dirty} className="btn-primary" style={{ height: "44px", padding: "0 22px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          {saving ? <CircleNotch size={17} className="ph-spin" /> : saved ? <Check size={17} /> : <FloppyDisk size={17} />}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar semana"}
        </button>
      </div>

      <style>{`
        .admin-page { padding: 32px 28px 120px; }
        .admin-title { font-size: 2.2rem; }
        .ph-spin { animation: ph-spin 0.9s linear infinite; }
        @keyframes ph-spin { to { transform: rotate(360deg); } }

        .hr-navbtn, .hr-action {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px;
          color: var(--text-2); cursor: pointer; font-family: inherit; font-size: 12.5px; font-weight: 700;
          padding: 8px 12px; transition: all 0.14s;
        }
        .hr-navbtn { padding: 8px; }
        .hr-navbtn:hover:not(:disabled), .hr-action:hover { color: var(--teal-light); border-color: var(--border-lit); background: var(--bg-4); }
        .hr-navbtn:disabled { opacity: 0.35; cursor: not-allowed; }

        .hr-grid { display: grid; grid-template-columns: 76px repeat(7, 1fr); gap: 6px; }
        .hr-colhead, .hr-rowhead { background: none; border: none; cursor: pointer; font-family: inherit; font-weight: 700; color: var(--text-2); transition: color 0.14s; }
        .hr-colhead { padding: 6px 0; text-align: center; }
        .hr-colhead:disabled { cursor: not-allowed; }
        .hr-rowhead { font-size: 11.5px; text-align: right; padding-right: 8px; white-space: nowrap; }
        .hr-colhead:hover:not(:disabled), .hr-rowhead:hover { color: var(--teal-light); }

        .hr-cell {
          height: 40px; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.04);
          color: var(--teal-light); transition: all 0.13s;
        }
        .hr-cell:hover:not(.past) { border-color: var(--border-lit); background: rgba(26,138,122,0.08); }
        .hr-cell.on { background: rgba(26,138,122,0.16); border: 1px solid rgba(46,191,181,0.45); box-shadow: 0 0 12px rgba(26,138,122,0.25); }
        .hr-cell.on:hover { background: rgba(232,120,48,0.14); border-color: var(--border-warm); color: var(--sunset-2); }
        .hr-cell.past { opacity: 0.25; cursor: not-allowed; }

        .hr-savebar { position: sticky; bottom: 0; margin: 18px -28px -120px; padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; background: linear-gradient(180deg, transparent, var(--bg) 38%); }

        @media (max-width: 640px) {
          .admin-page { padding: 20px 16px 120px; }
          .admin-title { font-size: 1.7rem; }
          .hr-savebar { margin: 18px -16px -120px; padding: 14px 16px; }
        }
      `}</style>
    </div>
  );
}
