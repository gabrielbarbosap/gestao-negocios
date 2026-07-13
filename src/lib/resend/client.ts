import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@gestaosurf.com.br";
const BRAND_NAME = "Ivan Silva Surf School";

function wrapEmailHtml(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="color: #0ea5e9;">${title}</h1>
      ${bodyHtml}
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        ${BRAND_NAME} — enviado automaticamente pelo sistema de gestão.
      </p>
    </div>
  `;
}

// ─── Boas-vindas (cadastro) ────────────────────────────────────────────────
export interface WelcomeEmailData {
  toEmail: string;
  toName: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const html = wrapEmailHtml(`Bem-vindo(a), ${data.toName}! 🏄`, `
    <p>Sua conta na ${BRAND_NAME} foi criada com sucesso.</p>
    <p>Agora você já pode agendar suas aulas de surf em Maracaipe ou na Praia do Borete.</p>
  `);

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: `Bem-vindo(a) à ${BRAND_NAME}!`,
    html,
  });

  if (error) throw new Error(error.message);
}

// ─── Reserva criada (crédito já confirmada, pix aguardando pagamento) ──────
export interface ReservationEmailData {
  toEmail: string;
  toName: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  locationName: string;
  payment: "credit" | "pix";
}

export async function sendReservationEmail(data: ReservationEmailData) {
  const isPix = data.payment === "pix";

  const details = `
    <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <strong>📅 ${data.dateLabel}</strong><br/>
      <strong>🕐 ${data.startTime}–${data.endTime}</strong><br/>
      <strong>📍 ${data.locationName}</strong>
    </div>
  `;

  const html = wrapEmailHtml(isPix ? "Reserva recebida!" : "Aula confirmada! 🏄", `
    <p>Olá, ${data.toName}! Sua aula foi ${isPix ? "reservada" : "confirmada"}:</p>
    ${details}
    ${isPix
      ? `<p><strong>Falta pagar!</strong> Pague R$ 100,00 via PIX (chave CPF 704.595.054-32), envie o comprovante pelo WhatsApp (81) 98661-0065 e marque "Já fiz o pagamento" na sua aula — só assim ela fica confirmada. O horário já está reservado pra você.</p>`
      : `<p>Foi usada 1 parafina do seu saldo. Nos vemos na praia!</p>`
    }
  `);

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: isPix ? "Reserva recebida — falta pagar" : "Aula confirmada!",
    html,
  });

  if (error) throw new Error(error.message);
}

// ─── Reserva cancelada ──────────────────────────────────────────────────────
export interface CancellationEmailData {
  toEmail: string;
  toName: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  locationName: string;
  creditRefunded: boolean;
}

export async function sendCancellationEmail(data: CancellationEmailData) {
  const details = `
    <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <strong>📅 ${data.dateLabel}</strong><br/>
      <strong>🕐 ${data.startTime}–${data.endTime}</strong><br/>
      <strong>📍 ${data.locationName}</strong>
    </div>
  `;

  const html = wrapEmailHtml("Aula cancelada", `
    <p>Olá, ${data.toName}. Sua aula foi cancelada:</p>
    ${details}
    ${data.creditRefunded ? `<p>Sua parafina foi devolvida e já está disponível pra usar em outra aula.</p>` : ""}
  `);

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: "Aula cancelada",
    html,
  });

  if (error) throw new Error(error.message);
}

export interface WeeklyReportData {
  businessName: string;
  toEmail: string;
  weekStart: string;
  weekEnd: string;
  totalSessions: number;
  totalRevenue: number;
  busiestSlot: string;
  mostActiveStudents: Array<{ name: string; lessons: number }>;
  cancellations: number;
  noShows: number;
  activeStudents: number;
}

export async function sendWeeklyReport(data: WeeklyReportData) {
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: ` Resumo Semanal — ${data.businessName} (${data.weekStart} a ${data.weekEnd})`,
    html: buildWeeklyReportHtml(data),
  });

  if (error) throw new Error(error.message);
}

function buildWeeklyReportHtml(data: WeeklyReportData): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="color: #0ea5e9;"> Resumo Semanal</h1>
      <h2>${data.businessName}</h2>
      <p style="color: #666;">${data.weekStart} a ${data.weekEnd}</p>

      <div style="display: grid; gap: 12px; margin: 24px 0;">
        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px;">
          <strong>Aulas realizadas:</strong> ${data.totalSessions}
        </div>
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px;">
          <strong>Faturamento:</strong> R$ ${data.totalRevenue.toFixed(2)}
        </div>
        <div style="background: #fff7ed; padding: 16px; border-radius: 8px;">
          <strong>Horário mais ocupado:</strong> ${data.busiestSlot}
        </div>
        <div style="background: #fdf2f8; padding: 16px; border-radius: 8px;">
          <strong>Alunos ativos:</strong> ${data.activeStudents}
        </div>
        <div style="background: #fef2f2; padding: 16px; border-radius: 8px;">
          <strong>Cancelamentos:</strong> ${data.cancellations} | <strong>No-shows:</strong> ${data.noShows}
        </div>
      </div>

      ${
        data.mostActiveStudents.length > 0
          ? `
        <h3>Alunos mais ativos</h3>
        <ul>
          ${data.mostActiveStudents.map((s) => `<li>${s.name}: ${s.lessons} aulas</li>`).join("")}
        </ul>
      `
          : ""
      }

      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        Enviado automaticamente pelo sistema de gestão.
      </p>
    </div>
  `;
}
