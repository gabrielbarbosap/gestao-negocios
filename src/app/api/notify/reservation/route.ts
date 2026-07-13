import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { getLocation, type LocationId } from "@/constants/locations";
import { formatTime } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { customerName, date, startTime, endTime, location, payment } = await req.json();

    if (!customerName || !date || !startTime || !endTime || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long",
    });
    const paymentLabel = payment === "pix" ? "PIX (pagamento confirmado)" : "Parafina (já paga)";

    const text =
      `🏄 <b>Nova reserva paga!</b>\n\n` +
      `👤 ${customerName}\n` +
      `📅 ${dateLabel}\n` +
      `🕐 ${formatTime(startTime)}–${formatTime(endTime)}\n` +
      `📍 ${getLocation(location as LocationId).name}\n` +
      `💳 ${paymentLabel}`;

    await sendTelegramMessage(text);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[notify/reservation]", error);
    return NextResponse.json({ error: "Failed to notify" }, { status: 500 });
  }
}
