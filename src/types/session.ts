import { Timestamp } from "firebase/firestore";
import type { LocationId } from "@/constants/locations";

export type SessionStatus = "available" | "full" | "blocked" | "cancelled";

export interface Session {
  id: string;
  businessId: string;
  location: LocationId;          // "maracaipe" | "praia_do_borete"
  date: string;                  // "YYYY-MM-DD"
  startTime: string;             // "HH:MM"
  endTime: string;
  maxCapacity: number;
  currentCapacity: number;
  status: SessionStatus;
  isRecurring: boolean;
  recurringId?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProgressLog {
  id: string;
  businessId: string;
  customerId: string;
  sessionId: string;
  performance: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  strengths?: string;
  improvements?: string;
  skillsTrained: string[];
  instructorId: string;
  createdAt: Timestamp;
}

export type CreateSessionInput = Omit<
  Session,
  "id" | "currentCapacity" | "createdAt" | "updatedAt"
>;
