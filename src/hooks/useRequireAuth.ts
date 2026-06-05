"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";

/**
 * Retorna uma função `requireAuth(action)` que:
 * - Se o usuário estiver logado → executa `action()` direto
 * - Se não estiver → redireciona para /login?redirect=<paginaAtual>
 *
 * Uso:
 *   const { requireAuth } = useRequireAuth();
 *   <button onClick={() => requireAuth(() => abrirModal())}>Agendar</button>
 */
export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  function requireAuth(action: () => void) {
    if (user) {
      action();
    } else {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }

  return { requireAuth, isAuthenticated: !!user };
}
