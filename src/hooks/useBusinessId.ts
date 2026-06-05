"use client";

import { useEffect, useState } from "react";
import { auth, onAuthStateChanged } from "@/lib/firebase/auth";

/**
 * Retorna o businessId do admin logado.
 *
 * O documento de negócio do admin é criado com o próprio uid como id
 * (ver `ensureAdminBusiness` em useAuth), portanto businessId === uid.
 *
 * - `undefined` → ainda carregando
 * - `null`      → sem usuário autenticado
 * - `string`    → businessId pronto
 */
export function useBusinessId(): string | null | undefined {
  const [businessId, setBusinessId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setBusinessId(user ? user.uid : null);
    });
    return unsub;
  }, []);

  return businessId;
}
