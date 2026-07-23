"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarDots, Clock, MapPin, CircleNotch, CalendarPlus, Check, X, Camera, ArrowUpRight, WhatsappLogo, Trophy, CaretRight, WarningCircle } from "@phosphor-icons/react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { logout } from "@/lib/firebase/auth";
import { useStudentReservations } from "@/hooks/useStudentReservations";
import { cancelReservation } from "@/lib/firebase/reservations";
import { getLocation } from "@/constants/locations";
import { formatTime } from "@/lib/utils";
import { PIX_AMOUNT, PIX_AMOUNT_FORMATTED, PIX_REFUND_WHATSAPP_LINK, WHATSAPP_PHONE_FORMATTED } from "@/constants/payment";
import { InfinitePayPixButton } from "@/components/infinitepay-pix-button";
import type { Reservation } from "@/types/reservation";

// Cancelamento só é permitido até 24h antes do início da aula.
function canCancel(r: Reservation): boolean {
  if (r.status === "completed" || r.status === "cancelled") return false;
  const classStart = new Date(`${r.date}T${r.startTime}:00`);
  const hoursUntilClass = (classStart.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntilClass >= 24;
}

export default function StudentHomePage() {
  const router = useRouter();
  const { user, reservations, loading, refresh } = useStudentReservations();
  const _now = new Date();
  const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;
  const businessId = process.env.NEXT_PUBLIC_BUSINESS_ID!;
  const [profileComplete, setProfileComplete] = useState(true);
  const [parafinas, setParafinas] = useState<number | null>(null);
  const [creditBanner, setCreditBanner] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [duplicateAccount, setDuplicateAccount] = useState(false);
  const [missingPhone, setMissingPhone] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "businesses", businessId, "customers", user.uid))
      .then(async (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setProfileComplete(!!d.phone && !!d.birthDate);
          setParafinas(d.creditBalance ?? 0);
          setShowOnboarding(!d.hasSeenOnboarding);
          // Alerta de telefone só para quem já passou pelo onboarding (evita
          // dois modais ao mesmo tempo em contas novas).
          setMissingPhone(!!d.hasSeenOnboarding && !d.phone);
          return;
        }

        setProfileComplete(false);
        setParafinas(0);

        // Sem cadastro pra esse uid — pode ser um login com outro método
        // (ex: Google) pro mesmo e-mail de uma conta já existente. Como
        // permitimos e-mails duplicados no Firebase (pra não perder senha
        // ao mesclar contas), checamos se já existe histórico com esse
        // e-mail em outro uid antes de deixar o aluno seguir numa conta vazia.
        if (!user.email) return;
        try {
          const res = await fetch("/api/auth/check-duplicate-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, uid: user.uid }),
          });
          const { duplicate } = await res.json();
          if (duplicate) setDuplicateAccount(true);
        } catch (e) {
          console.error("[check-duplicate-account]", e);
        }
      })
      .catch(() => {});
  }, [user, businessId]);

  async function handleSwitchAccount() {
    await logout();
    router.push("/login");
  }

  async function handleCloseOnboarding() {
    setShowOnboarding(false);
    if (!user) return;
    try {
      await updateDoc(doc(db, "businesses", businessId, "customers", user.uid), {
        hasSeenOnboarding: true,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[onboarding]", e);
    }
  }

  const { proximas, passadas } = useMemo(() => {
    const ativos = reservations.filter((r) => r.status !== "cancelled");
    return {
      proximas: ativos.filter((r) => r.date >= todayStr),
      passadas: ativos.filter((r) => r.date < todayStr).reverse(),
    };
  }, [reservations, todayStr]);

  async function handleCancel(r: Reservation) {
    if (!user) return;
    const { refundsCredit, needsManualRefund } = await cancelReservation(r, user.uid);
    refresh();
    if (refundsCredit) {
      setCreditBanner(true);
      setTimeout(() => setCreditBanner(false), 6000);
    } else if (needsManualRefund) {
      setRefundModalOpen(true);
    }
  }


  return (
    <div className="rise" style={{ maxWidth: "560px" }}>
      {creditBanner && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
          borderRadius: "12px", marginBottom: "16px",
          background: "rgba(56,193,114,0.12)", border: "1px solid rgba(56,193,114,0.3)",
        }}>
          <Image src="/parafina.png" alt="parafina" width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
          <p style={{ fontSize: "13px", color: "#1a7a4a", fontWeight: 700, flex: 1 }}>
            Aula cancelada — sua parafina foi devolvida!
          </p>
          <button
            onClick={() => setCreditBanner(false)}
            aria-label="Fechar"
            style={{ background: "none", border: "none", color: "#1a7a4a", cursor: "pointer", padding: "2px", flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {refundModalOpen && <RefundModal onClose={() => setRefundModalOpen(false)} />}
      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
      {duplicateAccount && <DuplicateAccountModal onSwitchAccount={handleSwitchAccount} />}
      {missingPhone && !showOnboarding && !duplicateAccount && (
        <PhoneAlertModal onClose={() => setMissingPhone(false)} />
      )}

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
            <div style={{ width: "42px", height: "42px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/parafina.png" alt="parafina" width={42} height={42} style={{ objectFit: "contain", opacity: parafinas > 0 ? 1 : 0.35 }} />
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
            <Link href="/aluno/pacotes" className="btn-primary" style={{ fontSize: "12px", padding: "14px", textDecoration: "none", whiteSpace: "nowrap" }}>
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
      {/* <a
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
      </a> */}

      <style>{`
        .ph-spin { animation: ph-spin 0.9s linear infinite; }
        @keyframes ph-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ReservationCard({ r, past, onCancel }: {
  r: Reservation; past?: boolean; onCancel?: (r: Reservation) => Promise<void>;
}) {
  const loc = getLocation(r.location);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const pixPending = r.payment === "pix" && r.status === "reserved";
  // Trava síncrona contra clique/toque duplo — o estado do React só reflete
  // no próximo render, então um segundo clique bem rápido pode passar pelo
  // "disabled" antes dele atualizar. O ref bloqueia na hora, sem esperar.
  const cancellingRef = useRef(false);

  const dateLabel = new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "short", day: "2-digit", month: "short",
  });

  async function handleConfirmCancel() {
    if (!onCancel || cancellingRef.current) return;
    cancellingRef.current = true;
    setCancelling(true);
    setCancelError("");
    try {
      await onCancel(r);
      setConfirming(false);
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : "Não foi possível cancelar.");
    } finally {
      cancellingRef.current = false;
      setCancelling(false);
    }
  }


  return (
    <div className="card" style={{ padding: "14px 16px", opacity: past ? 0.6 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ textAlign: "center", minWidth: "84px", display: 'contents' }}>
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
          {pixPending && (
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--gold)", background: "rgba(245,192,48,0.1)", padding: "2px 7px", borderRadius: "99px" }}>
              Aguardando pagamento PIX
            </span>
          )}
          {!past && canCancel(r) && onCancel && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              style={{ background: "rgba(229,62,62,0.08)", border: "1px solid rgba(229,62,62,0.25)", borderRadius: "6px", cursor: "pointer", fontSize: "11.5px", color: "#c53030", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px", fontFamily: "inherit", fontWeight: 600 }}
            >
              <X size={11} /> Cancelar aula
            </button>
          )}
        </div>
      </div>

      {pixPending && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: "11.5px", color: "var(--text-2)", lineHeight: 1.6, marginBottom: "10px" }}>
            Pague <strong style={{ color: "var(--text-1)" }}>{PIX_AMOUNT_FORMATTED}</strong> via PIX pra
            confirmar sua aula. O pagamento é confirmado na hora — sem precisar enviar comprovante.
          </p>
          <InfinitePayPixButton
            reservation={r}
            amountInReais={PIX_AMOUNT}
            label={`Pagar ${PIX_AMOUNT_FORMATTED} via PIX`}
            style={{ fontSize: "12.5px", padding: "0 14px", height: "36px" }}
          />
        </div>
      )}

      {!past && !canCancel(r) && r.status !== "completed" && r.status !== "cancelled" && (
        <p style={{ marginTop: "10px", fontSize: "11px", color: "var(--text-3)" }}>
          Cancelamento indisponível (menos de 24h para a aula).
        </p>
      )}

      {confirming && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <p style={{ fontSize: "12.5px", color: "var(--text-2)" }}>
              Cancelar esta aula?
              {r.creditsUsed > 0 && " Sua parafina será devolvida."}
              {r.payment === "pix" && r.status === "confirmed" && " O reembolso do PIX é combinado direto com o Ivan pelo WhatsApp."}
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
          {cancelError && (
            <p style={{ marginTop: "8px", fontSize: "11.5px", color: "#c53030" }}>{cancelError}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal: alerta de telefone não cadastrado ────────────────────────────
// Aparece pra alunos antigos (cadastrados antes do telefone virar obrigatório).
// É dispensável — não trava o app, só orienta a cadastrar o contato.
function PhoneAlertModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 60, background: "rgba(26,61,92,0.5)",
        backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: "380px", padding: "22px" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 className="font-display" style={{ fontSize: "1.3rem", color: "var(--text-1)", display: "flex", alignItems: "center", gap: "8px" }}>
            <WarningCircle size={22} style={{ color: "var(--gold)" }} weight="fill" /> Cadastre seu contato
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "2px" }} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.6, marginBottom: "18px" }}>
          Você ainda não tem um <strong style={{ color: "var(--text-1)" }}>número de contato (celular/WhatsApp)</strong> cadastrado.
          Ele é importante para o Ivan falar com você sobre suas aulas. Cadastre agora — leva 1 minuto.
        </p>

        <Link
          href="/aluno/perfil"
          onClick={onClose}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "44px", fontSize: "14px", textDecoration: "none" }}
        >
          Cadastrar meu telefone
        </Link>
      </div>
    </div>
  );
}

// ─── Modal: aula paga via PIX cancelada — reembolso combinado com o Ivan ──
function RefundModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 60, background: "rgba(26,61,92,0.5)",
        backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: "380px", padding: "22px" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 className="font-display" style={{ fontSize: "1.3rem", color: "var(--text-1)" }}>Solicite seu reembolso</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "2px" }} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.6, marginBottom: "18px" }}>
          Sua aula foi cancelada. Como o pagamento foi feito via PIX (não com parafina), não geramos crédito automático —
          fale com o Ivan pelo WhatsApp <strong style={{ color: "var(--text-1)" }}>{WHATSAPP_PHONE_FORMATTED}</strong> pra combinar a devolução do valor pago.
        </p>

        <a
          href={PIX_REFUND_WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "44px", borderRadius: "8px", background: "#25D366", color: "#fff", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}
        >
          <WhatsappLogo size={17} weight="fill" /> Falar com o Ivan no WhatsApp
        </a>
      </div>
    </div>
  );
}

// ─── Modal: onboarding do aluno (primeiro acesso) ─────────────────────────
const ONBOARDING_STEPS = [
  {
    icon: <Image src="/parafina.png" alt="parafina" width={44} height={44} style={{ objectFit: "contain" }} />,
    title: "Cada parafina é 1 aula",
    body: "Parafina é o nosso nome pra crédito de aula: 1 parafina = 1 crédito = 1 aula de surf. Você compra parafinas com cartão de crédito na aba Pacotes, ou reserva um horário na hora e paga só aquela aula via PIX.",
  },
  {
    icon: <Trophy size={40} weight="fill" style={{ color: "var(--gold)" }} />,
    title: "Acompanhe sua evolução",
    body: "Na aba Conquistas você acompanha seu XP, seu nível (Iniciante, Intermediário, Avançado) e as conquistas que já desbloqueou — um jeito de ver sua evolução no surf ao longo do tempo.",
  },
];

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 60, background: "rgba(26,61,92,0.5)",
        backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: "380px", padding: "24px", textAlign: "center" }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-6px" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "2px" }} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>{current.icon}</div>

        <h2 className="font-display" style={{ fontSize: "1.3rem", color: "var(--text-1)", marginBottom: "10px" }}>
          {current.title}
        </h2>
        <p style={{ fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.6, marginBottom: "20px" }}>
          {current.body}
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "18px" }}>
          {ONBOARDING_STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: i === step ? "var(--coral)" : "var(--border)",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
          className="btn-primary"
          style={{ width: "100%", height: "44px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          {isLast ? "Entendi!" : "Próximo"}
          {!isLast && <CaretRight size={15} />}
        </button>
      </div>
    </div>
  );
}

// ─── Modal: detectou outra conta com o mesmo e-mail ───────────────────────
// Acontece quando o aluno entra com um método diferente (ex: Google) do
// que usou da primeira vez — cada método vira uma conta separada, então
// essa aqui está vazia. Não deixa fechar clicando fora: precisa trocar
// de conta pra não achar que perdeu o histórico.
function DuplicateAccountModal({ onSwitchAccount }: { onSwitchAccount: () => Promise<void> }) {
  const [switching, setSwitching] = useState(false);

  async function handleClick() {
    setSwitching(true);
    await onSwitchAccount();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70, background: "rgba(26,61,92,0.6)",
      backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
          <WarningCircle size={40} weight="fill" style={{ color: "var(--gold)" }} />
        </div>

        <h2 className="font-display" style={{ fontSize: "1.3rem", color: "var(--text-1)", marginBottom: "10px" }}>
          Essa não é sua conta de sempre
        </h2>
        <p style={{ fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.6, marginBottom: "20px" }}>
          Você já tem um cadastro com esse e-mail feito de outra forma (e-mail e senha, ou Google) —
          essa conta que você acabou de entrar está vazia. Pra ver suas parafinas, aulas e histórico,
          saia e entre novamente usando o mesmo método que usou da primeira vez.
        </p>

        <button
          onClick={handleClick}
          disabled={switching}
          className="btn-primary"
          style={{ width: "100%", height: "44px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {switching ? <CircleNotch size={16} className="ph-spin" /> : null}
          {switching ? "Saindo..." : "Sair e entrar com a conta certa"}
        </button>
      </div>
    </div>
  );
}
