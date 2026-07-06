// Dados para pagamento via PIX (não há integração automática — o aluno paga
// manualmente e envia o comprovante pelo WhatsApp).
export const PIX_KEY_CPF = "70459505432";
export const PIX_KEY_CPF_FORMATTED = "704.595.054-32";

export const PIX_AMOUNT = 100;
export const PIX_AMOUNT_FORMATTED = "R$ 100,00";

export const WHATSAPP_PHONE = "5581986610065";
export const WHATSAPP_PHONE_FORMATTED = "(81) 98661-0065";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

export const PIX_RECEIPT_MESSAGE =
  `Olá! Segue o comprovante do pagamento via PIX (${PIX_AMOUNT_FORMATTED}) da minha aula de surf.`;

export const PIX_RECEIPT_WHATSAPP_LINK = whatsappLink(PIX_RECEIPT_MESSAGE);
