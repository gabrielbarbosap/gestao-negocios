import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

// Desde que ativamos allowDuplicateEmails no Firebase (pra impedir o login
// com Google apagar a senha de contas existentes — ver commit anterior),
// um mesmo e-mail pode acabar com mais de uma conta (uid) no Firebase Auth,
// uma por método de login. Esse endpoint checa se já existe outro cadastro
// (customer doc) com o mesmo e-mail sob um uid diferente, pra avisar o
// aluno em vez de deixá-lo continuar numa conta nova e vazia.
export async function POST(req: NextRequest) {
  try {
    const { email, uid } = await req.json();
    if (!email || !uid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const businessId = process.env.NEXT_PUBLIC_BUSINESS_ID!;
    const snap = await adminDb
      .collection(`businesses/${businessId}/customers`)
      .where("email", "==", email)
      .get();

    const duplicate = snap.docs.some((d) => d.id !== uid);
    return NextResponse.json({ duplicate });
  } catch (error) {
    console.error("[auth/check-duplicate-account]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
