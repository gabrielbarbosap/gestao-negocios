"use client";

import { useRef, useState } from "react";
import { CircleNotch, QrCode } from "@phosphor-icons/react";
import type { Reservation } from "@/types/reservation";

// Botão que gera o checkout Pix da InfinitePay para uma reserva e redireciona
// o aluno pra tela de pagamento. Ao pagar, o webhook confirma a reserva.
export function InfinitePayPixButton({
  reservation,
  amountInReais,
  label = "Pagar via PIX",
  style,
}: {
  reservation: Reservation;
  amountInReais: number;
  label?: string;
  style?: React.CSSProperties;
}) {
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  async function pay() {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/infinitepay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: reservation.businessId,
          reservationId: reservation.id,
          amountInReais,
          description: `Aula de surf — ${reservation.date}`,
          customerName: reservation.customerName,
          customerEmail: reservation.customerEmail,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redireciona pro checkout InfinitePay
      } else {
        console.error("[infinitepay-pix-button]", data);
        loadingRef.current = false;
        setLoading(false);
      }
    } catch (e) {
      console.error("[infinitepay-pix-button]", e);
      loadingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <button
      onClick={pay}
      disabled={loading}
      className="btn-primary"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontWeight: 700,
        ...style,
      }}
    >
      {loading ? (
        <CircleNotch size={15} className="ph-spin" />
      ) : (
        <QrCode size={16} weight="bold" />
      )}
      {loading ? "Gerando pagamento..." : label}
    </button>
  );
}
