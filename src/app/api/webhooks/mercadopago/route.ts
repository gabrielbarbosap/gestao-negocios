import { NextRequest, NextResponse } from "next/server";
import { mpPayment } from "@/lib/mercadopago/client";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) return NextResponse.json({ ok: true });

    const payment = await mpPayment.get({ id: paymentId });

    const externalRef = payment.external_reference;
    if (!externalRef) return NextResponse.json({ ok: true });

    const [businessId, paymentDocId] = externalRef.split("|");
    if (!businessId || !paymentDocId) return NextResponse.json({ ok: true });

    const status = payment.status === "approved" ? "approved" : payment.status ?? "pending";

    await updateDoc(doc(db, "businesses", businessId, "payments", paymentDocId), {
      status,
      mercadoPagoPaymentId: String(paymentId),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook MP error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
