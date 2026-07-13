"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});
type FormData = z.infer<typeof schema>;

export default function EsqueciSenhaPage() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true);
    } catch {
      setError("Não foi possível enviar agora. Tente novamente em instantes.");
    }
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
            Recupere o acesso à sua conta
          </p>
        </div>

        <div className="card" style={{ padding: "28px" }}>
          <h1 className="font-display" style={{ fontSize: "1.5rem", color: "var(--text-1)", marginBottom: "8px" }}>
            Esqueci minha senha
          </h1>

          {sent ? (
            <p style={{ fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.6 }}>
              Se esse e-mail estiver cadastrado, enviamos um link pra redefinir a senha.
              Confira também a caixa de spam.
            </p>
          ) : (
            <>
              <p style={{ fontSize: "13.5px", color: "var(--text-2)", marginBottom: "20px" }}>
                Digite o e-mail da sua conta e enviaremos um link pra você criar uma senha nova.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    E-mail
                  </label>
                  <input type="email" required placeholder="seu@email.com" className="warm-input" {...register("email")} />
                  {errors.email && <p style={{ fontSize: "12px", color: "var(--red)" }}>{errors.email.message}</p>}
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
                  {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>
          <Link href="/login" style={{ color: "var(--ocean)", fontWeight: 700 }}>
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
