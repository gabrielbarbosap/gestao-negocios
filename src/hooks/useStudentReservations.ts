"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { auth, onAuthStateChanged } from "@/lib/firebase/auth";
import { fetchMyReservations } from "@/lib/firebase/reservations";
import type { Reservation } from "@/types/reservation";

export function useStudentReservations() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) { setReservations([]); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    fetchMyReservations(user.uid)
      .then((r) => { if (!cancelled) setReservations(r); })
      .catch((e) => { console.error("[useStudentReservations]", e); if (!cancelled) setReservations([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  function refresh() {
    if (!user) return;
    setLoading(true);
    fetchMyReservations(user.uid)
      .then((r) => setReservations(r))
      .catch((e) => { console.error("[useStudentReservations]", e); setReservations([]); })
      .finally(() => setLoading(false));
  }

  return { user, reservations, loading, refresh };
}
