import { Timestamp } from "firebase/firestore";
import type { LocationId } from "@/constants/locations";

export type ReservationStatus =
  | "reserved"    // aluno reservou, aguardando a aula
  | "confirmed"   // presença confirmada pelo admin
  | "completed"   // aula realizada
  | "cancelled"   // cancelada
  | "no_show";    // não compareceu

// Como o aluno vai pagar a aula
export type PaymentMode = "credit" | "on_arrival";

// Uma reserva de um aluno para uma aula (sessão).
// Campos de data/hora/local são desnormalizados da sessão para facilitar
// as consultas "reservas do dia" e "reservas do aluno" sem joins.
export interface Reservation {
  id: string;
  businessId: string;
  sessionId: string;
  date: string;          // "YYYY-MM-DD"
  startTime: string;     // "HH:MM"
  endTime: string;
  location: LocationId;
  customerId: string;
  customerName: string;
  status: ReservationStatus;
  payment: PaymentMode;
  creditsUsed: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
