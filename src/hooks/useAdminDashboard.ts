"use client";

import { useEffect, useState } from "react";
import { startOfWeek, endOfWeek, parseISO, isWithinInterval, format } from "date-fns";
import { listSessions } from "@/lib/firebase/sessions";
import { listCustomers } from "@/lib/firebase/customers";
import { fetchApprovedPayments } from "@/lib/firebase/payments";
import type { Session } from "@/types/session";
import type { Payment } from "@/types/payment";
import type { Customer } from "@/types/customer";

export interface DashboardData {
  loading: boolean;
  error: string | null;
  // métricas
  sessionsThisWeek: number;
  activeStudents: number;
  revenueThisWeek: number;
  avgOccupancy: number;        // 0–100
  // listas
  upcoming: Session[];         // próximas aulas a partir de hoje
  recentPayments: Payment[];
  weekOccupancy: { d: string; v: number }[]; // ocupação por dia da semana
}

const EMPTY: DashboardData = {
  loading: true, error: null,
  sessionsThisWeek: 0, activeStudents: 0, revenueThisWeek: 0, avgOccupancy: 0,
  upcoming: [], recentPayments: [], weekOccupancy: [],
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function useAdminDashboard(businessId: string | null | undefined): DashboardData {
  const [data, setData] = useState<DashboardData>(EMPTY);

  useEffect(() => {
    if (businessId === undefined) return;          // ainda carregando auth
    if (businessId === null) {                      // sem auth
      setData({ ...EMPTY, loading: false });
      return;
    }

    let cancelled = false;
    setData(EMPTY);

    (async () => {
      try {
        const [sessions, customers, approvedPayments] = await Promise.all([
          listSessions(businessId),
          listCustomers(businessId),
          fetchApprovedPayments(businessId),
        ]);
        if (cancelled) return;

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const inThisWeek = (dateStr: string) => {
          try { return isWithinInterval(parseISO(dateStr), { start: weekStart, end: weekEnd }); }
          catch { return false; }
        };

        // Sessões desta semana
        const weekSessions = sessions.filter((s) => inThisWeek(s.date));

        // Próximas aulas (hoje em diante, não canceladas)
        const todayStr = format(now, "yyyy-MM-dd");
        const upcoming = sessions
          .filter((s) => s.date >= todayStr && s.status !== "cancelled")
          .slice(0, 5);

        // Faturamento da semana — suporta campo legado amountTotal (centavos) e amount (reais)
        const revenueThisWeek = approvedPayments
          .filter((p) => {
            const d = p.createdAt?.toDate?.();
            return d ? isWithinInterval(d, { start: weekStart, end: weekEnd }) : false;
          })
          .reduce((sum, p) => {
            const raw = p as Record<string, unknown>;
            const amount = typeof p.amount === "number"
              ? p.amount
              : typeof raw.amountTotal === "number"
                ? (raw.amountTotal as number) / 100
                : 0;
            return sum + amount;
          }, 0);

        // Ocupação média desta semana
        const occRates = weekSessions
          .filter((s) => s.maxCapacity > 0)
          .map((s) => (s.currentCapacity / s.maxCapacity) * 100);
        const avgOccupancy = occRates.length
          ? Math.round(occRates.reduce((a, b) => a + b, 0) / occRates.length)
          : 0;

        // Ocupação por dia da semana (média por weekday)
        const byDay: Record<number, number[]> = {};
        weekSessions.forEach((s) => {
          if (s.maxCapacity <= 0) return;
          const wd = parseISO(s.date).getDay();
          (byDay[wd] ??= []).push((s.currentCapacity / s.maxCapacity) * 100);
        });
        const weekOccupancy = [1, 2, 3, 4, 5, 6, 0].map((wd) => {
          const arr = byDay[wd] ?? [];
          const v = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
          return { d: WEEKDAYS[wd], v };
        });

        const recentPayments = [...approvedPayments]
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
          .slice(0, 5);

        setData({
          loading: false, error: null,
          sessionsThisWeek: weekSessions.length,
          activeStudents: customers.filter((c: Customer) => c.status === "active").length,
          revenueThisWeek,
          avgOccupancy,
          upcoming,
          recentPayments,
          weekOccupancy,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("[useAdminDashboard]", err);
        setData({ ...EMPTY, loading: false, error: "Não foi possível carregar os dados." });
      }
    })();

    return () => { cancelled = true; };
  }, [businessId]);

  return data;
}
