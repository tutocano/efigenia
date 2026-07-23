"use client";

import { useState, useTransition } from "react";
import { guardarBienestar } from "@/app/dashboard/actions";
import type { BienestarPadre } from "@/lib/supabase/types";

const ANIMOS = ["Excelente", "Bien", "Agotado/a", "Abrumado/a"];

export default function BienestarForm({ inicial }: { inicial: BienestarPadre | null }) {
  const [horasSueno, setHorasSueno] = useState(inicial?.horas_sueno?.toString() ?? "");
  const [estadoAnimo, setEstadoAnimo] = useState(inicial?.estado_animo ?? "Bien");
  const [comioBien, setComioBien] = useState(inicial?.comio_bien ?? true);
  const [tomoAgua, setTomoAgua] = useState(inicial?.tomo_agua_suficiente ?? true);
  const [nota, setNota] = useState(inicial?.nota_rapida ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function guardar() {
    startTransition(async () => {
      await guardarBienestar({
        horasSueno: horasSueno ? Number(horasSueno) : undefined,
        estadoAnimo,
        comioBien,
        tomoAguaSuficiente: tomoAgua,
        notaRapida: nota,
      });
      setSaved(true);
    });
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-slate-400 mb-1">Horas de sueño (hoy)</p>
          <input
            type="number"
            step="0.5"
            min="0"
            max="14"
            value={horasSueno}
            onChange={(e) => { setHorasSueno(e.target.value); setSaved(false); }}
            className="w-full rounded-lg px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          />
        </div>
        <div>
          <p className="text-slate-400 mb-1">Ánimo</p>
          <select
            value={estadoAnimo}
            onChange={(e) => { setEstadoAnimo(e.target.value); setSaved(false); }}
            className="w-full rounded-lg px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            {ANIMOS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={comioBien} onChange={(e) => { setComioBien(e.target.checked); setSaved(false); }} />
          Comió bien
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={tomoAgua} onChange={(e) => { setTomoAgua(e.target.checked); setSaved(false); }} />
          Se hidrató
        </label>
      </div>
      <input
        type="text"
        placeholder="Duda o logro del día..."
        value={nota}
        onChange={(e) => { setNota(e.target.value); setSaved(false); }}
        className="w-full text-xs rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
      />
      <button
        onClick={guardar}
        disabled={pending}
        className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar mi estado de hoy"}
      </button>
      {saved && <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Guardado.</p>}
    </div>
  );
}
