"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useStudentReservations } from "@/hooks/useStudentReservations";
import { CircleNotch, Check, User, Phone, Calendar } from "@phosphor-icons/react";
import type { Customer } from "@/types/customer";

export default function PerfilPage() {
  const { user } = useStudentReservations();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const businessId = process.env.NEXT_PUBLIC_BUSINESS_ID!;

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, `businesses/${businessId}/customers/${user.uid}`))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as Customer;
          setCustomer(data);
          setName(data.name ?? "");
          setPhone(data.phone ?? "");
          setBirthDate(data.birthDate ?? "");
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user, businessId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!phone.trim() || !birthDate) {
      setError("Preencha telefone e data de nascimento.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await setDoc(doc(db, `businesses/${businessId}/customers/${user.uid}`), {
        name: name.trim(),
        phone: phone.trim(),
        birthDate,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const isComplete = !!customer?.phone && !!customer?.birthDate;

  return (
    <div className="rise" style={{ maxWidth: "480px" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 className="font-display" style={{ fontSize: "1.9rem", color: "var(--text-1)" }}>Meu perfil</h1>
        <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-2)" }}>Mantenha seus dados atualizados</p>
      </header>

      {!isComplete && !loading && (
        <div style={{
          background: "rgba(245,192,48,0.08)",
          border: "1px solid rgba(245,192,48,0.3)",
          borderRadius: "12px",
          padding: "14px 16px",
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
        }}>
          <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>⚠</span>
          <div>
            <p style={{ fontSize: "13.5px", color: "var(--gold)", fontWeight: 700 }}>Perfil incompleto</p>
            <p style={{ fontSize: "12.5px", color: "var(--text-2)", marginTop: "2px" }}>
              Adicione seu telefone e data de nascimento para continuar.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
          <CircleNotch size={24} className="ph-spin" style={{ color: "var(--ocean)" }} />
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Nome */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={12} /> Nome
              </label>
              <input
                type="text"
                className="warm-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            {/* Telefone */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: "6px" }}>
                <Phone size={12} /> Telefone / WhatsApp
                {!customer?.phone && <span style={{ color: "var(--gold)", fontSize: "10px", fontWeight: 700 }}>obrigatório</span>}
              </label>
              <input
                type="tel"
                className="warm-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            {/* Data de nascimento */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={12} /> Data de nascimento
                {!customer?.birthDate && <span style={{ color: "var(--gold)", fontSize: "10px", fontWeight: 700 }}>obrigatório</span>}
              </label>
              <input
                type="date"
                className="warm-input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={{ colorScheme: "dark" }}
              />
            </div>

            {/* Email (somente leitura) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                E-mail
              </label>
              <input
                type="email"
                className="warm-input"
                value={user?.email ?? ""}
                readOnly
                style={{ opacity: 0.5, cursor: "not-allowed" }}
              />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "var(--red)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)", borderRadius: "8px", padding: "10px 14px" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ height: "46px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {saving ? <CircleNotch size={16} className="ph-spin" /> : saved ? <Check size={16} weight="bold" /> : null}
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar perfil"}
          </button>
        </form>
      )}

      <style>{`
        .ph-spin { animation: ph-spin 0.9s linear infinite; }
        @keyframes ph-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
