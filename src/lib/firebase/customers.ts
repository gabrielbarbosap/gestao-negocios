// ════════════════════════════════════════════════════════════════════════
//  CUSTOMERS — alunos (saldo de créditos, perfil)
//  Coleção: businesses/{businessId}/customers/{customerId}
// ════════════════════════════════════════════════════════════════════════
import { doc, getDoc } from "firebase/firestore";
import { db } from "./config";
import { queryDocuments, orderBy } from "./firestore";
import type { Customer } from "@/types/customer";

function customersPath(businessId: string) {
  return `businesses/${businessId}/customers`;
}

export async function listCustomers(businessId: string): Promise<Customer[]> {
  return queryDocuments<Customer>(customersPath(businessId), orderBy("name"));
}

// Saldo de créditos do aluno (0 se ainda não houver cadastro).
export async function fetchCredits(businessId: string, customerId: string): Promise<number> {
  const snap = await getDoc(doc(db, customersPath(businessId), customerId));
  return snap.exists() ? (snap.data().creditBalance ?? 0) : 0;
}
