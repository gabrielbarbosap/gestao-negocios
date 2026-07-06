// Dados para pagamento via PIX (não há integração automática — o aluno paga
// manualmente e envia o comprovante pelo WhatsApp).
export const PIX_KEY_CPF = "70459505432";
export const PIX_KEY_CPF_FORMATTED = "704.595.054-32";

export const WHATSAPP_PHONE = "5581986610065";
export const WHATSAPP_PHONE_FORMATTED = "(81) 98661-0065";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
