export const LOCATIONS = [
  {
    id: "maracaipe" as const,
    name: "Maracaipe",
    emoji: "🏖️",
    description: "Praia de Maracaipe, PE",
  },
  {
    id: "praia_do_borete" as const,
    name: "Praia do Borete",
    emoji: "🌊",
    description: "Praia do Borete, PE",
  },
] as const;

export type LocationId = (typeof LOCATIONS)[number]["id"];

export function getLocation(id: LocationId) {
  return LOCATIONS.find((l) => l.id === id)!;
}
