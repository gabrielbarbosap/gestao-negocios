"use client";

import { usePathname } from "next/navigation";
import { WhatsappLogo } from "@phosphor-icons/react";
import { WHATSAPP_CONTACT_LINK } from "@/constants/payment";

// Botão flutuante de contato — visível no site público e na área do aluno,
// escondido no painel admin (Ivan/Gabriel não precisam se contatar).
export function WhatsappFloatButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <a
      href={WHATSAPP_CONTACT_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className={`whatsapp-float ${pathname?.startsWith("/aluno") ? "whatsapp-float--with-bottomnav" : ""}`}
    >
      <WhatsappLogo size={28} weight="fill" />
    </a>
  );
}
