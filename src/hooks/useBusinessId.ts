"use client";

import { useEffect, useState } from "react";
import { auth, onAuthStateChanged } from "@/lib/firebase/auth";
import { isAdminUser, BUSINESS_ID } from "@/hooks/useAuth";

/**
 * Retorna o businessId do negócio (fixo — um único negócio com múltiplos
 * admins). Nunca é o uid de quem logou: dois admins diferentes (uids
 * diferentes) precisam enxergar exatamente os mesmos dados.
 *
 * - `undefined` → ainda carregando
 * - `null`      → sem usuário autenticado ou não é admin
 * - `string`    → businessId pronto
 */
export function useBusinessId(): string | null | undefined {
  const [businessId, setBusinessId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setBusinessId(user && isAdminUser(user) ? BUSINESS_ID : null);
    });
    return unsub;
  }, []);

  return businessId;
}
