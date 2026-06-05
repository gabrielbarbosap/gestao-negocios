"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CaretLeft, CaretRight, CircleNotch, Check, MapPin, Clock, Ticket, Wallet, X, UserCircle } from "@phosphor-icons/react";
import { useAuthStore } from "@/store/auth";
import { useAuth } from "@/hooks/useAuth";
import { LOCATIONS, getLocation, type LocationId } from "@/constants/locations";
import { HOURS, fetchPublicAvailableSlots, fetchAvailableSessions } from "@/lib/firebase/sessions";
import { createReservation } from "@/lib/firebase/reservations";
import { fetchCredits } from "@/lib/firebase/customers";
import { formatTime } from "@/lib/utils";
import type { Session } from "@/types/session";
import type { User } from "firebase/auth";

const DAY_ABBR = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + (x.getDay() === 0 ? -6 : 1 - x.getDay()));
  return x;
}

export function PublicSchedule() {
  const router = useRouter();
  useAuth();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

  const [activeLocation, setActiveLocation] = useState<LocationId>("maracaipe");
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [slotsSet, setSlotsSet] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<{ session: Session; key: string } | null>(null);
  const [loginModal, setLoginModal] = useState<{ date: string; hour: number } | null>(null);

  const todayStr = fmtDate(new Date());

  // Carrega dados: sessões completas se logado, slots públicos se não
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);

    if (user) {
      fetchAvailableSessions()
        .then((s) => { if (!cancelled) setSessions(s); })
        .catch(() => { if (!cancelled) setSessions([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else {
      fetchPublicAvailableSlots(activeLocation)
        .then((s) => { if (!cancelled) setSlotsSet(s); })
        .catch(() => { if (!cancelled) setSlotsSet(new Set()); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [user, authLoading, activeLocation]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart],
  );

  // Mapa sessão por chave (para usuário logado)
  const sessionMap = useMemo(() => {
    const map = new Map<string, Session>();
    sessions.forEach((s) => {
      if (s.location !== activeLocation) return;
      map.set(`${s.date}-${Number(s.startTime.slice(0, 2))}`, s);
    });
    return map;
  }, [sessions, activeLocation]);

  const isOn = (date: Date, h: number) => {
    if (fmtDate(date) < todayStr) return false;
    if (user) return sessionMap.has(`${fmtDate(date)}-${h}`);
    return slotsSet.has(`${fmtDate(date)}-${h}`);
  };

  const activeHours = useMemo(
    () => HOURS.filter((h) => days.some((d) => isOn(d, h))),
    [days, slotsSet, sessionMap, user], // eslint-disable-line react-hooks/exhaustive-deps
  );

  function shiftWeek(delta: number) {
    setWeekStart((w) => { const x = new Date(w); x.setDate(w.getDate() + delta * 7); return x; });
  }
  const atCurrentWeek = fmtDate(weekStart) <= fmtDate(mondayOf(new Date()));

  const weekLabel = `${pad(days[0].getDate())} ${MONTH_ABBR[days[0].getMonth()]} – ${pad(days[6].getDate())} ${MONTH_ABBR[days[6].getMonth()]}`;

  function handleBook(date: Date, h: number) {
    const key = `${fmtDate(date)}-${h}`;
    if (doneKeys.has(key)) return;

    if (!user) {
      setLoginModal({ date: fmtDate(date), hour: h });
      return;
    }

    const s = sessionMap.get(key);
    if (!s) return;
    setPending({ session: s, key });
  }

  function handleConfirmed(key: string, sessionId: string) {
    setDoneKeys((prev) => new Set(prev).add(key));
    setSessions((prev) =>
      prev
        .map((x) => (x.id === sessionId ? { ...x, currentCapacity: x.currentCapacity + 1 } : x))
        .filter((x) => x.id !== sessionId || x.currentCapacity < x.maxCapacity),
    );
    setPending(null);
    router.push("/aluno");
  }

  return (
    <div>
      {/* Local + navegação */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {LOCATIONS.map((loc) => {
            const active = activeLocation === loc.id;
            return (
              <button key={loc.id} onClick={() => setActiveLocation(loc.id)} style={{
                padding: "8px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 700,
                border: "1px solid", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                background: active ? "var(--coral)" : "var(--bg-3)",
                borderColor: active ? "var(--coral)" : "var(--border)",
                color: active ? "#fff" : "var(--text-2)",
              }}>
                {loc.name}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button onClick={() => shiftWeek(-1)} className="ps-nav" disabled={atCurrentWeek} aria-label="Semana anterior"><CaretLeft size={16} /></button>
          <span className="font-display" style={{ fontSize: "0.95rem", color: "var(--text-1)", minWidth: "118px", textAlign: "center" }}>{weekLabel}</span>
          <button onClick={() => shiftWeek(1)} className="ps-nav" aria-label="Próxima semana"><CaretRight size={16} /></button>
        </div>
      </div>

      {/* Grade */}
      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "44px", color: "var(--text-3)" }}>
            <CircleNotch size={22} className="ph-spin" />
          </div>
        ) : activeHours.length === 0 ? (
          <p style={{ padding: "32px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>
            Nenhum horário disponível nesta semana. Use a seta para ver as próximas.
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
                      <div style={{ fontSize: "10px", fontWeight: 700, color: isToday ? "var(--teal-light)" : "var(--text-3)", letterSpacing: "0.05em" }}>{DAY_ABBR[d.getDay()]}</div>
                      <div className="font-display" style={{ fontSize: "1rem", color: isToday ? "var(--teal-light)" : "var(--text-1)", marginTop: "2px" }}>{pad(d.getDate())}</div>
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
                    const key = `${fmtDate(d)}-${h}`;
                    const on = isOn(d, h);
                    const done = doneKeys.has(key);
                    return (
                      <td key={d.toISOString()} style={{ padding: "5px 3px" }}>
                        {done ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "32px", width: "100%", maxWidth: "46px", margin: "0 auto", borderRadius: "8px", background: "rgba(232,97,42,0.18)", border: "1px solid rgba(46,191,181,0.5)", color: "var(--ocean)" }}>
                            <Check size={14} weight="bold" />
                          </div>
                        ) : on ? (
                          <button onClick={() => handleBook(d, h)} className="slot-on"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "32px", width: "100%", maxWidth: "46px", margin: "0 auto" }}>
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

      {/* Modal: não logado */}
      {loginModal && (
        <LoginPromptModal
          date={loginModal.date}
          hour={loginModal.hour}
          onClose={() => setLoginModal(null)}
        />
      )}

      {/* Modal: logado — booking completo */}
      {pending && user && (
        <BookingModal
          session={pending.session}
          user={user}
          onClose={() => setPending(null)}
          onConfirmed={() => handleConfirmed(pending.key, pending.session.id)}
        />
      )}

      <style>{`
        .ps-nav { display: inline-flex; align-items: center; justify-content: center; background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; color: var(--text-2); cursor: pointer; padding: 7px; transition: all 0.14s; }
        .ps-nav:hover:not(:disabled) { color: var(--teal-light); border-color: var(--border-lit); }
        .ps-nav:disabled { opacity: 0.35; cursor: not-allowed; }
        .ph-spin { animation: ph-spin 0.9s linear infinite; }
        @keyframes ph-spin { to { transform: rotate(360deg); } }
        .ps-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(26,61,92,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: ps-fade 0.18s ease both; }
        @keyframes ps-fade { from { opacity: 0; } to { opacity: 1; } }
        .ps-modal { width: 100%; max-width: 380px; animation: ps-pop 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes ps-pop { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

// ─── Modal: usuário não logado ────────────────────────────────────────────
function LoginPromptModal({ date, hour, onClose }: { date: string; hour: number; onClose: () => void }) {
  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const redirect = encodeURIComponent("/aluno/agenda");

  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-modal card" onClick={(e) => e.stopPropagation()} style={{ padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(46,191,181,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCircle size={22} style={{ color: "var(--ocean)" }} />
            </div>
            <h2 className="font-display" style={{ fontSize: "1.3rem", color: "var(--text-1)" }}>Faça login para agendar</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "2px" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: "var(--bg-3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Horário selecionado</p>
          <p style={{ fontSize: "14px", color: "var(--text-1)", fontWeight: 700, textTransform: "capitalize" }}>{dateLabel}</p>
          <p style={{ fontSize: "13px", color: "var(--ocean)", fontWeight: 700, marginTop: "2px" }}>{pad(hour)}:00 – {pad(hour + 1)}:00</p>
        </div>

        <p style={{ fontSize: "13.5px", color: "var(--text-2)", marginBottom: "20px", lineHeight: 1.6 }}>
          Para confirmar sua reserva, entre na sua conta ou crie uma gratuitamente.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link href={`/login?redirect=${redirect}`} className="btn-primary"
            style={{ height: "46px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
            Entrar na conta
          </Link>
          <Link href={`/registro?redirect=${redirect}`}
            style={{ height: "46px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600, color: "var(--text-2)", textDecoration: "none", border: "1px solid var(--border)", borderRadius: "8px", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-lit)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; }}
          >
            Criar conta grátis
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: booking completo (usuário logado) ─────────────────────────────
function BookingModal({ session, user, onClose, onConfirmed }: {
  session: Session; user: User; onClose: () => void; onConfirmed: () => void;
}) {
  const loc = getLocation(session.location);
  const [credits, setCredits] = useState<number | null>(null);
  const [payOnArrival, setPayOnArrival] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCredits(session.businessId, user.uid)
      .then((c) => { if (!cancelled) setCredits(c); })
      .catch(() => { if (!cancelled) setCredits(0); });
    return () => { cancelled = true; };
  }, [session.businessId, user.uid]);

  const dateLabel = new Date(session.date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const intervalo = `${formatTime(session.startTime)}–${formatTime(session.endTime)}`;
  const hasCredits = (credits ?? 0) > 0;
  const canConfirm = credits !== null && (hasCredits || payOnArrival);

  async function confirm() {
    if (!canConfirm || saving) return;
    setSaving(true);
    try {
      await createReservation(session, { id: user.uid, name: user.displayName || user.email || "Aluno" }, { payOnArrival: !hasCredits });
      onConfirmed();
    } catch (e) {
      console.error("[reserve]", e);
      alert("Não foi possível reservar. O horário pode ter lotado.");
      setSaving(false);
    }
  }

  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-modal card" onClick={(e) => e.stopPropagation()} style={{ padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 className="font-display" style={{ fontSize: "1.4rem", color: "var(--text-1)" }}>Confirmar aula</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "2px" }}><X size={20} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--text-1)", fontWeight: 600 }}>
            <MapPin size={14} style={{ color: "var(--ocean)" }} /> {loc.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--text-1)", fontWeight: 600 }}>
            <Clock size={14} style={{ color: "var(--ocean)" }} /> {intervalo}
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--text-2)", textTransform: "capitalize", paddingLeft: "22px" }}>{dateLabel}</p>
        </div>

        <div className="card" style={{ padding: "14px 16px", marginBottom: "16px", background: "var(--bg-3)", display: "flex", alignItems: "center", gap: "12px" }}>
          <Ticket size={20} style={{ color: hasCredits ? "var(--teal-light)" : "var(--text-3)" }} />
          {credits === null ? (
            <CircleNotch size={16} className="ph-spin" style={{ color: "var(--text-3)" }} />
          ) : (
            <div>
              <p style={{ fontSize: "13px", color: "var(--text-1)", fontWeight: 700 }}>
                {credits} {credits === 1 ? "parafina disponível" : "parafinas disponíveis"}
              </p>
              <p style={{ fontSize: "11.5px", color: "var(--text-2)", marginTop: "1px" }}>
                {hasCredits ? "Será usada 1 parafina nesta reserva." : "Você não tem parafinas no momento."}
              </p>
            </div>
          )}
        </div>

        {credits !== null && !hasCredits && (
          <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${payOnArrival ? "var(--border-lit)" : "var(--border)"}`, background: payOnArrival ? "rgba(0,180,200,0.08)" : "transparent", cursor: "pointer", marginBottom: "16px", transition: "all 0.15s" }}>
            <input type="checkbox" checked={payOnArrival} onChange={(e) => setPayOnArrival(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "var(--teal)" }} />
            <Wallet size={16} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: "13px", color: "var(--text-1)", fontWeight: 600 }}>Pagar no momento da aula</span>
          </label>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1, height: "44px", fontSize: "14px" }}>Cancelar</button>
          <button onClick={confirm} disabled={!canConfirm || saving} className="btn-primary"
            style={{ flex: 2, height: "44px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {saving ? <CircleNotch size={16} className="ph-spin" /> : <Check size={16} weight="bold" />}
            {saving ? "Reservando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
