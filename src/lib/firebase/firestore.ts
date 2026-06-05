import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

export { serverTimestamp, Timestamp };

export function businessRef(businessId: string) {
  return doc(db, "businesses", businessId);
}

export function customersRef(businessId: string) {
  return collection(db, "businesses", businessId, "customers");
}

export function sessionsRef(businessId: string) {
  return collection(db, "businesses", businessId, "sessions");
}

export function attendancesRef(businessId: string) {
  return collection(db, "businesses", businessId, "attendances");
}

export function progressLogsRef(businessId: string) {
  return collection(db, "businesses", businessId, "progress-logs");
}

export function paymentsRef(businessId: string) {
  return collection(db, "businesses", businessId, "payments");
}

export function packagesRef(businessId: string) {
  return collection(db, "businesses", businessId, "packages");
}

export async function getDocument<T>(path: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, path, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export async function queryDocuments<T>(
  path: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, path), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function createDocument<T extends WithFieldValue<DocumentData>>(
  path: string,
  data: T
): Promise<string> {
  const ref = await addDoc(collection(db, path), data);
  return ref.id;
}

export async function setDocument<T extends WithFieldValue<DocumentData>>(
  path: string,
  id: string,
  data: T
): Promise<void> {
  await setDoc(doc(db, path, id), data);
}

export async function updateDocument(
  path: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> {
  await updateDoc(doc(db, path, id), data);
}

export async function deleteDocument(path: string, id: string): Promise<void> {
  await deleteDoc(doc(db, path, id));
}

export { where, orderBy, limit, query, collection, doc, getDoc, getDocs, addDoc, setDoc };
