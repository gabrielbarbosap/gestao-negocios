"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useStudentReservations } from "@/hooks/useStudentReservations";
import { CircleNotch, LockSimple, Seal, SealCheck } from "@phosphor-icons/react";
import {
  SURF_ACHIEVEMENTS, CATEGORY_LABELS, calculateLevel,
  type Achievement,
} from "@/types/achievement";

const TIER_COLORS: Record<Achievement["tier"], { bg: string; border: string; text: string; badge: string }> = {
  bronze:   { bg: "rgba(180,120,60,0.08)",  border: "rgba(180,120,60,0.3)",  text: "#b4783c", badge: "#b4783c" },
  prata:    { bg: "rgba(140,150,165,0.08)", border: "rgba(140,150,165,0.3)", text: "#8c96a5", badge: "#8c96a5" },
  ouro:     { bg: "rgba(245,192,48,0.08)",  border: "rgba(245,192,48,0.3)",  text: "#c8960a", badge: "#c8960a" },
  diamante: { bg: "rgba(46,191,181,0.1)",   border: "rgba(46,191,181,0.4)", text: "var(--teal-light)", badge: "var(--teal-light)" },
};

const TIER_LABELS: Record<Achievement["tier"], string> = {
  bronze: "Bronze", prata: "Prata", ouro: "Ouro", diamante: "Diamante",
};

const CATEGORIES = ["iniciante", "habilidade", "frequencia", "avancado", "especial"] as const;

