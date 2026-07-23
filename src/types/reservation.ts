import { Timestamp } from "firebase/firestore";
import type { LocationId } from "@/constants/locations";

export type ReservationStatus =
  | "reserved"    // aluno reservou; se for pix, aguardando confirmação de pagamento
  | "confirmed"   // pago (crédito já debitado, ou pix marcado como pago pelo aluno)
  | "completed"   // aula realizada
  | "cancelled"   // cancelada
  | "no_show";    // não compareceu

// Como o aluno vai pagar a aula: crédito (parafina já comprada via Stripe)
// ou pix (paga na mão e reporta o comprovante — ver src/constants/payment.ts).
export type PaymentMode = "credit" | "pix";

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
  customerEmail?: string; // ausente em reservas criadas antes desse campo existir
  status: ReservationStatus;
  payment: PaymentMode;
  creditsUsed: number;
  // Preenchidos pelo webhook da InfinitePay quando o pix é pago (ver
  // src/app/api/webhooks/infinitepay/route.ts). Ausentes em pix antigos/manuais.
  infinitePayTransactionNsu?: string;
  infinitePaySlug?: string;
  infinitePayPaidAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
