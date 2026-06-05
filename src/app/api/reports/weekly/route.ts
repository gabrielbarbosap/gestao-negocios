import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyReport } from "@/lib/resend/client";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, toEmail, businessName } = await req.json();

    const lastWeek = subWeeks(new Date(), 1);
    const weekStart = format(startOfWeek(lastWeek, { locale: ptBR }), "dd/MM/yyyy");
    const weekEnd = format(endOfWeek(lastWeek, { locale: ptBR }), "dd/MM/yyyy");

    await sendWeeklyReport({
      businessName,
      toEmail,
      weekStart,
      weekEnd,
      totalSessions: 0,
      totalRevenue: 0,
      busiestSlot: "—",
      mostActiveStudents: [],
      cancellations: 0,
      noShows: 0,
      activeStudents: 0,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Weekly report error:", error);
    return NextResponse.json({ error: "Failed to send report" }, { status: 500 });
  }
}
