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
    .update({
      creditBalance: FieldValue.increment(creditsNum),
      updatedAt: FieldValue.serverTimestamp(),
    });

  await adminDb.collection(`businesses/${businessId}/payments`).add({
    customerId,
    businessId,
    stripeSessionId: session.id,
    credits: creditsNum,
    amountTotal: session.amount_total,
    status: "approved",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
