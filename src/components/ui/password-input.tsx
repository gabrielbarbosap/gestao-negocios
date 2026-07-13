"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";

// Input de senha com botão de mostrar/ocultar. Aceita spread do
// react-hook-form (`{...register("password")}`) normalmente.
export const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput({ style, ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div style={{ position: "relative" }}>
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          style={{ paddingRight: "38px", width: "100%", ...style }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          tabIndex={-1}
          style={{
            position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "var(--text-3)", cursor: "pointer",
            padding: "4px", display: "flex", alignItems: "center",
          }}
        >
          {visible ? <EyeSlash size={17} /> : <Eye size={17} />}
        </button>
      </div>
    );
  },
);
