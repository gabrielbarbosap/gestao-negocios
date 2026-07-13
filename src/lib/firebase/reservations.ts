// ════════════════════════════════════════════════════════════════════════
//  RESERVATIONS — horários reservados por aluno
//  Coleção: businesses/{businessId}/reservations/{reservationId}
//  Liga um aluno a uma sessão. Data/hora/local são desnormalizados da
//  sessão para consultas fáceis (reservas do dia / do aluno).
// ════════════════════════════════════════════════════════════════════════
import {
  collection, collectionGroup, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp, increment, updateDoc,
} from "firebase/firestore";
import { db } from "./config";
import { queryDocuments } from "./firestore";
import type { Session } from "@/types/session";
import type { Reservation } from "@/types/reservation";

function reservationsPath(businessId: string) {
  return `businesses/${businessId}/reservations`;
}

// ─── Admin: todas as reservas do negócio ──────────────────────────────────
export async function listReservations(businessId: string): Promise<Reservation[]> {
  return queryDocuments<Reservation>(reservationsPath(businessId));
}

// ─── Aluno: minhas reservas (todas as localidades) ────────────────────────
// collection group filtrando pelo próprio customerId (sem precisar do businessId).
export async function fetchMyReservations(customerId: string): Promise<Reservation[]> {
  const q = query(collectionGroup(db, "reservations"), where("customerId", "==", customerId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Reservation)
    .sort((a, b) =>
      a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date));
}

// ─── Aluno: cria uma reserva ──────────────────────────────────────────────
// Num único batch: cria a reserva, ocupa a vaga na sessão e, se pagar com
// crédito, desconta 1 do saldo do aluno. `payWithPix` reserva o horário sem
// crédito; o aluno paga por fora (chave PIX) e reporta o pagamento depois
// (ver `confirmPixPayment`) — só então a aula fica "confirmed".
export async function createReservation(
  session: Session,
  customer: { id: string; name: string; email: string },
  opts: { payWithPix: boolean },
): Promise<void> {
  const base = `businesses/${session.businessId}`;
  const batch = writeBatch(db);

  const ref = doc(collection(db, `${base}/reservations`));
  batch.set(ref, {
    businessId: session.businessId,
    sessionId: session.id,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    location: session.location,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    status: opts.payWithPix ? "reserved" : "confirmed",
    payment: opts.payWithPix ? "pix" : "credit",
    creditsUsed: opts.payWithPix ? 0 : 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, `${base}/sessions`, session.id), {
    currentCapacity: increment(1), updatedAt: serverTimestamp(),
  });

  if (!opts.payWithPix) {
    batch.update(doc(db, `${base}/customers`, customer.id), {
      creditBalance: increment(-1), updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();

  await notifyEmail({
    type: "reservation",
    toEmail: customer.email,
    toName: customer.name,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    location: session.location,
    payment: opts.payWithPix ? "pix" : "credit",
  });

  // Pix ainda não foi pago — só notifica o admin (Telegram) quando o aluno
  // confirmar (ver `confirmPixPayment`). Crédito já é pagamento efetivado.
  if (!opts.payWithPix) {
    await notifyAdminTelegram({
      customerName: customer.name,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      payment: "credit",
    });
  }
}

// ─── Aluno: reporta que já pagou o PIX da reserva ─────────────────────────
// Só o próprio aluno reporta; vale apenas para reservas em pix ainda não
// confirmadas. A partir daqui a aula aparece como "confirmed" e o admin é
// notificado (antes disso ele não sabe da reserva).
export async function confirmPixPayment(reservation: Reservation): Promise<void> {
  if (reservation.payment !== "pix" || reservation.status !== "reserved") return;
  await updateDoc(doc(db, `businesses/${reservation.businessId}/reservations`, reservation.id), {
    status: "confirmed",
    updatedAt: serverTimestamp(),
  });

  await notifyAdminTelegram({
    customerName: reservation.customerName,
    date: reservation.date,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    location: reservation.location,
    payment: "pix",
  });

  if (reservation.customerEmail) {
    await notifyEmail({
      type: "reservation",
      toEmail: reservation.customerEmail,
      toName: reservation.customerName,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      location: reservation.location,
      payment: "pix",
      pixConfirmed: true,
    });
  }
}

// ─── Notifica o admin (Telegram) sobre uma reserva paga/confirmada ────────
async function notifyAdminTelegram(payload: {
  customerName: string; date: string; startTime: string; endTime: string;
  location: string; payment: "credit" | "pix";
}): Promise<void> {
  try {
    await fetch("/api/notify/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("[notify/reservation]", e);
  }
}

// ─── Notifica o aluno por e-mail (Resend) sobre a própria reserva ─────────
async function notifyEmail(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("[email]", e);
  }
}

export interface CancelReservationResult {
  refundsCredit: boolean;    // devolveu 1 parafina (só quando pago com crédito)
  needsManualRefund: boolean; // pago via pix e já confirmado — reembolso combinado com o Ivan
}

// ─── Aluno: cancela a própria reserva ────────────────────────────────────
// Só é permitido até 24h antes do início da aula. Num único batch: marca a
// reserva como cancelada e libera a vaga na sessão.
// Devolução de crédito só para quem pagou com parafina (crédito): pix não
// gera crédito automaticamente — se já tinha pago e confirmado, o reembolso
// do valor é combinado direto com o Ivan pelo WhatsApp (`needsManualRefund`).
export async function cancelReservation(reservation: Reservation, customerId: string): Promise<CancelReservationResult> {
  const classStart = new Date(`${reservation.date}T${reservation.startTime}:00`);
  const hoursUntilClass = (classStart.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilClass < 24) {
    throw new Error("Cancelamentos só podem ser feitos até 24h antes da aula.");
  }

  const base = `businesses/${reservation.businessId}`;
  const batch = writeBatch(db);

  batch.update(doc(db, `${base}/reservations`, reservation.id), {
    status: "cancelled",
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, `${base}/sessions`, reservation.sessionId), {
    currentCapacity: increment(-1), updatedAt: serverTimestamp(),
  });

  const refundsCredit = reservation.creditsUsed > 0;
  const needsManualRefund = reservation.payment === "pix" && reservation.status === "confirmed";

  if (refundsCredit) {
    batch.update(doc(db, `${base}/customers`, customerId), {
      creditBalance: increment(1), updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();

  if (reservation.customerEmail) {
    await notifyEmail({
      type: "cancellation",
      toEmail: reservation.customerEmail,
      toName: reservation.customerName,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      location: reservation.location,
      creditRefunded: refundsCredit,
      needsManualRefund,
    });
  }

  return { refundsCredit, needsManualRefund };
}
