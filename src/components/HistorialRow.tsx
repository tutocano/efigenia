"use client";

import { useTransition } from "react";
import { eliminarRegistro, eliminarRespuestaPregunta } from "@/app/dashboard/actions";

export default function HistorialRow({
  kind,
  rawId,
  icono,
  texto,
  momento,
  autor,
  canDelete,
}: {
  kind: "registro" | "respuesta";
  rawId: string;
  icono: string;
  texto: string;
  momento: string;
  autor: string | null;
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function eliminar() {
    if (!confirm("¿Eliminar esta entrada del historial? No se puede deshacer.")) return;
    startTransition(() => {
      if (kind === "registro") eliminarRegistro(rawId);
      else eliminarRespuestaPregunta(rawId);
    });
  }

  const hora = new Date(momento).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
      <span className="text-lg">{icono}</span>
      <div className="flex-1">
        <p className="text-xs text-slate-700 dark:text-slate-200">{texto}</p>
        <p className="text-[10px] text-slate-400">
          {hora}
          {autor ? ` · ${autor}` : ""}
        </p>
      </div>
      {canDelete && (
        <button
          onClick={eliminar}
          disabled={pending}
          className="text-slate-300 dark:text-slate-500 hover:text-rose-500 text-sm px-2 disabled:opacity-40"
          aria-label="Eliminar"
        >
          🗑️
        </button>
      )}
    </div>
  );
}