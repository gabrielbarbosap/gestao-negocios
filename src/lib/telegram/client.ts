// Notificações para o(s) admin(s) via bot do Telegram — grátis, sem
// aprovação de template (ao contrário do WhatsApp Business API).
// TELEGRAM_ADMIN_CHAT_IDS aceita uma lista separada por vírgula, pra Ivan
// e Gabriel receberem o mesmo aviso.
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_ADMIN_CHAT_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!token || chatIds.length === 0) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN ou TELEGRAM_ADMIN_CHAT_IDS não configurados — notificação ignorada");
    return;
  }

  await Promise.all(
    chatIds.map(async (chatId) => {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });
      if (!res.ok) {
        console.error("[telegram] falha ao enviar para", chatId, await res.text());
      }
    }),
  );
}
