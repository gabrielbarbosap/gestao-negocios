// ════════════════════════════════════════════════════════════════════════
//  PAYMENTS — pagamentos
//  Coleção: businesses/{businessId}/payments/{paymentId}
// ════════════════════════════════════════════════════════════════════════
import { queryDocuments, orderBy, limit, where } from "./firestore";
import type { Payment } from "@/types/payment";

function paymentsPath(businessId: string) {
  return `businesses/${businessId}/payments`;
}

export async function fetchPayments(businessId: string, max = 8): Promise<Payment[]> {
  return queryDocuments<Payment>(paymentsPath(businessId), orderBy("createdAt", "desc"), limit(max));
}

export async function fetchApprovedPayments(businessId: string): Promise<Payment[]> {
  return queryDocuments<Payment>(paymentsPath(businessId), where("status", "==", "approved"));
}
