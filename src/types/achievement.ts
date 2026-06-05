import { Timestamp } from "firebase/firestore";

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: AchievementCategory;
}

export type AchievementCategory = "milestone" | "frequency" | "skill" | "fun";

export interface CustomerAchievement {
  id: string;
  businessId: string;
  customerId: string;
  achievementId: string;
  source: "instructor" | "self";
  unlockedAt: Timestamp;
  sessionId?: string;
}

export const SURF_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_lesson",
    slug: "first_lesson",
    name: "Primeira Aula",
    description: "Completou a primeira aula de surf",
    icon: "🏄",
    xpReward: 100,
    category: "milestone",
  },
  {
    id: "stood_up",
    slug: "stood_up",
    name: "Em Pé!",
    description: "Ficou em pé na prancha",
    icon: "🌊",
    xpReward: 150,
    category: "skill",
  },
  {
    id: "sat_on_board",
    slug: "sat_on_board",
    name: "Sentado na Prancha",
    description: "Sentou na prancha com equilíbrio",
    icon: "🏊",
    xpReward: 80,
    category: "skill",
  },
  {
    id: "first_maneuver",
    slug: "first_maneuver",
    name: "Primeira Manobra",
    description: "Realizou uma manobra específica",
    icon: "⚡",
    xpReward: 200,
    category: "skill",
  },
  {
    id: "had_fun",
    slug: "had_fun",
    name: "Diversão Total",
    description: "Se divertiu muito na sessão",
    icon: "😄",
    xpReward: 50,
    category: "fun",
  },
  {
    id: "10_lessons",
    slug: "10_lessons",
    name: "10 Aulas",
    description: "Completou 10 aulas de surf",
    icon: "🥉",
    xpReward: 300,
    category: "milestone",
  },
  {
    id: "30_lessons",
    slug: "30_lessons",
    name: "30 Aulas",
    description: "Completou 30 aulas de surf",
    icon: "🥇",
    xpReward: 1000,
    category: "milestone",
  },
  {
    id: "weekly_streak",
    slug: "weekly_streak",
    name: "Sequência Semanal",
    description: "Praticou por 4 semanas consecutivas",
    icon: "🔥",
    xpReward: 400,
    category: "frequency",
  },
];

export const XP_PER_LESSON = 50;
export const XP_FREQUENCY_BONUS = 25;

export const LEVEL_THRESHOLDS: Record<string, number> = {
  Iniciante: 0,
  Intermediário: 500,
  Avançado: 2000,
};

export function calculateLevel(xp: number): string {
  if (xp >= LEVEL_THRESHOLDS["Avançado"]) return "Avançado";
  if (xp >= LEVEL_THRESHOLDS["Intermediário"]) return "Intermediário";
  return "Iniciante";
}
