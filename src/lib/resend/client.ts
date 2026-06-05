import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@gestaosurf.com.br";

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
