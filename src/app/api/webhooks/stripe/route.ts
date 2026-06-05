import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe/webhook] Invalid signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { customerId, businessId, credits } = session.metadata ?? {};

  if (!customerId || !businessId || !credits) {
    console.error("[stripe/webhook] Missing metadata", session.metadata);
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const creditsNum = parseInt(credits, 10);

  await adminDb
    .doc(`businesses/${businessId}/customers/${customerId}`)
    .set({
      creditBalance: FieldValue.increment(creditsNum),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

  // Busca nome do cliente para exibição no dashboard
  const customerSnap = await adminDb
    .doc(`businesses/${businessId}/customers/${customerId}`)
    .get();
  const customerName = customerSnap.exists ? (customerSnap.data()?.name ?? "Aluno") : "Aluno";

  const packageLabels: Record<number, string> = { 1: "Aula avulsa", 4: "Pacote 4 aulas", 8: "Pacote 8 aulas" };
  const description = packageLabels[creditsNum] ?? `${creditsNum} crédito${creditsNum > 1 ? "s" : ""}`;

  await adminDb.collection(`businesses/${businessId}/payments`).add({
    customerId,
    customerName,
    businessId,
    stripeSessionId: session.id,
    creditsGranted: creditsNum,
    amount: (session.amount_total ?? 0) / 100,   // converte centavos → reais
    status: "approved",
    method: "credit_card",
    type: "package",
    description,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
