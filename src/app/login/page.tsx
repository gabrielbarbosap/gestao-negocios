"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, signInWithGoogle, auth, onAuthStateChanged } from "@/lib/firebase/auth";
// auth e onAuthStateChanged usados em LoginPage (fora do Suspense)
import { isAdminUser } from "@/hooks/useAuth";

const schema = z.object({
 email: z.string().email("E-mail inválido"),
 password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

function GoogleIcon() {
 return (
 <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
 <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
 <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
 <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
 <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
 </svg>
 );
}

function Divider() {
 return (
 <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "4px 0" }}>
 <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
 <span style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.05em" }}>OU</span>
 <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
 </div>
 );
}

function LoginForm() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const redirectTo = searchParams.get("redirect") ?? "/aluno";

 const [error, setError] = useState("");
 const [googleLoading, setGoogleLoading] = useState(false);

 const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
 resolver: zodResolver(schema),
 });

 // ── Email / senha ───────────────────────────────────────────────────────
 async function onSubmit(data: FormData) {
 try {
 setError("");
 const credential = await signIn(data.email, data.password);
 router.push(isAdminUser(credential.user) ? "/admin" : redirectTo);
 } catch {
 setError("E-mail ou senha incorretos.");
 }
 }

 // ── Google ──────────────────────────────────────────────────────────────
 function handleGoogle() {
 setError("");
 setGoogleLoading(true);

 // Quando o popup fecha, a janela principal recupera o foco.
 // Fazemos reload para o Firebase ler o auth do storage e redirecionar.
 let done = false;
 const onPopupClose = () => {
 if (done) return;
 done = true;
 setTimeout(() => window.location.reload(), 400);
 };
 window.addEventListener("focus", onPopupClose, { once: true });

 signInWithGoogle()
 .then(onPopupClose)
 .catch((err: unknown) => {
 const code = (err as { code?: string })?.code ?? "";
 if (code === "auth/popup-blocked") {
 window.removeEventListener("focus", onPopupClose);
 setError("Popup bloqueado. Permita popups para este site.");
 setGoogleLoading(false);
 }
 // Outros erros (COOP, popup-closed-by-user): o focus handler faz o reload.
 });
 }

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
 {redirectTo !== "/aluno" ? "Entre para continuar o agendamento " : "Bem-vindo de volta"}
 </p>
 </div>

 <div className="card" style={{ padding: "28px" }}>
 <h1 className="font-display" style={{ fontSize: "1.5rem", color: "var(--text-1)", marginBottom: "20px" }}>
 Entrar
 </h1>

 {/* Google */}
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

 <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" }}>
 <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
 <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
 E-mail
 </label>
 <input type="email" placeholder="seu@email.com" className="warm-input" {...register("email")} />
 {errors.email && <p style={{ fontSize: "12px", color: "var(--red)" }}>{errors.email.message}</p>}
 </div>

 <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
 <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
 Senha
 </label>
 <input type="password" placeholder="••••••••" className="warm-input" {...register("password")} />
 {errors.password && <p style={{ fontSize: "12px", color: "var(--red)" }}>{errors.password.message}</p>}
 </div>

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
 {isSubmitting ? "Entrando..." : "Entrar"}
 </button>
 </form>
 </div>

 <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>
 Não tem conta?{" "}
 <Link href={`/registro?redirect=${encodeURIComponent(redirectTo)}`} style={{ color: "var(--ocean)", fontWeight: 700 }}>
 Criar conta
 </Link>
 </p>
 </div>
 </main>
 );
}

export default function LoginPage() {
 const router = useRouter();

 // Listener fora do Suspense — não é cancelado durante o fluxo do popup.
 useEffect(() => {
 const unsub = onAuthStateChanged(auth, (user) => {
 if (user) {
 unsub();
 router.push(isAdminUser(user) ? "/admin" : "/aluno");
 }
 });
 return unsub;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 return (
 <Suspense>
 <LoginForm />
 </Suspense>
 );
}
