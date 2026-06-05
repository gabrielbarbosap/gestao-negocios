export interface Achievement {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  category: "iniciante" | "habilidade" | "frequencia" | "avancado" | "especial";
  tier: "bronze" | "prata" | "ouro" | "diamante";
}

export const CATEGORY_LABELS: Record<Achievement["category"], string> = {
  iniciante:   "Iniciante",
  habilidade:  "Habilidade",
  frequencia:  "Frequência",
  avancado:    "Avançado",
  especial:    "Especial",
};

export const SURF_ACHIEVEMENTS: Achievement[] = [
  // ── INICIANTE ──────────────────────────────────────────────────────────────
  {
    id: "primeira_aula",
    name: "Primeira Aula",
    description: "Completou sua primeira aula de surf",
    xpReward: 100,
    category: "iniciante",
    tier: "bronze",
  },
  {
    id: "primeira_onda",
    name: "Primeira Onda",
    description: "Pegou a primeira onda sem ajuda",
    xpReward: 150,
    category: "iniciante",
    tier: "bronze",
  },
  {
    id: "em_pe",
    name: "Em Pé!",
    description: "Ficou em pé na prancha pela primeira vez",
    xpReward: 200,
    category: "iniciante",
    tier: "bronze",
  },
  {
    id: "equilibrista",
    name: "Equilibrista",
    description: "Ficou em pé por mais de 5 segundos",
    xpReward: 150,
    category: "iniciante",
    tier: "bronze",
  },
  {
    id: "sem_medo",
    name: "Sem Medo de Cair",
    description: "Caiu, levantou e voltou sorrindo",
    xpReward: 80,
    category: "iniciante",
    tier: "bronze",
  },
  {
    id: "cinco_aulas",
    name: "5 Aulas",
    description: "Completou 5 aulas de surf",
    xpReward: 200,
    category: "iniciante",
    tier: "prata",
  },

  // ── HABILIDADE ──────────────────────────────────────────────────────────────
  {
    id: "remada_forte",
    name: "Remada Forte",
    description: "Dominou a técnica de remada",
    xpReward: 150,
    category: "habilidade",
    tier: "bronze",
  },
  {
    id: "popup_perfeito",
    name: "Pop-up Perfeito",
    description: "Levantou rápido e limpo na prancha",
    xpReward: 200,
    category: "habilidade",
    tier: "prata",
  },
  {
    id: "primeira_virada",
    name: "Primeira Virada",
    description: "Fez a primeira virada (bottom turn) na onda",
    xpReward: 250,
    category: "habilidade",
    tier: "prata",
  },
  {
    id: "cutback",
    name: "Cutback",
    description: "Executou um cutback na onda",
    xpReward: 400,
    category: "habilidade",
    tier: "ouro",
  },
  {
    id: "floater",
    name: "Floater",
    description: "Fez o primeiro floater",
    xpReward: 400,
    category: "habilidade",
    tier: "ouro",
  },
  {
    id: "snap",
    name: "Snap",
    description: "Realizou um snap na lip da onda",
    xpReward: 450,
    category: "habilidade",
    tier: "ouro",
  },
  {
    id: "duck_dive",
    name: "Duck Dive",
    description: "Mergulhou a prancha sob uma onda corretamente",
    xpReward: 200,
    category: "habilidade",
    tier: "prata",
  },

  // ── FREQUÊNCIA ──────────────────────────────────────────────────────────────
  {
    id: "dez_aulas",
    name: "10 Aulas",
    description: "Completou 10 aulas de surf",
    xpReward: 300,
    category: "frequencia",
    tier: "prata",
  },
  {
    id: "vinte_aulas",
    name: "20 Aulas",
    description: "Completou 20 aulas de surf",
    xpReward: 500,
    category: "frequencia",
    tier: "ouro",
  },
  {
    id: "trinta_aulas",
    name: "30 Aulas",
    description: "Completou 30 aulas de surf",
    xpReward: 800,
    category: "frequencia",
    tier: "ouro",
  },
  {
    id: "cinquenta_aulas",
    name: "50 Aulas",
    description: "Completou 50 aulas — surfista de verdade!",
    xpReward: 1500,
    category: "frequencia",
    tier: "diamante",
  },
  {
    id: "semanas_seguidas",
    name: "Semanas Seguidas",
    description: "Surfou por 4 semanas consecutivas",
    xpReward: 400,
    category: "frequencia",
    tier: "ouro",
  },

  // ── AVANÇADO ──────────────────────────────────────────────────────────────
  {
    id: "barrel",
    name: "Dentro do Tubo",
    description: "Entrou em um tubo pela primeira vez",
    xpReward: 800,
    category: "avancado",
    tier: "ouro",
  },
  {
    id: "aereo",
    name: "Aéreo",
    description: "Realizou o primeiro aéreo",
    xpReward: 1000,
    category: "avancado",
    tier: "diamante",
  },
  {
    id: "onda_grande",
    name: "Mar Bravo",
    description: "Surfou com ondas acima de 2 metros",
    xpReward: 600,
    category: "avancado",
    tier: "ouro",
  },
  {
    id: "shortboard",
    name: "No Shortboard",
    description: "Surfou pela primeira vez em uma prancha curta",
    xpReward: 500,
    category: "avancado",
    tier: "ouro",
  },

  // ── ESPECIAL ──────────────────────────────────────────────────────────────
  {
    id: "amanhecer",
    name: "Surf ao Amanhecer",
    description: "Pegou ondas no nascer do sol",
    xpReward: 200,
    category: "especial",
    tier: "prata",
  },
  {
    id: "chuva_nao_para",
    name: "Chuva Não Para",
    description: "Surfou mesmo na chuva",
    xpReward: 150,
    category: "especial",
    tier: "bronze",
  },
  {
    id: "familia_no_mar",
    name: "Família no Mar",
    description: "Surfou junto com alguém da família ou amigo",
    xpReward: 200,
    category: "especial",
    tier: "prata",
  },
];

export const XP_PER_LESSON = 50;

export const LEVEL_THRESHOLDS = {
  Iniciante: 0,
  Intermediário: 500,
  Avançado: 2000,
};

export function calculateLevel(xp: number): string {
  if (xp >= LEVEL_THRESHOLDS["Avançado"]) return "Avançado";
  if (xp >= LEVEL_THRESHOLDS["Intermediário"]) return "Intermediário";
  return "Iniciante";
}
