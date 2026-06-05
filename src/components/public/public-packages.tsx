"use client";

import { formatCurrency } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const PACKAGES = [
  { id: "4",  label: "4 aulas",  price: 400, tag: null           },
  { id: "8",  label: "8 aulas",  price: 720, tag: "Mais popular" },
  { id: "12", label: "12 aulas", price: 960, tag: null           },
];

export function PublicPackages() {
  const { requireAuth } = useRequireAuth();

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      {PACKAGES.map((pkg) => (
        <div
          key={pkg.id}
          className="card"
          style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "16px",
            padding: "18px 20px",
            ...(pkg.tag ? { borderColor: "var(--border-lit)" } : {}),
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span
                className="font-display"
                style={{ fontSize: "1.25rem", color: "var(--text-1)" }}
              >
                {pkg.label}
              </span>
              {pkg.tag && (
                <span
                  style={{
                    fontSize: "10px", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    padding: "2px 8px", borderRadius: "99px",
                    background: "rgba(244,98,42,0.12)",
                    color: "var(--orange-2)",
                    border: "1px solid rgba(244,98,42,0.2)",
                  }}
                >
                  {pkg.tag}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span
                className="font-display"
                style={{ fontSize: "1.7rem", color: "var(--text-1)" }}
              >
                {formatCurrency(pkg.price)}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-3)" }}>
                {formatCurrency(pkg.price / parseInt(pkg.id))}/aula
              </span>
            </div>
          </div>

          <button
            onClick={() => requireAuth(() => alert(`Comprando ${pkg.label}...`))}
            className={pkg.tag ? "btn-primary" : "btn-outline"}
            style={{ padding: "9px 20px", fontSize: "13px", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            Comprar
          </button>
        </div>
      ))}

      <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-3)", marginTop: "4px" }}>
        Pix ou cartão em até 12×
      </p>
    </div>
  );
}
