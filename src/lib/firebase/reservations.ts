// ════════════════════════════════════════════════════════════════════════
//  RESERVATIONS — horários reservados por aluno
//  Coleção: businesses/{businessId}/reservations/{reservationId}
//  Liga um aluno a uma sessão. Data/hora/local são desnormalizados da
//  sessão para consultas fáceis (reservas do dia / do aluno).
// ════════════════════════════════════════════════════════════════════════
import {
  collection, collectionGroup, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp, increment,
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
// crédito, desconta 1 do saldo do aluno. `payOnArrival` paga na hora (0 crédito).
export async function createReservation(
  session: Session,
  customer: { id: string; name: string },
  opts: { payOnArrival: boolean },
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
    status: "reserved",
    payment: opts.payOnArrival ? "on_arrival" : "credit",
    creditsUsed: opts.payOnArrival ? 0 : 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, `${base}/sessions`, session.id), {
    currentCapacity: increment(1), updatedAt: serverTimestamp(),
  });

  if (!opts.payOnArrival) {
    batch.update(doc(db, `${base}/customers`, customer.id), {
      creditBalance: increment(-1), updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

// ─── Aluno: cancela a própria reserva ────────────────────────────────────
// Num único batch: marca a reserva como cancelada, libera a vaga na sessão
// e, se o aluno pagou com crédito, devolve 1 crédito ao saldo.
export async function cancelReservation(reservation: Reservation, customerId: string): Promise<void> {
  const base = `businesses/${reservation.businessId}`;
  const batch = writeBatch(db);

  batch.update(doc(db, `${base}/reservations`, reservation.id), {
    status: "cancelled",
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, `${base}/sessions`, reservation.sessionId), {
    currentCapacity: increment(-1), updatedAt: serverTimestamp(),
  });

  if (reservation.creditsUsed > 0) {
    batch.update(doc(db, `${base}/customers`, customerId), {
      creditBalance: increment(1), updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
