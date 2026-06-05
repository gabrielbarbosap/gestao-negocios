import { NextRequest, NextResponse } from "next/server";
import { createPaymentPreference } from "@/lib/mercadopago/client";

export async function POST(req: NextRequest) {
  try {
    const { title, unitPrice, payerEmail, externalReference, installments } = await req.json();

    if (!title || !unitPrice || !payerEmail || !externalReference) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const preference = await createPaymentPreference({
      title,
      quantity: 1,
      unitPrice,
      payerEmail,
      externalReference,
      installments,
    });

    return NextResponse.json({ preferenceId: preference.id, initPoint: preference.init_point });
  } catch (error) {
    console.error("Create preference error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
