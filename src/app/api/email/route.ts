import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, sendReservationEmail, sendCancellationEmail } from "@/lib/resend/client";
import { getLocation, type LocationId } from "@/constants/locations";
import { formatTime } from "@/lib/utils";

function dateLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    switch (body.type) {
      case "welcome": {
        const { toEmail, toName } = body;
        if (!toEmail) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        await sendWelcomeEmail({ toEmail, toName: toName || "Surfista" });
        break;
      }

      case "reservation": {
        const { toEmail, toName, date, startTime, endTime, location, payment } = body;
        if (!toEmail || !date || !startTime || !endTime || !location) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        await sendReservationEmail({
          toEmail,
          toName: toName || "Surfista",
          dateLabel: dateLabel(date),
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
          locationName: getLocation(location as LocationId).name,
          payment: payment === "pix" ? "pix" : "credit",
        });
        break;
      }

      case "cancellation": {
        const { toEmail, toName, date, startTime, endTime, location, creditRefunded } = body;
        if (!toEmail || !date || !startTime || !endTime || !location) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        await sendCancellationEmail({
          toEmail,
          toName: toName || "Surfista",
          dateLabel: dateLabel(date),
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
          locationName: getLocation(location as LocationId).name,
          creditRefunded: !!creditRefunded,
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[email]", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
