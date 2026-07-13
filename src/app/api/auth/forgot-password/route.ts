import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { sendPasswordResetEmail } from "@/lib/resend/client";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    try {
      const resetLink = await adminAuth.generatePasswordResetLink(email);
      await sendPasswordResetEmail({ toEmail: email, resetLink });
    } catch (e) {
      // Não revela se o e-mail existe ou não na base (evita enumeração de contas).
      console.error("[auth/forgot-password]", e);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth/forgot-password]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
