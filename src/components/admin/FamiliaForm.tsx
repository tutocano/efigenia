"use client";

import { useState, useTransition } from "react";
import { actualizarNombreFamilia } from "@/app/dashboard/admin/actions";

export default function FamiliaForm({ nombreInicial }: { nombreInicial: string }) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
      <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Familia</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Este nombre aparece en la app móvil y en la barra de sesión
      </p>
      <div className="flex gap-2 max-w-sm">
        <input
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setSaved(false); }}
          className="flex-1 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
        />
        <button
          onClick={() =>
            startTransition(async () => {
              await actualizarNombreFamilia(nombre);
              setSaved(true);
            })
          }
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "…" : "Guardar"}
        </button>
      </div>
      {saved && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Guardado.</p>}
    </div>
  );
}
