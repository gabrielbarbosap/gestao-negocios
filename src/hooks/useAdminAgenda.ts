"use client";

import { useEffect, useState } from "react";
import { listSessions } from "@/lib/firebase/sessions";
import { listReservations } from "@/lib/firebase/reservations";
import { listCustomers } from "@/lib/firebase/customers";
import type { Session } from "@/types/session";
import type { Reservation } from "@/types/reservation";
import type { Customer } from "@/types/customer";

export interface AgendaData {
  loading: boolean;
  error: string | null;
  sessions: Session[];
  // mapa sessionId → reservas ativas (alunos)
  reservationsBySession: Record<string, Reservation[]>;
  // alunos do negócio (para matricular numa aula direto da agenda)
  customers: Customer[];
  reload: () => void;
}

export function useAdminAgenda(businessId: string | null | undefined): AgendaData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reservationsBySession, setMap] = useState<Record<string, Reservation[]>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (businessId === undefined) return;
    if (businessId === null) { setLoading(false); setSessions([]); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [sess, reservas, alunos] = await Promise.all([
          listSessions(businessId),
          listReservations(businessId),
          listCustomers(businessId),
        ]);
        if (cancelled) return;

        const map: Record<string, Reservation[]> = {};
        reservas.forEach((r) => {
          if (r.status === "cancelled" || r.status === "no_show") return;
          (map[r.sessionId] ??= []).push(r);
        });

        setSessions(sess);
        setMap(map);
        setCustomers(alunos.sort((a, b) => (a.name || "").localeCompare(b.name || "")));
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[useAdminAgenda]", err);
        setError("Não foi possível carregar a agenda.");
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [businessId, tick]);

  return { loading, error, sessions, reservationsBySession, customers, reload: () => setTick((t) => t + 1) };
}
