import { Timestamp } from "firebase/firestore";

export type BusinessType = "surf" | "beach_tennis" | "yoga" | "pilates" | "personal" | "generic";

export type BusinessStatus = "active" | "inactive" | "trial";

export interface Business {
  id: string;
  name: string;
  slug: string;
  type: BusinessType;
  ownerUid: string;
  ownerEmail: string;
  status: BusinessStatus;
  settings: BusinessSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BusinessSettings {
  timezone: string;
  currency: string;
  weekdayStart: number;
  slotDurationMinutes: number;
  operatingHours: OperatingHours;
  emailNotifications: boolean;
  weeklyReportEmail: string;
}

export interface OperatingHours {
  [day: number]: { start: string; end: string; active: boolean };
}

export type CreateBusinessInput = Omit<Business, "id" | "createdAt" | "updatedAt">;
