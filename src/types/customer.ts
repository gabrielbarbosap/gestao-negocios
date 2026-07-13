import { Timestamp } from "firebase/firestore";

export type CustomerStatus = "active" | "inactive";

export type CustomerLevel = "Iniciante" | "Intermediário" | "Avançado";

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;  // "YYYY-MM-DD"
  photoUrl?: string;
  status: CustomerStatus;
  creditBalance: number;
  xp: number;
  level: CustomerLevel;
  achievements: string[];
  hasSeenOnboarding?: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateCustomerInput = Omit<
  Customer,
  "id" | "creditBalance" | "xp" | "level" | "achievements" | "createdAt" | "updatedAt"
>;
