// ════════════════════════════════════════════════════════════════════════
//  SESSIONS — a grade de horários (disponíveis / bloqueados)
//  Coleção: businesses/{businessId}/sessions/{sessionId}
//  Cada documento é UM horário (data + hora + local) com sua capacidade.
//  status: "available" (liberado) | "blocked" | "full" | "cancelled"
// ════════════════════════════════════════════════════════════════════════
import {
  collection, collectionGroup, doc, getDocs, writeBatch, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "./config";
import { queryDocuments, orderBy } from "./firestore";
import type { Session } from "@/types/session";
import type { LocationId } from "@/constants/locations";

// Slots de 1h das 05h às 18h → horas de início 5..17 (13 slots)
export const HOURS = Array.from({ length: 13 }, (_, i) => i + 5);
export const DEFAULT_CAPACITY = 6;

const pad = (n: number) => String(n).padStart(2, "0");

function sessionsPath(businessId: string) {
  return `businesses/${businessId}/sessions`;
}

// ─── Admin: toda a grade do negócio ───────────────────────────────────────
export async function listSessions(businessId: string): Promise<Session[]> {
  const sessions = await queryDocuments<Session>(sessionsPath(businessId), orderBy("date"));
  return sessions.sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
  );
}

// ─── Admin: salva a liberação de UMA SEMANA (datas reais) ─────────────────
// `desired` = chaves `${yyyy-mm-dd}_${HH:MM}` liberadas na semana visível.
// • cria as novas liberadas
// • apaga as que foram desmarcadas E estão sem reservas (reflete o "Limpar")
// • reativa as bloqueadas que voltaram a ser liberadas
// Nunca apaga uma aula com alunos inscritos (currentCapacity > 0).
export async function saveWeekGrid(
  businessId: string, location: LocationId,
  weekDates: string[], desired: Set<string>, capacity: number,
): Promise<void> {
  const all = await listSessions(businessId);
  const inWeek = all.filter((s) => s.location === location && weekDates.includes(s.date));
  const existingByKey = new Map(inWeek.map((s) => [`${s.date}_${s.startTime}`, s]));

  const col = collection(db, sessionsPath(businessId));
  let batch = writeBatch(db);
  let ops = 0;
  const flush = async () => { if (ops > 0) { await batch.commit(); batch = writeBatch(db); ops = 0; } };
  const bump = async () => { if (++ops >= 450) await flush(); };

  for (const key of desired) {
    if (existingByKey.has(key)) continue;
    const [date, startTime] = key.split("_");
    const h = Number(startTime.slice(0, 2));
    batch.set(doc(col), {
      businessId, location, date, startTime, endTime: `${pad(h + 1)}:00`,
      maxCapacity: capacity, currentCapacity: 0, status: "available",
      isRecurring: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    await bump();
  }

  for (const s of inWeek) {
    const key = `${s.date}_${s.startTime}`;
    const ref = doc(db, sessionsPath(businessId), s.id);
    if (!desired.has(key)) {
      // desabilitado: apaga se vazio; se já tem reservas, BLOQUEIA (some das agendas
      // e não aceita novas reservas, mas preserva o registro das aulas marcadas)
      if ((s.currentCapacity ?? 0) === 0) { batch.delete(ref); await bump(); }
      else if (s.status !== "blocked") { batch.update(ref, { status: "blocked", updatedAt: serverTimestamp() }); await bump(); }
    } else if (s.status === "blocked" || s.status === "cancelled") {
      batch.update(ref, { status: "available", maxCapacity: capacity, updatedAt: serverTimestamp() });
      await bump();
    }
  }

  await flush();
}

// ─── Admin: bloqueia uma sessão específica (mantém histórico) ─────────────
export async function blockSession(businessId: string, sessionId: string): Promise<void> {
  await updateDoc(doc(db, sessionsPath(businessId), sessionId), {
    status: "blocked", updatedAt: serverTimestamp(),
  });
}

// ─── Aluno: aulas disponíveis (todas as localidades) ──────────────────────
// collection group → não precisa do businessId no cliente.
export async function fetchAvailableSessions(): Promise<Session[]> {
  const snap = await getDocs(collectionGroup(db, "sessions"));
  const today = new Date().toISOString().slice(0, 10);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Session)
    .filter((s) =>
      s.status === "available" && s.date >= today &&
      (s.currentCapacity ?? 0) < (s.maxCapacity ?? 0))
    .sort((a, b) =>
      a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date));
}

// ─── Home (público): slots disponíveis por local → Set "yyyy-mm-dd-hora" ──
export async function fetchPublicAvailableSlots(location: LocationId): Promise<Set<string>> {
  const snap = await getDocs(collectionGroup(db, "sessions"));
  const today = new Date().toISOString().slice(0, 10);
  const set = new Set<string>();
  snap.docs.forEach((d) => {
    const s = d.data() as Session;
    if (
      s.location === location && s.status === "available" &&
      s.date >= today && (s.currentCapacity ?? 0) < (s.maxCapacity ?? 0)
    ) {
      set.add(`${s.date}-${Number(s.startTime.slice(0, 2))}`);
    }
  });
  return set;
}
