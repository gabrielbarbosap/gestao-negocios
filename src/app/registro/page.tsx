"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp, auth, onAuthStateChanged } from "@/lib/firebase/auth";
// Cadastro com Google temporariamente desativado — ver handleGoogle comentado abaixo.
// import { signInWithGoogle, logout } from "@/lib/firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { PasswordInput } from "@/components/ui/password-input";

const schema = z.object({
  name:     z.string().min(2, "Mínimo 2 caracteres"),
  email:    z.string().email("E-mail inválido"),
  phone:    z.string().min(8, "Informe um telefone válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

// Cadastro com Google temporariamente desativado.
// function GoogleIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
//       <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
//       <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
//       <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
//       <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
//     </svg>
//   );
// }
//
// function Divider() {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "4px 0" }}>
//       <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
//       <span style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.05em" }}>OU</span>
//       <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
//     </div>
//   );
// }

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect") ?? "/aluno";

  const [error, setError]                 = useState("");
  // Cadastro com Google temporariamente desativado.
  // const [googleLoading, setGoogleLoading] = useState(false);
  // const googleLoadingRef = useRef(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });


  // ── Email / senha ───────────────────────────────────────────────────────
  async function createCustomerDoc(uid: string, name: string, email: string, phone: string) {
    const businessId = process.env.NEXT_PUBLIC_BUSINESS_ID!;
    await setDoc(doc(db, `businesses/${businessId}/customers/${uid}`), {
      businessId,
      name,
      email,
      phone,
      status: "active",
      creditBalance: 0,
      xp: 0,
      level: "Iniciante",
      achievements: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    if (email) {
      try {
        await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "welcome", toEmail: email, toName: name }),
        });
      } catch (e) {
        console.error("[email]", e);
      }
    }
  }

  async function onSubmit(data: FormData) {
    if (isSubmitting) return;
    try {
      setError("");
      const credential = await signUp(data.email, data.password);
      await createCustomerDoc(credential.user.uid, data.name, data.email, data.phone.trim());
      router.push(redirectTo);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("email-already-in-use")) {
        setError("Este e-mail já está em uso.");
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
    }
  }

  // ── Google (desativado por enquanto) ─────────────────────────────────────
  // function handleGoogle() {
  //   if (googleLoadingRef.current) return;
  //   googleLoadingRef.current = true;
  //   setError("");
  //   setGoogleLoading(true);
  //
  //   let done = false;
  //   const onPopupClose = () => {
  //     if (done) return;
  //     done = true;
  //     setTimeout(() => window.location.reload(), 400);
  //   };
  //   window.addEventListener("focus", onPopupClose, { once: true });
  //
  //   signInWithGoogle()
  //     .then(async (credential) => {
  //       const u = credential.user;
  //       if (!u.email) {
  //         // O Google não devolveu e-mail — normalmente é sinal de que esse
  //         // e-mail já pertence a outra conta (o Firebase omite o e-mail
  //         // nesse caso, em vez de expor o conflito). Não criamos cadastro
  //         // com e-mail vazio: orientamos a usar a conta original.
  //         await logout();
  //         googleLoadingRef.current = false;
  //         setError("Não conseguimos confirmar o e-mail dessa conta Google — você provavelmente já tem um cadastro com esse e-mail. Tente entrar com e-mail e senha.");
  //         setGoogleLoading(false);
  //         return;
  //       }
  //       await createCustomerDoc(u.uid, u.displayName ?? u.email, u.email);
  //       onPopupClose();
  //     })
  //     .catch((err: unknown) => {
  //       googleLoadingRef.current = false;
  //       const code = (err as { code?: string })?.code ?? "";
  //       if (code === "auth/popup-blocked") {
  //         window.removeEventListener("focus", onPopupClose);
  //         setError("Popup bloqueado. Permita popups para este site.");
  //         setGoogleLoading(false);
  //       } else if (code === "auth/account-exists-with-different-credential") {
  //         window.removeEventListener("focus", onPopupClose);
  //         setError("Esse e-mail já tem uma conta cadastrada com senha. Entre com e-mail e senha em vez de criar uma conta nova.");
  //         setGoogleLoading(false);
  //       }
  //     });
  // }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
      <div aria-hidden style={{
        position: "fixed", top: "-60px", right: "-80px",
        width: "440px", height: "360px", pointerEvents: "none",
        background: "radial-gradient(ellipse, rgba(0,180,200,0.1) 0%, transparent 65%)",
      }} />

      <div className="rise" style={{ width: "100%", maxWidth: "360px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: "28px", textAlign: "center" }}>
          <Link href="/" className="font-display" style={{ fontSize: "1.5rem", color: "var(--text-1)", display: "inline-block" }}>
            Ivan Silva Surf School
          </Link>
          <p style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-3)" }}>
            Crie sua conta para agendar aulas
          </p>
        </div>

        <div className="card" style={{ padding: "28px" }}>
          <h1 className="font-display" style={{ fontSize: "1.5rem", color: "var(--text-1)", marginBottom: "20px" }}>
            Criar conta
          </h1>

          {/* Cadastro com Google temporariamente desativado.
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              width: "100%", height: "44px", borderRadius: "8px",
              background: "var(--bg-3)", border: "1px solid var(--border)",
              color: "var(--text-1)", fontSize: "14px", fontWeight: 600,
              cursor: googleLoading ? "not-allowed" : "pointer",
              opacity: googleLoading ? 0.6 : 1,
              transition: "border-color 0.15s, background 0.15s",
              fontFamily: "inherit", marginBottom: "16px",
            }}
            onMouseEnter={e => { if (!googleLoading) { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-lit)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-4)"; }}}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-3)"; }}
          >
            <GoogleIcon />
            {googleLoading ? "Aguarde..." : "Continuar com Google"}
          </button>

          <Divider />
          */}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" }}>
            {[
              { label: "Seu nome",           name: "name"     as const, type: "text",     placeholder: "João Silva"        },
              { label: "E-mail",             name: "email"    as const, type: "email",    placeholder: "seu@email.com"     },
              { label: "Telefone / WhatsApp", name: "phone"   as const, type: "tel",      placeholder: "(11) 99999-9999"   },
              { label: "Senha",              name: "password" as const, type: "password", placeholder: "••••••••"          },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {label}
                </label>
                {type === "password" ? (
                  <PasswordInput required placeholder={placeholder} className="warm-input" {...register(name)} />
                ) : (
                  <input type={type} required placeholder={placeholder} className="warm-input" {...register(name)} />
                )}
                {errors[name] && <p style={{ fontSize: "12px", color: "var(--red)" }}>{errors[name]?.message}</p>}
              </div>
            ))}

            {error && (
              <p style={{ fontSize: "13px", color: "var(--red)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)", borderRadius: "7px", padding: "9px 12px" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ height: "44px", width: "100%", fontSize: "14px" }}
            >
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        </div>

        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>
          Já tem conta?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} style={{ color: "var(--ocean)", fontWeight: 700 }}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  // Listener fora do Suspense — não é cancelado durante o fluxo do popup.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        router.push("/aluno");
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
