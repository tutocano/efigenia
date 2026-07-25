"use client";

import { useRef, useState, useTransition } from "react";
import { guardarRespuestasGuiadas } from "@/app/dashboard/actions";
import type { PreguntaDinamica } from "@/lib/supabase/types";
import PreguntaCampo from "./PreguntaCampo";

export default function GuidedQuestions({
  hijoId,
  preguntas,
}: {
  hijoId: string | null;
  preguntas: PreguntaDinamica[];
}) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [fechas, setFechas] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (preguntas.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        No hay preguntas activas para este momento. Agrégalas en Panel admin → Preguntas.
      </p>
    );
  }

  function setValor(id: string, val: string) {
    setValores((v) => ({ ...v, [id]: val }));
    setSaved(false);
  }

  function setFecha(id: string, val: string) {
    setFechas((f) => ({ ...f, [id]: val }));
    setSaved(false);
  }

  function guardar() {
    const respuestas = preguntas.map((p) => ({
      preguntaId: p.id,
      valor: valores[p.id] ?? "",
      respondidoEn: fechas[p.id] ? new Date(fechas[p.id]).toISOString() : undefined,
    }));
    startTransition(async () => {
      await guardarRespuestasGuiadas(hijoId, respuestas);
      setValores({});
      setFechas({});
      setSaved(true);
    });
  }

  return (
    <div>
      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 space-y-3">
        {preguntas.map((p) => (
          <FilaPregunta
            key={p.id}
            pregunta={p}
            valor={valores[p.id] ?? ""}
            fecha={fechas[p.id] ?? ""}
            onChangeValor={(v) => setValor(p.id, v)}
            onChangeFecha={(v) => setFecha(p.id, v)}
          />
        ))}
      </div>
      <button
        onClick={guardar}
        disabled={pending}
        className="w-full mt-2 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar registro guiado"}
      </button>
      {saved && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Registro guardado.</p>}
    </div>
  );
}

function FilaPregunta({
  pregunta,
  valor,
  fecha,
  onChangeValor,
  onChangeFecha,
}: {
  pregunta: PreguntaDinamica;
  valor: string;
  fecha: string;
  onChangeValor: (v: string) => void;
  onChangeFecha: (v: string) => void;
}) {
  const [mostrarHora, setMostrarHora] = useState(false);
  const presionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function empezarPresion() {
    presionTimer.current = setTimeout(() => setMostrarHora(true), 500);
  }
  function cancelarPresion() {
    if (presionTimer.current) {
      clearTimeout(presionTimer.current);
      presionTimer.current = null;
    }
  }

  return (
    <div>
      <p
        onDoubleClick={() => setMostrarHora((v) => !v)}
        onTouchStart={empezarPresion}
        onTouchEnd={cancelarPresion}
        onTouchCancel={cancelarPresion}
        className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 select-none"
        title="Doble clic (o mantén presionado en el celular) para elegir fecha y hora"
      >
        {pregunta.icono ? `${pregunta.icono} ` : ""}
        {pregunta.texto} {pregunta.obligatoria && <span className="text-rose-500">*</span>}
      </p>
      <PreguntaCampo pregunta={pregunta} valor={valor} onChange={onChangeValor} />
      {mostrarHora && (
        <div className="mt-1 flex items-center gap-2">
          <input
            type="datetime-local"
            value={fecha}
            onChange={(e) => onChangeFecha(e.target.value)}
            className="flex-1 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]"
          />
          {fecha && (
            <button
              type="button"
              onClick={() => onChangeFecha("")}
              className="text-[10px] text-slate-400 underline"
            >
              Usar ahora
            </button>
          )}
        </div>
      )}
    </div>
  );
}