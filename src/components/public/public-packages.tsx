"use client";

import { useState } from "react";
import { CircleNotch, Lightning, Star, Package } from "@phosphor-icons/react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/store/auth";

const PACKAGES = [
  {
    priceId: "price_1Tf2aHCyFEmb0TbKWw4qUA2g",
    label: "Aula Avulsa",
    credits: 1,
    price: 100,
    pricePerClass: 100,
    icon: Lightning,
    highlight: false,
    tag: null,
  },
  {
    priceId: "price_1Tf2afCyFEmb0TbKtjAGlrMl",
    label: "Pacote 4 Aulas",
    credits: 4,
    price: 320,
    pricePerClass: 80,
    icon: Star,
    highlight: true,
    tag: "Mais recomendado",
  },
  {
    priceId: "price_1Tf2bHCyFEmb0TbKD9RCE546",
    label: "Pacote 8 Aulas",
    credits: 8,
    price: 640,
    pricePerClass: 80,
    icon: Package,
    highlight: false,
    tag: null,
  },
];

export function PublicPackages() {
  const { requireAuth } = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleBuy(pkg: typeof PACKAGES[0]) {
    requireAuth(async () => {
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
    });
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {PACKAGES.map((pkg) => {
        const Icon = pkg.icon;
        const isLoading = loading === pkg.priceId;
        return (
          <div
            key={pkg.priceId}
            className="card"
            style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: "16px",
              padding: "18px 20px",
              border: pkg.highlight ? "2px solid var(--teal-light)" : undefined,
              position: "relative",
            }}
          >
            {pkg.tag && (
              <div style={{
                position: "absolute", top: "-11px", left: "18px",
                background: "var(--teal-light)", color: "#fff",
                fontSize: "10px", fontWeight: 700, padding: "2px 10px",
                borderRadius: "99px", letterSpacing: "0.04em",
              }}>
                {pkg.tag}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
                background: pkg.highlight ? "rgba(56,193,180,0.12)" : "var(--surface-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} style={{ color: pkg.highlight ? "var(--teal-light)" : "var(--text-2)" }} />
              </div>
              <div>
                <p className="font-display" style={{ fontSize: "1.15rem", color: "var(--text-1)" }}>{pkg.label}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" }}>
                  <span className="font-display" style={{ fontSize: "1.4rem", color: "var(--text-1)" }}>
                    R$ {pkg.price.toLocaleString("pt-BR")}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    R${pkg.pricePerClass}/aula
                  </span>
                </div>
                {pkg.credits >= 4 && (
                  <p style={{ fontSize: "11px", color: "var(--ocean)", fontWeight: 700, marginTop: "2px" }}>
                    Economia de R${(pkg.credits * 100) - pkg.price}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => handleBuy(pkg)}
              disabled={!!loading}
              className={pkg.highlight ? "btn-primary" : "btn-outline"}
              style={{
                padding: "9px 20px", fontSize: "13px",
                whiteSpace: "nowrap", flexShrink: 0,
                display: "flex", alignItems: "center", gap: "6px",
                opacity: loading && !isLoading ? 0.5 : 1,
              }}
            >
              {isLoading && <CircleNotch size={13} style={{ animation: "spin 0.9s linear infinite" }} />}
              {isLoading ? "Aguarde..." : "Comprar"}
            </button>
          </div>
        );
      })}

      <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-3)", marginTop: "4px" }}>
        Pagamento seguro via Stripe · Créditos adicionados automaticamente
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
