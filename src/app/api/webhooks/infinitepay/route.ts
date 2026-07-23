import { NextRequest, NextResponse } from "next/server";
import { checkInfinitePayPayment, decodeOrderNsu } from "@/lib/infinitepay/client";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// Webhook de confirmação de pagamento da InfinitePay.
// IMPORTANTE: o payload não é assinado — sempre reconfirmamos via
// payment_check antes de dar a reserva como paga. Substitui o antigo
// "Já fiz o pagamento" (auto-declarado pelo aluno, sem verificação).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderNsu: string | undefined = body.order_nsu;
    const transactionNsu: string | undefined = body.transaction_nsu;
    const slug: string | undefined = body.invoice_slug ?? body.slug;

    if (!orderNsu || !transactionNsu || !slug) {
      return NextResponse.json({ success: true, message: "ignored" });
    }

    // 1) Fonte da verdade: confirma o pagamento direto na InfinitePay.
    const check = await checkInfinitePayPayment({ orderNsu, transactionNsu, slug });
    if (!check.paid) {
      return NextResponse.json({ success: true, message: "not paid" });
    }

    const { businessId, reservationId } = decodeOrderNsu(orderNsu);
    if (!businessId || !reservationId) {
      return NextResponse.json({ success: true, message: "invalid order" });
    }

    const ref = adminDb.doc(`businesses/${businessId}/reservations/${reservationId}`);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: true, message: "reservation not found" });
    }

    const reservation = snap.data()!;

    // 2) Idempotência: só age em reserva pix ainda pendente. Se já confirmou
    //    (webhook repetido), não faz nada e não notifica de novo.
    if (reservation.payment !== "pix" || reservation.status !== "reserved") {
      return NextResponse.json({ success: true, message: "already processed" });
    }

    // 3) Marca a reserva como paga/confirmada.
    await ref.update({
      status: "confirmed",
      infinitePayTransactionNsu: transactionNsu,
      infinitePaySlug: slug,
      infinitePayPaidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 4) Notifica o admin (Telegram) — best-effort, não bloqueia a resposta.
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify/reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: reservation.customerName,
          customerId: reservation.customerId,
          businessId,
          date: reservation.date,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          location: reservation.location,
          payment: "pix",
        }),
      });
    } catch (e) {
      console.error("[infinitepay/webhook] notify falhou:", e);
    }

    return NextResponse.json({ success: true, message: null });
  } catch (error) {
    console.error("[infinitepay/webhook]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
