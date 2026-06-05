"use client";

import { useEffect, useState, useCallback } from "react";
import type { User } from "firebase/auth";
import { auth, onAuthStateChanged } from "@/lib/firebase/auth";
import { fetchAvailableSessions } from "@/lib/firebase/sessions";
import type { Session } from "@/types/session";

export function useStudentAgenda() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSessions(await fetchAvailableSessions());
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      console.error("[useStudentAgenda] erro:", code, e);
      setError(
        code === "permission-denied"
          ? "Sem permissão para ler os horários (verifique se está logado)."
          : "Não foi possível carregar os horários.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { user, sessions, loading, error, reload: load, setSessions };
}
