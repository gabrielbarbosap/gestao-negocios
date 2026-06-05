"use client";

import { useEffect } from "react";
import { User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthChange, auth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/config";
import { useAuthStore } from "@/store/auth";
import { generateSlug } from "@/lib/utils";

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

export function isAdminUser(user: User | null): boolean {
  return !!user && user.email === ADMIN_EMAIL;
}

// Garante que o documento de negócio do admin existe.
// Chamado apenas quando o admin faz login pela primeira vez.
async function ensureAdminBusiness(user: User) {
  const ref = doc(db, "businesses", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    name: "Ivan Silva Surf School",
    slug: generateSlug("Ivan Silva Surf School"),
    type: "surf",
    ownerUid: user.uid,
    ownerEmail: user.email,
    status: "active",
    settings: {
      timezone: "America/Sao_Paulo",
      currency: "BRL",
      weekdayStart: 1,
      slotDurationMinutes: 60,
      operatingHours: Object.fromEntries(
        [0, 1, 2, 3, 4, 5, 6].map((d) => [d, { start: "05:00", end: "18:00", active: true }])
      ),
      emailNotifications: true,
      weeklyReportEmail: user.email,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Listener inicializado apenas uma vez em todo o app
let authListenerStarted = false;

function startAuthListener() {
  if (authListenerStarted) return;
  authListenerStarted = true;

  const { setUser, setRole, setLoading } = useAuthStore.getState();
  setLoading(true);

  auth.authStateReady().then(() => {
    onAuthChange(async (user) => {
      useAuthStore.getState().setUser(user);

      if (user) {
        if (isAdminUser(user)) {
          useAuthStore.getState().setRole("admin");
          await ensureAdminBusiness(user).catch(console.error);
        } else {
          useAuthStore.getState().setRole("student");
        }
      } else {
        useAuthStore.getState().setRole(null);
      }

      useAuthStore.getState().setLoading(false);
    });
  });
}

export function useAuth() {
  useEffect(() => {
    startAuthListener();
  }, []);

  const { user, role, loading } = useAuthStore();
  return { user, role, loading, isAdmin: isAdminUser(user) };
}
