"use client";

import { salvarTelasAction } from "@/app/usuarios/actions";

// As mudanças valem na hora: cada marcação envia o formulário inteiro (o design não tem botão "Salvar").
export function FormularioTelas({ id, children }: { id: number; children: React.ReactNode }) {
  return (
    <form action={salvarTelasAction} onChange={(e) => e.currentTarget.requestSubmit()} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      {children}
    </form>
  );
}