export default function ConquistasPage() {
  const { user } = useStudentReservations();
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const businessId = process.env.NEXT_PUBLIC_BUSINESS_ID!;

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "businesses", businessId, "customers", user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setUnlocked(new Set(d.achievements ?? []));
          setXp(d.xp ?? 0);
        }
      })
      .finally(() => setLoading(false));
  }, [user, businessId]);

  async function toggle(achievement: Achievement) {
    if (!user || toggling) return;
    setToggling(achievement.id);

    const isUnlocked = unlocked.has(achievement.id);
    const next = new Set(unlocked);
    let nextXp = xp;

    if (isUnlocked) {
      next.delete(achievement.id);
      nextXp = Math.max(0, xp - achievement.xpReward);
    } else {
      next.add(achievement.id);
      nextXp = xp + achievement.xpReward;
    }

    const nextLevel = calculateLevel(nextXp);
    setUnlocked(next);
    setXp(nextXp);

    try {
      await updateDoc(doc(db, "businesses", businessId, "customers", user.uid), {
        achievements: Array.from(next),
        xp: nextXp,
        level: nextLevel,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      // revert on error
      setUnlocked(unlocked);
      setXp(xp);
      console.error(e);
    } finally {
      setToggling(null);
    }
  }

  const level = calculateLevel(xp);
  const totalUnlocked = unlocked.size;
  const totalAchievements = SURF_ACHIEVEMENTS.length;

  // XP para próximo nível
  const nextThreshold = level === "Avançado" ? null : level === "Intermediário" ? 8000 : 2000;
  const prevThreshold = level === "Avançado" ? 8000 : level === "Intermediário" ? 2000 : 0;
  const progress = nextThreshold
    ? Math.min(100, ((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
    : 100;

  return (
    <div className="rise" style={{ maxWidth: "600px" }}>
      <header style={{ marginBottom: "20px" }}>
        <h1 className="font-display" style={{ fontSize: "1.9rem", color: "var(--text-1)" }}>Conquistas</h1>
        <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-2)" }}>
          Sua jornada no surf em conquistas e XP
        </p>
      </header>

      {/* Instrução clara */}
      <div style={{
        background: "rgba(46,191,181,0.07)",
        border: "1px solid rgba(46,191,181,0.2)",
        borderRadius: "12px",
        padding: "13px 16px",
        marginBottom: "22px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <Seal size={22} weight="fill" style={{ color: "var(--teal-light)", flexShrink: 0 }} />
        <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--text-1)" }}>Você mesmo controla suas conquistas.</strong>
          {" "}Clique em qualquer card para marcar como alcançado — ou desmarcar se quiser corrigir.
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
          <CircleNotch size={24} className="ph-spin" style={{ color: "var(--text-3)" }} />
        </div>
      ) : (
        <>
          {/* ── Resumo XP ─────────────────────────────────────────────── */}
          <div className="card rise-2" style={{ padding: "18px 20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nível</p>
                <p className="font-display" style={{ fontSize: "1.4rem", color: "var(--teal-light)", marginTop: "2px" }}>{level}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>XP total</p>
                <p className="font-display" style={{ fontSize: "1.4rem", color: "var(--text-1)", marginTop: "2px" }}>{xp.toLocaleString("pt-BR")}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Desbloqueadas</p>
                <p className="font-display" style={{ fontSize: "1.4rem", color: "var(--text-1)", marginTop: "2px" }}>{totalUnlocked}/{totalAchievements}</p>
              </div>
            </div>

            {nextThreshold && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{level}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{level === "Iniciante" ? "Intermediário" : "Avançado"} ({nextThreshold} XP)</span>
                </div>
                <div style={{ height: "6px", borderRadius: "99px", background: "var(--bg-4)", overflow: "hidden" }}>
                  <div className="xp-fill" style={{ height: "100%", width: `${progress}%`, borderRadius: "99px" }} />
                </div>
              </>
            )}
            {!nextThreshold && (
              <p style={{ fontSize: "12.5px", color: "var(--teal-light)", fontWeight: 700, textAlign: "center" }}>
                Nível máximo atingido!
              </p>
            )}
          </div>

          {/* ── Conquistas por categoria ───────────────────────────────── */}
          {CATEGORIES.map((cat) => {
            const items = SURF_ACHIEVEMENTS.filter((a) => a.category === cat);
            const catUnlocked = items.filter((a) => unlocked.has(a.id)).length;
            return (
              <section key={cat} className="rise-2" style={{ marginBottom: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h2 className="font-display" style={{ fontSize: "1.1rem", color: "var(--text-1)" }}>
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 700 }}>
                    {catUnlocked}/{items.length}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                  {items.map((a) => {
                    const isUnlocked = unlocked.has(a.id);
                    const isToggling = toggling === a.id;
                    const colors = TIER_COLORS[a.tier];
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggle(a)}
                        disabled={!!toggling}
                        style={{
                          all: "unset",
                          cursor: toggling ? "not-allowed" : "pointer",
                          display: "flex",
                          flexDirection: "column",
                          padding: "14px",
                          borderRadius: "12px",
                          border: `1px solid ${isUnlocked ? colors.border : "var(--border)"}`,
                          background: isUnlocked ? colors.bg : "var(--card-bg)",
                          transition: "all 0.18s",
                          opacity: !isUnlocked ? 0.55 : 1,
                          position: "relative",
                          textAlign: "left",
                        }}
                        onMouseEnter={e => { if (!toggling) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = isUnlocked ? "1" : "0.55"; }}
                      >
                        {/* Ícone de status */}
                        <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          {isToggling ? (
                            <CircleNotch size={22} className="ph-spin" style={{ color: colors.text }} />
                          ) : isUnlocked ? (
                            <SealCheck size={22} weight="fill" style={{ color: colors.text }} />
                          ) : (
                            <LockSimple size={18} style={{ color: "var(--text-3)" }} />
                          )}
                          <span style={{
                            fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                            color: isUnlocked ? colors.badge : "var(--text-3)",
                            border: `1px solid ${isUnlocked ? colors.border : "var(--border)"}`,
                            padding: "2px 6px", borderRadius: "99px",
                          }}>
                            {TIER_LABELS[a.tier]}
                          </span>
                        </div>

                        <p style={{ fontSize: "13px", fontWeight: 700, color: isUnlocked ? "var(--text-1)" : "var(--text-2)", lineHeight: 1.3, marginBottom: "4px" }}>
                          {a.name}
                        </p>
                        <p style={{ fontSize: "11.5px", color: "var(--text-3)", lineHeight: 1.4, marginBottom: "8px", flexGrow: 1 }}>
                          {a.description}
                        </p>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: isUnlocked ? colors.text : "var(--text-3)" }}>
                          +{a.xpReward} XP
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </>
      )}

      <style>{`
        .ph-spin { animation: ph-spin 0.9s linear infinite; }
        @keyframes ph-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
