"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { CircleNotch } from "@phosphor-icons/react";
import { useStudentReservations } from "@/hooks/useStudentReservations";

const PACKAGES = [
 {
 priceId: "price_1Tf2aHCyFEmb0TbKWw4qUA2g",
 name: "Aula Avulsa",
 credits: 1,
 price: 100,
 pricePerClass: 100,
 highlight: false,
 badge: null,
 },
 {
 priceId: "price_1Tf2afCyFEmb0TbKtjAGlrMl",
 name: "Pacote 4 Aulas",
 credits: 4,
 price: 320,
 pricePerClass: 80,
 highlight: true,
 badge: "Mais recomendado",
 },
 {
 priceId: "price_1Tf2bHCyFEmb0TbKD9RCE546",
 name: "Pacote 8 Aulas",
 credits: 8,
 price: 640,
 pricePerClass: 80,
 highlight: false,
 badge: null,
 },
];

export default function PacotesPage() {
 return (
 <Suspense>
 <PacotesContent />
 </Suspense>
 );
}

function PacotesContent() {
 const { user } = useStudentReservations();
 const searchParams = useSearchParams();
 const [loading, setLoading] = useState<string | null>(null);
 const [success, setSuccess] = useState(false);

 useEffect(() => {
 if (searchParams.get("sucesso") === "1") setSuccess(true);
 }, [searchParams]);

 async function handleBuy(pkg: typeof PACKAGES[0]) {
 if (!user) return;
 setLoading(pkg.priceId);
 try {
 const res = await fetch("/api/stripe/checkout", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 priceId: pkg.priceId,
 customerId: user.uid,
 businessId: process.env.NEXT_PUBLIC_BUSINESS_ID,
 credits: pkg.credits,
 }),
 });
 const data = await res.json();
 if (data.url) window.location.href = data.url;
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(null);
 }
 }

 return (
 <div className="rise" style={{ maxWidth: "520px" }}>
 <header style={{ marginBottom: "22px" }}>
 <h1 className="font-display" style={{ fontSize: "1.9rem", color: "var(--text-1)" }}>Pacotes de aulas</h1>
 <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-2)" }}>Cada parafina vale 1 aula — compre e agende quando quiser</p>
 </header>

 {success && (
 <div style={{ background: "rgba(56,193,114,0.12)", border: "1px solid rgba(56,193,114,0.3)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", fontSize: "13.5px", color: "#1a7a4a", fontWeight: 600 }}>
 Pagamento confirmado! Suas parafinas já estão disponíveis.
 </div>
 )}

 <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "28px" }}>
 {PACKAGES.map((pkg) => {
 const isLoading = loading === pkg.priceId;
 return (
 <div
 key={pkg.priceId}
 className="card"
 style={{
 padding: "20px",
 border: pkg.highlight ? "2px solid var(--teal-light)" : undefined,
 position: "relative",
 overflow: "visible",
 }}
 >
 {pkg.badge && (
 <div style={{
 position: "absolute", top: "-12px", left: "20px",
 background: "var(--teal-light)", color: "#fff",
 fontSize: "11px", fontWeight: 700, padding: "3px 12px",
 borderRadius: "99px", letterSpacing: "0.02em",
 }}>
 {pkg.badge}
 </div>
 )}

 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
 <div style={{
 width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
 background: pkg.highlight ? "rgba(56,193,180,0.12)" : "var(--surface-2)",
 display: "flex", alignItems: "center", justifyContent: "center",
 }}>
 <Image src="/parafina.png" alt="parafina" width={30} height={30} style={{ objectFit: "contain" }} />
 </div>
 <div>
 <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-1)" }}>{pkg.name}</p>
 <p style={{ fontSize: "12px", color: "var(--text-2)", marginTop: "2px" }}>{pkg.credits} parafina{pkg.credits > 1 ? "s" : ""} de aula</p>
 {pkg.credits >= 4 && (
 <p style={{ fontSize: "11.5px", color: "var(--ocean)", fontWeight: 700, marginTop: "3px" }}>
 R$80/aula — economia de R${(pkg.credits * 100) - pkg.price}
 </p>
 )}
 </div>
 </div>

 <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
 <p className="font-display" style={{ fontSize: "1.35rem", color: "var(--text-1)", whiteSpace: "nowrap" }}>
 R$ {pkg.price.toLocaleString("pt-BR")}
 </p>
 <button
 onClick={() => handleBuy(pkg)}
 disabled={!!loading}
 className={pkg.highlight ? "btn-primary" : "btn-outline"}
 style={{ fontSize: "13px", padding: "8px 18px", height: "auto", display: "flex", alignItems: "center", gap: "6px", opacity: loading && !isLoading ? 0.5 : 1 }}
 >
 {isLoading ? <CircleNotch size={14} className="ph-spin" /> : null}
 {isLoading ? "Aguarde..." : "Comprar"}
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>

 <div style={{ background: "var(--surface-2)", borderRadius: "12px", padding: "16px 18px" }}>
 <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-1)", marginBottom: "6px" }}>Como funcionam as parafinas?</p>
 <p style={{ fontSize: "12.5px", color: "var(--text-2)", lineHeight: 1.6 }}>
 Após o pagamento, as parafinas são adicionados automaticamente à sua conta.
 Use-os para agendar aulas nos horários disponíveis. Se cancelar uma aula, a parafina é devolvida.
 </p>
 </div>

 <style>{`
 .ph-spin { animation: ph-spin 0.9s linear infinite; }
 @keyframes ph-spin { to { transform: rotate(360deg); } }
 `}</style>
 </div>
 );
}
