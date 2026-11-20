"use client";

import { useState } from "react";

// Campo de senha com "Mostrar" / "Ocultar" (botão do design de Login).
export function CampoSenha({ name, autoComplete }: { name: string; autoComplete: string }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <span className="flex gap-2">
      <input
        name={name}
        type={mostrar ? "text" : "password"}
        autoComplete={autoComplete}
        required
        className="min-h-12 min-w-0 flex-1 rounded-[10px] border border-[#A9B4C6] bg-white px-3.5 text-[15px] text-[#0E1B33]"
      />
      <button
        type="button"
        aria-pressed={mostrar}
        onClick={() => setMostrar(!mostrar)}
        className="min-h-12 shrink-0 rounded-[10px] border border-[#A9B4C6] bg-white px-3.5 text-sm font-semibold text-navy"
      >
        {mostrar ? "Ocultar" : "Mostrar"}
      </button>
    </span>
  );
}
