import { NextRequest, NextResponse } from "next/server";
import { createInfinitePayLink, encodeOrderNsu } from "@/lib/infinitepay/client";

// Conta de teste: para este e-mail o Pix sai por R$ 1,00 (validar o fluxo
// ponta-a-ponta sem pagar o valor cheio). Definido no servidor pra não
// depender do cliente.
const TEST_EMAIL = "semvolta1212@gmail.com";
const TEST_AMOUNT_IN_REAIS = 1;

// Cria o link de pagamento InfinitePay para uma reserva já existente (aula
// avulsa paga via Pix). Devolve a URL de checkout pra redirecionar o aluno.
export async function POST(req: NextRequest) {
  try {
    const { businessId, reservationId, amountInReais, description, customerName, customerEmail } =
      await req.json();

    if (!businessId || !reservationId || !amountInReais) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const finalAmount =
      customerEmail?.toLowerCase() === TEST_EMAIL ? TEST_AMOUNT_IN_REAIS : Number(amountInReais);

    const { url } = await createInfinitePayLink({
      amountInReais: finalAmount,
      description: description ?? "Aula de surf",
      orderNsu: encodeOrderNsu(businessId, reservationId),
      customerName,
      customerEmail,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[infinitepay/checkout]", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
