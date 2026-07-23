// ════════════════════════════════════════════════════════════════════════
//  INFINITEPAY — Checkout Integrado (Pix / cartão)
//  A InfinitePay não tem "gerar QR Pix" puro: cria-se um LINK de pagamento
//  e redireciona o cliente pra tela deles. A "credencial" é a própria handle
//  (InfiniteTag), não há token/secret. O webhook NÃO é assinado — por isso
//  toda confirmação passa por `checkInfinitePayPayment` antes de liberar algo.
//  Docs: https://ajuda.infinitepay.io/pt-BR/articles/10766888
// ════════════════════════════════════════════════════════════════════════
const BASE_URL = "https://api.checkout.infinitepay.io";

function handle(): string {
  const h = process.env.INFINITEPAY_HANDLE;
  if (!h) throw new Error("INFINITEPAY_HANDLE não configurado");
  return h;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

// order_nsu carrega o que precisamos pra localizar a reserva no webhook,
// já que a InfinitePay só devolve o order_nsu (não metadados livres).
export function encodeOrderNsu(businessId: string, reservationId: string): string {
  return `${businessId}|${reservationId}`;
}

export function decodeOrderNsu(orderNsu: string): { businessId: string; reservationId: string } {
  const [businessId, reservationId] = orderNsu.split("|");
  return { businessId, reservationId };
}

export interface CreateLinkInput {
  amountInReais: number; // ex.: 100 → enviado como 10000 centavos
  description: string;
  orderNsu: string;
  redirectUrl?: string;
  customerName?: string;
  customerEmail?: string;
}

// POST /links → devolve a URL de checkout pra onde o cliente é redirecionado.
export async function createInfinitePayLink(input: CreateLinkInput): Promise<{ url: string }> {
  const customer =
    input.customerName || input.customerEmail
      ? { name: input.customerName, email: input.customerEmail }
      : undefined;

  const res = await fetch(`${BASE_URL}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: handle(),
      redirect_url: input.redirectUrl ?? `${appUrl()}/aluno?pix=sucesso`,
      webhook_url: `${appUrl()}/api/webhooks/infinitepay`,
      order_nsu: input.orderNsu,
      customer,
      items: [
        {
          quantity: 1,
          price: Math.round(input.amountInReais * 100), // centavos
          description: input.description,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`InfinitePay /links ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as { url: string };
}

export interface PaymentCheckResult {
  success?: boolean;
  paid: boolean;
  amount?: number;       // centavos
  paid_amount?: number;  // centavos
  installments?: number;
  capture_method?: string; // "pix" | "credit_card"
}

// POST /payment_check → fonte da verdade. Nunca confie só no webhook.
export async function checkInfinitePayPayment(params: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}): Promise<PaymentCheckResult> {
  const res = await fetch(`${BASE_URL}/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: handle(),
      order_nsu: params.orderNsu,
      transaction_nsu: params.transactionNsu,
      slug: params.slug,
    }),
  });

  if (!res.ok) {
    throw new Error(`InfinitePay /payment_check ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as PaymentCheckResult;
}
