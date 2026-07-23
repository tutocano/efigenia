"use client";

import type { PreguntaDinamica } from "@/lib/supabase/types";

export default function PreguntaCampo({
  pregunta,
  valor,
  onChange,
}: {
  pregunta: PreguntaDinamica;
  valor: string;
  onChange: (v: string) => void;
}) {
  const base =
    "w-full rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs";

  switch (pregunta.tipo_entrada) {
    case "texto":
      return <input type="text" value={valor} onChange={(e) => onChange(e.target.value)} className={base} />;
    case "numero":
    case "timer":
      return <input type="number" value={valor} onChange={(e) => onChange(e.target.value)} className={base} />;
    case "toggle":
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange("true")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
              valor === "true"
                ? "bg-emerald-600 text-white"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500"
            }`}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => onChange("false")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
              valor === "false"
                ? "bg-rose-600 text-white"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500"
            }`}
          >
            No
          </button>
        </div>
      );
    case "seleccion_unica":
      return (
        <select value={valor} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">Selecciona...</option>
          {(pregunta.opciones ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "escala_1_5":
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => onChange(String(n))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                valor === String(n)
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      );
    default:
      return null;
  }
}
