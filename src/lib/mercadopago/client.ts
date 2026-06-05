import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export const mpPayment = new Payment(client);
export const mpPreference = new Preference(client);

export interface CreatePreferenceInput {
  title: string;
  quantity: number;
  unitPrice: number;
  payerEmail: string;
  externalReference: string;
  installments?: number;
}

export async function createPaymentPreference(input: CreatePreferenceInput) {
  const preference = await mpPreference.create({
    body: {
      items: [
        {
          id: input.externalReference,
          title: input.title,
          quantity: input.quantity,
          unit_price: input.unitPrice,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: input.payerEmail,
      },
      payment_methods: {
        installments: input.installments ?? 1,
        excluded_payment_types: [],
      },
      external_reference: input.externalReference,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/falha`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/pendente`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    },
  });
  return preference;
}
