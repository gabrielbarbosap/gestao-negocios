import { Timestamp } from "firebase/firestore";

export type PaymentStatus = "pending" | "approved" | "rejected" | "refunded" | "cancelled";

export type PaymentMethod = "credit_card" | "pix" | "cash" | "bank_transfer";

export type PaymentType = "package" | "single_session" | "monthly";

export interface Payment {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  mercadoPagoId?: string;
  mercadoPagoPaymentId?: string;
  packageId?: string;
  creditsGranted?: number;
  installments?: number;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Package {
  id: string;
  businessId: string;
  name: string;
  lessonCount: number;
  price: number;
  description?: string;
  active: boolean;
  createdAt: Timestamp;
}

export type CreatePaymentInput = Omit<Payment, "id" | "createdAt" | "updatedAt">;
