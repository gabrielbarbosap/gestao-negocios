"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CaretLeft, CaretRight, CircleNotch, Check, Waves, X, MapPin, Clock, Wallet, CreditCard } from "@phosphor-icons/react";
import type { User } from "firebase/auth";
import { useStudentAgenda } from "@/hooks/useStudentAgenda";
import { createReservation } from "@/lib/firebase/reservations";
import { fetchCredits } from "@/lib/firebase/customers";
import { LOCATIONS, getLocation, type LocationId } from "@/constants/locations";
import { formatTime } from "@/lib/utils";
import { PIX_AMOUNT_FORMATTED } from "@/constants/payment";
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

export default function StudentAgendaPage() {
 const router = useRouter();
 const pathname = usePathname();
 const { user, sessions, loading, error, setSessions } = useStudentAgenda();

 const [activeLocation, setActiveLocation] = useState<LocationId>("maracaipe");
 const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
 const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());
 const [bookError, setBookError] = useState("");
 const [pending, setPending] = useState<{ session: Session; key: string } | null>(null);

 const todayStr = fmtDate(new Date());

 const days = useMemo(
 () => Array.from({ length: 7 }, (_, i) => {
 const d = new Date(weekStart);
 d.setDate(weekStart.getDate() + i);
 return d;
 }),
 [weekStart],
 );

 // mapa "data-hora" → sessão disponível, do local ativo
 const sessionMap = useMemo(() => {
 const map = new Map<string, Session>();
 sessions.forEach((s) => {
 if (s.location !== activeLocation) return;
 map.set(`${s.date}-${Number(s.startTime.slice(0, 2))}`, s);
 });
 return map;
 }, [sessions, activeLocation]);

 // horas que aparecem em ALGUM dia da semana (no local ativo)
 const HOURS = useMemo(() => Array.from({ length: 13 }, (_, i) => i + 5), []);
 const activeHours = useMemo(
 () => HOURS.filter((h) => days.some((d) => sessionMap.has(`${fmtDate(d)}-${h}`))),
 [HOURS, days, sessionMap],
 );

 const weekLabel = `${pad(days[0].getDate())} ${MONTH_ABBR[days[0].getMonth()]} – ${pad(days[6].getDate())} ${MONTH_ABBR[days[6].getMonth()]}`;
 const atCurrentWeek = fmtDate(weekStart) <= fmtDate(mondayOf(new Date()));

 function shiftWeek(delta: number) {
 setWeekStart((w) => { const x = new Date(w); x.setDate(w.getDate() + delta * 7); return x; });
 }

 function handleBook(date: Date, h: number) {
 const key = `${fmtDate(date)}-${h}`;
 const s = sessionMap.get(key);
 if (!s || doneKeys.has(key)) return;

 if (!user) {
 router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
 return;
 }
 setPending({ session: s, key });
 }

 // chamado pelo modal ao confirmar a reserva
 function handleConfirmed(key: string, sessionId: string) {
 setDoneKeys((prev) => new Set(prev).add(key));
 setSessions((prev) =>
 prev
 .map((x) => (x.id === sessionId ? { ...x, currentCapacity: x.currentCapacity + 1 } : x))
 .filter((x) => x.id === sessionId || x.currentCapacity < x.maxCapacity),
 );
 setPending(null);
 router.push("/aluno");
 }

 return (
 <div style={{ maxWidth: "680px" }}>
 <header style={{ marginBottom: "18px" }}>
 <span className="section-label" style={{ marginBottom: "10px" }}>
 <Waves size={11} /> Agendar aula
 </span>
 <h1 className="font-display" style={{ fontSize: "1.8rem", color: "var(--text-1)", marginTop: "10px" }}>
 Escolha seu horário
 </h1>
 <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-2)" }}>
 Toque num horário disponível para reservar sua aula.
 </p>
 </header>

 {!user && !loading && (
 <div className="card" style={{ padding: "12px 16px", marginBottom: "16px", borderColor: "var(--border-warm)", background: "rgba(232,120,48,0.04)", display: "flex", alignItems: "center", gap: "10px" }}>
 
 <p style={{ fontSize: "13px", color: "var(--text-2)", margin: 0 }}>
 Veja os horários livres. Ao tocar para reservar, você entra na sua conta.
 </p>
 </div>
 )}

 {/* local + navegação de semana */}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
 <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
 {LOCATIONS.map((loc) => {
 const active = activeLocation === loc.id;
 return (
 <button key={loc.id} onClick={() => setActiveLocation(loc.id)}
 style={{
 display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "9px",
 fontSize: "13px", fontWeight: 700, border: "1px solid", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
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
 <button onClick={() => shiftWeek(-1)} className="ag-nav" disabled={atCurrentWeek} aria-label="Semana anterior"><CaretLeft size={16} /></button>
 <span className="font-display" style={{ fontSize: "0.95rem", color: "var(--text-1)", minWidth: "118px", textAlign: "center" }}>{weekLabel}</span>
 <button onClick={() => shiftWeek(1)} className="ag-nav" aria-label="Próxima semana"><CaretRight size={16} /></button>
 </div>
 </div>

 {error && (
 <div className="card" style={{ padding: "16px", marginBottom: "16px", borderColor: "var(--border-warm)", color: "var(--sunset-2)", fontSize: "13.5px" }}>
 {error}
 </div>
 )}

 {/* grade da semana */}
 <div className="card" style={{ overflowX: "auto" }}>
 {loading ? (
 <div style={{ display: "flex", justifyContent: "center", padding: "48px", color: "var(--text-3)" }}>
 <CircleNotch size={24} className="ph-spin" />
 </div>
 ) : activeHours.length === 0 ? (
 <p style={{ padding: "32px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>
 Nenhum horário disponível nesta semana. Use a seta → para ver as próximas.
 </p>
 ) : (
 <table style={{ width: "100%", minWidth: "460px", fontSize: "13px" }}>
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
 const s = sessionMap.get(key);
 const done = doneKeys.has(key);
 return (
 <td key={d.toISOString()} style={{ padding: "5px 3px" }}>
 {done ? (
 <div title="Reservado" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "34px", width: "100%", maxWidth: "46px", margin: "0 auto", borderRadius: "8px", background: "rgba(232,97,42,0.18)", border: "1px solid rgba(46,191,181,0.5)", color: "var(--ocean)" }}>
 <Check size={15} strokeWidth={3} />
 </div>
 ) : s ? (
 <button
 onClick={() => handleBook(d, h)}
 className="slot-on"
 title={`Reservar ${d.toLocaleDateString("pt-BR")} ${pad(h)}–${pad(h + 1)}h`}
 style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "34px", width: "100%", maxWidth: "46px", margin: "0 auto" }}
 >
 ●
 </button>
 ) : (
 <div className="slot-off" style={{ height: "34px", width: "100%", maxWidth: "46px", margin: "0 auto" }} />
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
 <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Disponível — toque para reservar</span>
 </div>
 </div>

 {bookError && (
       <div style={{ margin: "12px 0", padding: "12px 16px", borderRadius: "10px", background: "var(--red-dim)", border: "1px solid var(--red)", fontSize: "13px", color: "var(--red)" }}>
         {bookError}
       </div>
     )}

     {pending && user && (
 <BookingModal
 session={pending.session}
 user={user}
 onClose={() => setPending(null)}
 onConfirmed={() => handleConfirmed(pending.key, pending.session.id)}
 />
 )}

 <style>{`
 .ag-nav { display: inline-flex; align-items: center; justify-content: center; background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; color: var(--text-2); cursor: pointer; padding: 7px; transition: all 0.14s; }
 .ag-nav:hover:not(:disabled) { color: var(--teal-light); border-color: var(--border-lit); }
 .ag-nav:disabled { opacity: 0.35; cursor: not-allowed; }
 .ph-spin { animation: ph-spin 0.9s linear infinite; }
 @keyframes ph-spin { to { transform: rotate(360deg); } }
 .ag-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(26,61,92,0.5); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: ag-fade 0.18s ease both; }
 @keyframes ag-fade { from { opacity: 0; } to { opacity: 1; } }
 .ag-modal { width: 100%; max-width: 380px; animation: ag-pop 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
 @keyframes ag-pop { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
 `}</style>
 </div>
 );
}

// ─── Modal de confirmação de agendamento ──────────────────────────────────
function BookingModal({ session, user, onClose, onConfirmed, onError }: {
 session: Session; user: User; onClose: () => void; onConfirmed: () => void; onError?: (msg: string) => void;
}) {
 const loc = getLocation(session.location);
 const [credits, setCredits] = useState<number | null>(null);
 const [saving, setSaving] = useState(false);
 const savingRef = useRef(false); // trava síncrona contra clique duplo

 useEffect(() => {
 let cancelled = false;
 fetchCredits(session.businessId, user.uid)
 .then((c) => { if (!cancelled) setCredits(c); })
 .catch(() => { if (!cancelled) setCredits(0); });
 return () => { cancelled = true; };
 }, [session.businessId, user.uid]);

 const dateLabel = new Date(session.date + "T00:00:00").toLocaleDateString("pt-BR", {
 weekday: "long", day: "2-digit", month: "long",
 });
 const intervalo = `${formatTime(session.startTime)}–${formatTime(session.endTime)}`;

 const hasCredits = (credits ?? 0) > 0;
 const canConfirm = credits !== null;

 async function confirm() {
 if (!canConfirm || savingRef.current) return;
 savingRef.current = true;
 setSaving(true);
 try {
 await createReservation(
 session,
 { id: user.uid, name: user.displayName || user.email || "Aluno", email: user.email || "" },
 { payWithPix: !hasCredits },
 );
 onConfirmed();
 } catch (e) {
 console.error("[reserve]", e);
 onError?.("Não foi possível reservar. O horário pode ter lotado.");
 savingRef.current = false;
 setSaving(false);
 }
 }

 return (
 <div className="ag-overlay" onClick={onClose}>
 <div className="ag-modal card" onClick={(e) => e.stopPropagation()} style={{ padding: "22px" }}>
 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
 <h2 className="font-display" style={{ fontSize: "1.4rem", color: "var(--text-1)" }}>Confirmar aula</h2>
 <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "2px" }} aria-label="Fechar">
 <X size={20} />
 </button>
 </div>

 {/* detalhes da aula */}
 <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginBottom: "18px" }}>
 <Detail icon={<MapPin size={14} />} text={`$${loc.name}`} />
 <Detail icon={<Clock size={14} />} text={`${intervalo}`} />
 <p style={{ fontSize: "12.5px", color: "var(--text-2)", textTransform: "capitalize", paddingLeft: "22px" }}>{dateLabel}</p>
 </div>

 {/* parafinas */}
 <div className="card" style={{ padding: "14px 16px", marginBottom: "16px", background: "var(--bg-3)", display: "flex", alignItems: "center", gap: "12px" }}>
 <Image src="/parafina.png" alt="parafina" width={28} height={28} style={{ objectFit: "contain", opacity: hasCredits ? 1 : 0.35, flexShrink: 0 }} />
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

 {/* sem parafinas: pagar com cartão (comprar pacote) ou via pix */}
 {credits !== null && !hasCredits && (
 <div style={{ marginBottom: "16px" }}>
 <p style={{ fontSize: "12.5px", color: "var(--text-2)", marginBottom: "10px" }}>
 Você não tem parafinas. Pague com cartão comprando um pacote, ou reserve agora e pague esta aula via PIX.
 </p>
 <Link href="/aluno/pacotes" onClick={onClose} className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "10px" }}>
 <CreditCard size={16} style={{ color: "var(--ocean)", flexShrink: 0 }} />
 <div>
 <p style={{ fontSize: "13px", color: "var(--text-1)", fontWeight: 700 }}>Cartão de crédito</p>
 <p style={{ fontSize: "11.5px", color: "var(--text-2)", marginTop: "1px" }}>Comprar parafinas via Stripe</p>
 </div>
 </Link>
 <div style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border-lit)", background: "rgba(0,180,200,0.06)" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
 <Wallet size={16} style={{ color: "var(--gold)" }} />
 <span style={{ fontSize: "13px", color: "var(--text-1)", fontWeight: 700 }}>Pagar via PIX</span>
 </div>
 <p style={{ fontSize: "11.5px", color: "var(--text-2)", lineHeight: 1.6 }}>
 Valor: <strong style={{ color: "var(--text-1)" }}>{PIX_AMOUNT_FORMATTED}</strong> por aula.<br />
 Reserve agora e finalize o pagamento via PIX na aba <strong style={{ color: "var(--text-1)" }}>Minhas aulas</strong> — a confirmação é automática, sem precisar enviar comprovante.
 </p>
 </div>
 </div>
 )}

 {/* ações */}
 <div style={{ display: "flex", gap: "10px" }}>
 <button onClick={onClose} className="btn-outline" style={{ flex: 1, height: "44px", fontSize: "14px" }}>Cancelar</button>
 <button onClick={confirm} disabled={!canConfirm || saving} className="btn-primary" style={{ flex: 2, height: "44px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
 {saving ? <CircleNotch size={16} className="ph-spin" /> : <Check size={16} />}
 {saving ? "Reservando..." : "Confirmar agendamento"}
 </button>
 </div>
 </div>
 </div>
 );
}

function Detail({ icon, text }: { icon: React.ReactNode; text: string }) {
 return (
 <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--text-1)", fontWeight: 600 }}>
 <span style={{ color: "var(--ocean)", display: "flex" }}>{icon}</span>
 {text}
 </div>
 );
}
