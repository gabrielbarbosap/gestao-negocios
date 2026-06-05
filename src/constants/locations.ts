export const LOCATIONS = [
  {
    id: "maracaipe" as const,
    name: "Maracaipe",
    description: "Praia de Maracaipe, PE",
  },
  {
    id: "praia_do_borete" as const,
    name: "Praia do Borete",
    description: "Praia do Borete, PE",
  },
] as const;

export type LocationId = (typeof LOCATIONS)[number]["id"];

export function getLocation(id: LocationId) {
  return LOCATIONS.find((l) => l.id === id)!;
}
