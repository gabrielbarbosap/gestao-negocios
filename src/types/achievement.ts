export interface Achievement {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  category: "iniciante" | "habilidade" | "frequencia" | "avancado" | "especial";
  tier: "bronze" | "prata" | "ouro" | "diamante";
}

export const CATEGORY_LABELS: Record<Achievement["category"], string> = {
  iniciante:  "Iniciante",
  habilidade: "Habilidade",
  frequencia: "Frequência",
  avancado:   "Avançado",
  especial:   "Especial",
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
    id: "sem_medo_cair",
    name: "Sem Medo de Cair",
    description: "Caiu, levantou e voltou sorrindo para a água",
    xpReward: 80,
    category: "iniciante",
    tier: "bronze",
  },
  {
    id: "primeira_onda",
    name: "Primeira Onda",
    description: "Pegou a primeira onda sem ajuda do instrutor",
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
    description: "Ficou em pé na onda por mais de 5 segundos",
    xpReward: 200,
    category: "iniciante",
    tier: "bronze",
  },
  {
    id: "wax",
    name: "Encerou a Prancha",
    description: "Encerou a prancha pela primeira vez do jeito certo",
    xpReward: 60,
    category: "iniciante",
    tier: "bronze",
  },
  {
    id: "prancha_propria",
    name: "Prancha Própria",
    description: "Comprou ou ganhou sua própria prancha",
    xpReward: 300,
    category: "iniciante",
    tier: "prata",
  },
  {
    id: "cinco_aulas",
    name: "5 Aulas",
    description: "Completou 5 aulas de surf",
    xpReward: 250,
    category: "iniciante",
    tier: "prata",
  },
  {
    id: "posicao_correta",
    name: "Posição Certa",
    description: "Dominou a posição correta dos pés na prancha",
    xpReward: 150,
    category: "iniciante",
    tier: "bronze",
  },

  // ── HABILIDADE ──────────────────────────────────────────────────────────────
  {
    id: "remada_forte",
    name: "Remada Forte",
    description: "Dominou a técnica de remada sem se cansar rápido",
    xpReward: 200,
    category: "habilidade",
    tier: "bronze",
  },
  {
    id: "popup_perfeito",
    name: "Pop-up Perfeito",
    description: "Levantou rápido, limpo e equilibrado na prancha",
    xpReward: 300,
    category: "habilidade",
    tier: "prata",
  },
  {
    id: "duck_dive",
    name: "Duck Dive",
    description: "Mergulhou a prancha sob uma onda fechada corretamente",
    xpReward: 250,
    category: "habilidade",
    tier: "prata",
  },
  {
    id: "turtle_roll",
    name: "Turtle Roll",
    description: "Girou a prancha sob uma onda (para longboard)",
    xpReward: 200,
    category: "habilidade",
    tier: "prata",
  },
  {
    id: "bottom_turn",
    name: "Bottom Turn",
    description: "Fez a primeira virada na base da onda com controle",
    xpReward: 350,
    category: "habilidade",
    tier: "prata",
  },
  {
    id: "cutback",
    name: "Cutback",
    description: "Executou um cutback voltando à parte mais forte da onda",
    xpReward: 600,
    category: "habilidade",
    tier: "ouro",
  },
  {
    id: "floater",
    name: "Floater",
    description: "Deslizou sobre a parte branca da onda (floater)",
    xpReward: 600,
    category: "habilidade",
    tier: "ouro",
  },
  {
    id: "snap",
    name: "Snap",
    description: "Realizou um snap explosivo na lip da onda",
    xpReward: 700,
    category: "habilidade",
    tier: "ouro",
  },
  {
    id: "reentry",
    name: "Re-entry",
    description: "Executou um re-entry certeiro no topo da onda",
    xpReward: 700,
    category: "habilidade",
    tier: "ouro",
  },
  {
    id: "speed_run",
    name: "Speed Run",
    description: "Surfou a extensão completa de uma onda longa sem cair",
    xpReward: 400,
    category: "habilidade",
    tier: "ouro",
  },
  {
    id: "360",
    name: "360",
    description: "Completou um giro de 360° em cima da onda",
    xpReward: 900,
    category: "habilidade",
    tier: "ouro",
  },
  {
    id: "backside",
    name: "Surfou Backside",
    description: "Surfou de costas para a onda com controle",
    xpReward: 300,
    category: "habilidade",
    tier: "prata",
  },

  // ── FREQUÊNCIA ──────────────────────────────────────────────────────────────
  {
    id: "dez_aulas",
    name: "10 Aulas",
    description: "Completou 10 aulas de surf",
    xpReward: 400,
    category: "frequencia",
    tier: "prata",
  },
  {
    id: "vinte_aulas",
    name: "20 Aulas",
    description: "Completou 20 aulas de surf",
    xpReward: 700,
    category: "frequencia",
    tier: "ouro",
  },
  {
    id: "trinta_aulas",
    name: "30 Aulas",
    description: "Completou 30 aulas — dedicação total!",
    xpReward: 1000,
    category: "frequencia",
    tier: "ouro",
  },
  {
    id: "cinquenta_aulas",
    name: "50 Aulas",
    description: "Completou 50 aulas — você é um surfista de verdade",
    xpReward: 2000,
    category: "frequencia",
    tier: "diamante",
  },
  {
    id: "cem_aulas",
    name: "100 Aulas",
    description: "100 aulas! Lenda do mar",
    xpReward: 5000,
    category: "frequencia",
    tier: "diamante",
  },
  {
    id: "semanas_seguidas",
    name: "4 Semanas Seguidas",
    description: "Surfou pelo menos uma vez por semana por 4 semanas",
    xpReward: 500,
    category: "frequencia",
    tier: "ouro",
  },
  {
    id: "um_ano",
    name: "Um Ano Surfando",
    description: "Praticou surf por 12 meses seguidos",
    xpReward: 3000,
    category: "frequencia",
    tier: "diamante",
  },

  // ── AVANÇADO ──────────────────────────────────────────────────────────────
  {
    id: "shortboard",
    name: "No Shortboard",
    description: "Surfou pela primeira vez em uma prancha curta",
    xpReward: 600,
    category: "avancado",
    tier: "ouro",
  },
  {
    id: "barrel",
    name: "Dentro do Tubo",
    description: "Entrou em um tubo pela primeira vez",
    xpReward: 1200,
    category: "avancado",
    tier: "diamante",
  },
  {
    id: "tube_ride",
    name: "Tube Ride",
    description: "Ficou dentro do tubo por mais de 2 segundos",
    xpReward: 1800,
    category: "avancado",
    tier: "diamante",
  },
  {
    id: "aereo",
    name: "Aéreo",
    description: "Realizou o primeiro aéreo saindo da onda",
    xpReward: 2000,
    category: "avancado",
    tier: "diamante",
  },
  {
    id: "onda_grande",
    name: "Mar Bravo",
    description: "Surfou com ondas acima de 2 metros com segurança",
    xpReward: 1000,
    category: "avancado",
    tier: "diamante",
  },
  {
    id: "big_wave",
    name: "Big Wave",
    description: "Surfou ondas acima de 3 metros",
    xpReward: 3000,
    category: "avancado",
    tier: "diamante",
  },
  {
    id: "competicao",
    name: "Na Competição",
    description: "Participou de uma competição de surf",
    xpReward: 1500,
    category: "avancado",
    tier: "diamante",
  },
  {
    id: "ensinou_alguem",
    name: "Professor por um Dia",
    description: "Ajudou um iniciante a pegar a primeira onda",
    xpReward: 800,
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
    id: "por_do_sol",
    name: "Por do Sol",
    description: "Surfou no horário do pôr do sol",
    xpReward: 150,
    category: "especial",
    tier: "bronze",
  },
  {
    id: "chuva_nao_para",
    name: "Chuva Não Para",
    description: "Surfou mesmo com chuva forte",
    xpReward: 200,
    category: "especial",
    tier: "bronze",
  },
  {
    id: "familia_no_mar",
    name: "Família no Mar",
    description: "Surfou junto com alguém da família ou amigo próximo",
    xpReward: 250,
    category: "especial",
    tier: "prata",
  },
  {
    id: "novo_spot",
    name: "Novo Spot",
    description: "Surfou em uma praia diferente pela primeira vez",
    xpReward: 300,
    category: "especial",
    tier: "prata",
  },
  {
    id: "viagem_surf",
    name: "Viagem de Surf",
    description: "Viajou especialmente para surfar em outro lugar",
    xpReward: 500,
    category: "especial",
    tier: "ouro",
  },
  {
    id: "filmado",
    name: "Na Câmera",
    description: "Teve suas ondas filmadas ou fotografadas",
    xpReward: 200,
    category: "especial",
    tier: "prata",
  },
  {
    id: "mar_calmo",
    name: "Surfou no Vidro",
    description: "Surfou com o mar completamente liso (glass)",
    xpReward: 200,
    category: "especial",
    tier: "prata",
  },
];

export const XP_PER_LESSON = 50;

// Limiares mais difíceis — progressão exigente
export const LEVEL_THRESHOLDS = {
  Iniciante:    0,
  Intermediário: 2000,
  Avançado:     8000,
};

export function calculateLevel(xp: number): string {
  if (xp >= LEVEL_THRESHOLDS["Avançado"]) return "Avançado";
  if (xp >= LEVEL_THRESHOLDS["Intermediário"]) return "Intermediário";
  return "Iniciante";
}
