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

// Botão flutuante de contato (landing + área do aluno).
export const WHATSAPP_CONTACT_MESSAGE = "Olá! Tenho uma dúvida sobre as aulas de surf.";
export const WHATSAPP_CONTACT_LINK = whatsappLink(WHATSAPP_CONTACT_MESSAGE);

// Aula paga via PIX e cancelada: não gera parafina automaticamente, o
// reembolso do valor é combinado direto com o Ivan pelo WhatsApp.
export const PIX_REFUND_MESSAGE =
  "Olá! Cancelei uma aula que paguei via PIX e gostaria de solicitar o reembolso do valor.";
export const PIX_REFUND_WHATSAPP_LINK = whatsappLink(PIX_REFUND_MESSAGE);
