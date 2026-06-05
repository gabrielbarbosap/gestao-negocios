"use client";

import { useEffect, useState } from "react";
import { listSessions } from "@/lib/firebase/sessions";
import { listReservations } from "@/lib/firebase/reservations";
import { fetchPayments } from "@/lib/firebase/payments";
import type { Session } from "@/types/session";
import type { Payment } from "@/types/payment";
import type { Reservation } from "@/types/reservation";

export interface DashboardData {
  loading: boolean;
  error: string | null;
  sessionsThisWeek: number;
  activeStudents: number;
  revenueTotal: number;
  avgOccupancy: number;
  upcoming: Session[];
  recentPayments: Payment[];
  weekOccupancy: { d: string; v: number }[];
}

const EMPTY: DashboardData = {
  loading: true, error: null,
  sessionsThisWeek: 0, activeStudents: 0, revenueTotal: 0, avgOccupancy: 0,
  upcoming: [], recentPayments: [], weekOccupancy: [],
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const pad = (n: number) => String(n).padStart(2, "0");

// Retorna "YYYY-MM-DD" usando horário local
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Segunda-feira e domingo da semana que contém `d` (strings YYYY-MM-DD)
function weekBounds(d = new Date()): { start: string; end: string } {
  const day = d.getDay(); // 0=Dom, 1=Seg...
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMon);
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  return { start: localDateStr(mon), end: localDateStr(sun) };
}

export function useAdminDashboard(businessId: string | null | undefined): DashboardData {
  const [data, setData] = useState<DashboardData>(EMPTY);

  useEffect(() => {
    if (businessId === undefined) return;
    if (businessId === null) { setData({ ...EMPTY, loading: false }); return; }

    let cancelled = false;
    setData(EMPTY);

    (async () => {
      try {
        const [sessions, reservations, allPayments] = await Promise.all([
          listSessions(businessId),
          listReservations(businessId),
          fetchPayments(businessId, 100),
        ]);
        if (cancelled) return;

        const today = localDateStr();
        const { start: weekStart, end: weekEnd } = weekBounds();
        const inThisWeek = (dateStr: string) => dateStr >= weekStart && dateStr <= weekEnd;

        // ── Reservas ativas desta semana ──────────────────────────────────
        const weekReservations = reservations.filter(
          (r: Reservation) =>
            r.status !== "cancelled" &&
            inThisWeek(r.date),
        );

        // ── Sessões desta semana (para ocupação e gráfico) ────────────────
        const weekSessions = sessions.filter(
          (s) => inThisWeek(s.date) && s.status !== "cancelled" && s.status !== "blocked",
        );

        // ── Próximas aulas (hoje em diante, com vagas ou lotadas) ─────────
        const upcoming = sessions
          .filter((s) => s.date >= today && (s.status === "available" || s.status === "full"))
          .slice(0, 5);

        // ── Alunos únicos (por reservas — mais preciso que coleção customers) ──
        const activeStudents = new Set(
          reservations
            .filter((r: Reservation) => r.status !== "cancelled")
            .map((r: Reservation) => r.customerId)
        ).size;

        // ── Receita total (todos os pagamentos aprovados) ─────────────────
        const approvedPayments = allPayments.filter(
          (p) => (p as unknown as Record<string, unknown>).status === "approved",
        );

        const revenueTotal = approvedPayments.reduce((sum, p) => {
          const raw = p as unknown as Record<string, unknown>;
          const amount = typeof p.amount === "number"
            ? p.amount
            : typeof raw.amountTotal === "number"
              ? (raw.amountTotal as number) / 100
              : 0;
          return sum + amount;
        }, 0);

        // ── Ocupação média desta semana ───────────────────────────────────
        const occRates = weekSessions
          .filter((s) => s.maxCapacity > 0)
          .map((s) => (s.currentCapacity / s.maxCapacity) * 100);
        const avgOccupancy = occRates.length
          ? Math.round(occRates.reduce((a, b) => a + b, 0) / occRates.length)
          : 0;

        // ── Ocupação por dia (Seg→Dom) ────────────────────────────────────
        const byDay: Record<number, number[]> = {};
        weekSessions.forEach((s) => {
          if (s.maxCapacity <= 0) return;
          const parts = s.date.split("-").map(Number);
          const wd = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
          (byDay[wd] ??= []).push((s.currentCapacity / s.maxCapacity) * 100);
        });
        const weekOccupancy = [1, 2, 3, 4, 5, 6, 0].map((wd) => {
          const arr = byDay[wd] ?? [];
          const v = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
          return { d: WEEKDAYS[wd], v };
        });

        // ── Pagamentos recentes ───────────────────────────────────────────
        const recentPayments = [...approvedPayments]
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
          .slice(0, 5);

        setData({
          loading: false, error: null,
          sessionsThisWeek: weekReservations.length,
          activeStudents,
          revenueTotal,
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
