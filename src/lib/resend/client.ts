import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@gestaosurf.com.br";
const BRAND_NAME = "Ivan Silva Surf School";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ivansurf.partiu.life";

function wrapEmailHtml(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="color: #0ea5e9;">${title}</h1>
      ${bodyHtml}
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        ${BRAND_NAME} — bora pegar onda! 🌊
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
  const html = wrapEmailHtml(`E aí, ${data.toName}! Bem-vindo(a) 🏄`, `
    <p>Sua conta na ${BRAND_NAME} tá pronta! Agora é só escolher o horário e marcar sua aula em Maracaipe ou na Praia do Borete.</p>
    <p>Pra agendar você vai usar 1 <strong>parafina</strong> (nosso crédito de aula) — dá pra comprar com cartão de crédito, ou já reservar o horário e pagar essa aula via PIX.</p>
    <p style="margin-top: 20px;">
      <a href="${APP_URL}/aluno/agenda" style="display: inline-block; background: #0ea5e9; color: #fff; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Ver horários disponíveis
      </a>
    </p>
    <p>Qualquer dúvida é só chamar a gente no WhatsApp. Te esperamos na água!</p>
  `);

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: `Bem-vindo(a) à ${BRAND_NAME}! 🏄`,
    html,
  });

  if (error) throw new Error(error.message);
}

// ─── Reserva criada / confirmada ────────────────────────────────────────────
// payment "credit" já nasce confirmada; "pix" nasce pendente e só vira
// confirmada quando `pixConfirmed = true` (aluno clicou "Já fiz o pagamento").
export interface ReservationEmailData {
  toEmail: string;
  toName: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  locationName: string;
  payment: "credit" | "pix";
  pixConfirmed?: boolean;
}

export async function sendReservationEmail(data: ReservationEmailData) {
  const isPending = data.payment === "pix" && !data.pixConfirmed;

  const details = `
    <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <strong>📅 ${data.dateLabel}</strong><br/>
      <strong>🕐 ${data.startTime}–${data.endTime}</strong><br/>
      <strong>📍 ${data.locationName}</strong>
    </div>
  `;

  const cancellationNotice = `
    <p style="color: #666; font-size: 13px;">
      Uma coisa importante: se precisar desmarcar, dá pra cancelar até <strong>24h antes</strong> do horário da aula — depois disso não rola mais.
    </p>
  `;

  const html = wrapEmailHtml(isPending ? "Vaga garantida — falta o pagamento! 🤙" : "Aula confirmada! 🏄", `
    <p>${isPending ? `Boa, ${data.toName}! Já reservamos seu horário` : `Prontinho, ${data.toName}! Sua aula tá confirmada`}:</p>
    ${details}
    ${isPending
      ? `
        <p>Sua vaga já está garantida, mas ela só vira confirmação de verdade depois do pagamento. É rapidinho:</p>
        <ol style="padding-left: 20px; line-height: 1.8;">
          <li>Faça um PIX de <strong>R$ 100,00</strong> pra chave CPF <strong>704.595.054-32</strong></li>
          <li>Manda o comprovante no WhatsApp do Ivan: <strong>(81) 98661-0065</strong></li>
          <li>Marca "Já fiz o pagamento" na sua aula, aqui no site</li>
        </ol>
      `
      : `
        <p>${data.payment === "credit" ? "Já descontamos 1 parafina do seu saldo." : "Recebemos a confirmação do seu pagamento via PIX."} Prepara a prancha — te vemos na água! 🌊</p>
        ${cancellationNotice}
      `
    }
  `);

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: isPending ? "Vaga garantida — falta o pagamento" : "Aula confirmada! 🏄",
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
  needsManualRefund: boolean;
}

export async function sendCancellationEmail(data: CancellationEmailData) {
  const details = `
    <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <strong>📅 ${data.dateLabel}</strong><br/>
      <strong>🕐 ${data.startTime}–${data.endTime}</strong><br/>
      <strong>📍 ${data.locationName}</strong>
    </div>
  `;

  const refundNotice = data.creditRefunded
    ? `<p>Fica tranquilo(a): sua parafina já voltou pro seu saldo e tá pronta pra usar em outra aula quando quiser.</p>`
    : data.needsManualRefund
      ? `<p>Como essa aula foi paga via PIX, o reembolso não cai automático — chama o Ivan no WhatsApp <strong>(81) 98661-0065</strong> pra combinar a devolução do valor.</p>`
      : "";

  const html = wrapEmailHtml("Aula cancelada", `
    <p>Oi, ${data.toName}. Confirmando que sua aula foi cancelada:</p>
    ${details}
    ${refundNotice}
    <p>Quando quiser, é só marcar outro horário pela sua conta. Até a próxima!</p>
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
