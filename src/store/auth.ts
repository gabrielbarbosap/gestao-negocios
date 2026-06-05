import { create } from "zustand";
import { User } from "firebase/auth";
import { Business } from "@/types";

interface AuthState {
  user: User | null;
  business: Business | null;
  role: "admin" | "student" | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setBusiness: (business: Business | null) => void;
  setRole: (role: "admin" | "student" | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  business: null,
  role: null,
  loading: true,
  setUser: (user) => set({ user }),
  setBusiness: (business) => set({ business }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ user: null, business: null, role: null, loading: false }),
}));
