"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDots, Clock, MapPin, CircleNotch, CalendarPlus, Check, X, Camera, ArrowUpRight, Drop } from "@phosphor-icons/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useStudentReservations } from "@/hooks/useStudentReservations";
import { cancelReservation } from "@/lib/firebase/reservations";
import { getLocation } from "@/constants/locations";
import { formatTime } from "@/lib/utils";
import type { Reservation } from "@/types/reservation";

function canCancel(r: Reservation): boolean {
  if (r.status === "completed" || r.status === "cancelled") return false;
  const now = new Date();
  // Usa horário local (Brasil) para comparar
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (r.date > todayLocal) return true;
  if (r.date === todayLocal) return r.startTime > nowTime;
  return false;
}

export default function StudentHomePage() {
  const { user, reservations, loading, refresh } = useStudentReservations();
  const todayStr = new Date().toISOString().slice(0, 10);
  const businessId = process.env.NEXT_PUBLIC_BUSINESS_ID!;
  const [profileComplete, setProfileComplete] = useState(true);
  const [parafinas, setParafinas] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "businesses", businessId, "customers", user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setProfileComplete(!!d.phone && !!d.birthDate);
          setParafinas(d.creditBalance ?? 0);
        } else {
          setProfileComplete(false);
          setParafinas(0);
        }
      })
      .catch(() => {});
  }, [user, businessId]);

  const { proximas, passadas } = useMemo(() => {
    const ativos = reservations.filter((r) => r.status !== "cancelled");
    return {
      proximas: ativos.filter((r) => r.date >= todayStr),
      passadas: ativos.filter((r) => r.date < todayStr).reverse(),
    };
  }, [reservations, todayStr]);

  async function handleCancel(r: Reservation) {
    if (!user) return;
    await cancelReservation(r, user.uid);
    refresh();
  }

  return (
    <div className="rise" style={{ maxWidth: "560px" }}>
      <header style={{ marginBottom: "22px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: "1.9rem", color: "var(--text-1)" }}>Olá, Surfista!</h1>
          <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-2)" }}>Suas aulas agendadas</p>
        </div>
        <Link href="/aluno/agenda" className="btn-primary" style={{ height: "42px", padding: "0 18px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", textDecoration: "none" }}>
          <CalendarPlus size={16} /> Agendar aula
        </Link>
      </header>

      {/* ── Saldo de parafinas ────────────────────────────────────────── */}
      {parafinas !== null && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "12px", padding: "16px 20px", borderRadius: "14px", marginBottom: "16px",
          background: parafinas > 0 ? "rgba(232,97,42,0.06)" : "rgba(26,61,92,0.04)",
          border: `1px solid ${parafinas > 0 ? "rgba(232,97,42,0.2)" : "var(--border)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: parafinas > 0 ? "var(--coral)" : "var(--bg-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Drop size={20} weight="fill" style={{ color: parafinas > 0 ? "#fff" : "var(--text-3)" }} />
            </div>
            <div>
              <p className="font-display" style={{ fontSize: "1.6rem", color: parafinas > 0 ? "var(--coral)" : "var(--text-3)", lineHeight: 1 }}>
                {parafinas} {parafinas === 1 ? "parafina" : "parafinas"}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "3px" }}>
                {parafinas > 0
                  ? `Você tem ${parafinas} aula${parafinas !== 1 ? "s" : ""} disponível${parafinas !== 1 ? "is" : ""}`
                  : "Cada parafina vale 1 aula"}
              </p>
            </div>
          </div>
          {parafinas === 0 && (
            <Link href="/aluno/pacotes" className="btn-primary" style={{ fontSize: "12px", padding: "8px 14px", textDecoration: "none", whiteSpace: "nowrap" }}>
              Comprar
            </Link>
          )}
        </div>
      )}

      {!profileComplete && !loading && (
        <Link href="/aluno/perfil" style={{ textDecoration: "none" }}>
          <div style={{
            background: "rgba(245,192,48,0.08)",
            border: "1px solid rgba(245,192,48,0.28)",
            borderRadius: "12px",
            padding: "13px 16px",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            cursor: "pointer",
          }}>
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--gold)" }}>Complete seu perfil</p>
              <p style={{ fontSize: "12px", color: "var(--text-2)", marginTop: "2px" }}>Adicione telefone e data de nascimento</p>
            </div>
            <span style={{ fontSize: "12px", color: "var(--gold)", fontWeight: 700, whiteSpace: "nowrap" }}>Completar →</span>
          </div>
        </Link>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px", color: "var(--text-3)" }}>
          <CircleNotch size={24} className="ph-spin" />
        </div>
      ) : (
        <>
          <h2 className="font-display" style={{ fontSize: "1.15rem", color: "var(--text-1)", marginBottom: "12px" }}>Próximas aulas</h2>
          {proximas.length === 0 ? (
            <div className="card" style={{ padding: "32px 22px", textAlign: "center", marginBottom: "26px" }}>
              <CalendarDots size={28} style={{ color: "var(--text-3)", margin: "0 auto 10px" }} />
              <p style={{ fontSize: "13.5px", color: "var(--text-2)" }}>Você ainda não tem aulas agendadas.</p>
              <Link href="/aluno/agenda" className="btn-outline" style={{ display: "inline-block", marginTop: "14px", padding: "9px 18px", fontSize: "13px" }}>Ver horários disponíveis</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
              {proximas.map((r) => <ReservationCard key={r.id} r={r} onCancel={handleCancel} />)}
            </div>
          )}

          {passadas.length > 0 && (
            <>
              <h2 className="font-display" style={{ fontSize: "1.15rem", color: "var(--text-1)", marginBottom: "12px" }}>Histórico</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {passadas.map((r) => <ReservationCard key={r.id} r={r} past />)}
              </div>
            </>
          )}
        </>
      )}

      {/* Card guardei.art */}
      <a
        href="https://guardei.art"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", display: "block", marginTop: "28px" }}
      >
        <div className="card" style={{
          padding: "16px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px",
          transition: "border-color 0.15s, background 0.15s",
          cursor: "pointer",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-lit)"; (e.currentTarget as HTMLElement).style.background = "var(--card-hover)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = ""; (e.currentTarget as HTMLElement).style.background = ""; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(46,191,181,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Camera size={18} style={{ color: "var(--ocean)" }} />
            </div>
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-1)" }}>Guarde suas fotos</p>
              <p style={{ fontSize: "12px", color: "var(--text-2)", marginTop: "2px" }}>Registre as memórias das suas aulas em guardei.art</p>
            </div>
          </div>
          <ArrowUpRight size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
        </div>
      </a>

      <style>{`
        .ph-spin { animation: ph-spin 0.9s linear infinite; }
        @keyframes ph-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ReservationCard({ r, past, onCancel }: { r: Reservation; past?: boolean; onCancel?: (r: Reservation) => Promise<void> }) {
  const loc = getLocation(r.location);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const dateLabel = new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "short", day: "2-digit", month: "short",
  });

  async function handleConfirmCancel() {
    if (!onCancel) return;
    setCancelling(true);
    try {
      await onCancel(r);
    } finally {
      setCancelling(false);
      setConfirming(false);
    }
  }

  return (
    <div className="card" style={{ padding: "14px 16px", opacity: past ? 0.6 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ textAlign: "center", minWidth: "84px" }}>
          <Clock size={13} style={{ color: "var(--text-2)" }} />
          <p className="font-display" style={{ fontSize: "0.95rem", color: "var(--text-1)", lineHeight: 1.15, marginTop: "2px", whiteSpace: "nowrap" }}>
            {formatTime(r.startTime)}–{formatTime(r.endTime)}
          </p>
        </div>
        <div style={{ width: "1px", alignSelf: "stretch", background: "var(--border)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "13.5px", color: "var(--text-1)", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
            <MapPin size={12} style={{ color: "var(--ocean)", flexShrink: 0 }} /> {loc.name}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-2)", marginTop: "3px", textTransform: "capitalize" }}>{dateLabel}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "var(--ocean)" }}>
            <Check size={12} /> {r.status === "completed" ? "Concluída" : r.status === "confirmed" ? "Confirmada" : "Reservada"}
          </span>
          {r.payment === "on_arrival" && (
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--gold)", background: "rgba(245,192,48,0.1)", padding: "2px 7px", borderRadius: "99px" }}>
              Pagar na aula
            </span>
          )}
          {!past && canCancel(r) && onCancel && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--text-3)", padding: "2px 0", display: "flex", alignItems: "center", gap: "3px" }}
            >
              <X size={11} /> Cancelar
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <p style={{ fontSize: "12.5px", color: "var(--text-2)" }}>
            Cancelar esta aula?{r.creditsUsed > 0 ? " Sua parafina será devolvida." : ""}
          </p>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button onClick={() => setConfirming(false)} disabled={cancelling} className="btn-outline" style={{ fontSize: "12px", padding: "5px 12px", height: "auto" }}>
              Não
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={cancelling}
              style={{ fontSize: "12px", padding: "5px 12px", height: "auto", background: "var(--red, #e53e3e)", color: "#fff", border: "none", borderRadius: "8px", cursor: cancelling ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px" }}
            >
              {cancelling ? <CircleNotch size={12} className="ph-spin" /> : null}
              Sim, cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
