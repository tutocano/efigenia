"use client";

import { useState, useTransition } from "react";
import { crearPregunta, actualizarPregunta, eliminarPregunta } from "@/app/dashboard/admin/actions";
import { categoriaLabels, tipoEntradaLabels, type PreguntaDinamica } from "@/lib/supabase/types";

export default function PreguntasManager({ preguntas, canWrite }: { preguntas: PreguntaDinamica[]; canWrite: boolean }) {
  const [editing, setEditing] = useState<null | "nuevo" | string>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const editData = editing && editing !== "nuevo" ? preguntas.find((p) => p.id === editing) : null;
  const ordenadas = [...preguntas].sort((a, b) => a.orden - b.orden);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Preguntas dinámicas</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Definen qué se pregunta en el registro diario y en qué orden</p>
        </div>
        {canWrite && (
          <button onClick={() => setEditing("nuevo")} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium px-4 py-2 rounded-lg shrink-0">
            + Nueva pregunta
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800">
              <th className="p-3">Orden</th>
              <th className="p-3">Ícono</th>
              <th className="p-3">Pregunta</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Obligatoria</th>
              <th className="p-3">Acción rápida</th>
              {canWrite && <th className="p-3">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {ordenadas.map((q) => (
              <tr key={q.id} className="text-slate-700 dark:text-slate-200">
                <td className="p-3">{q.orden}</td>
                <td className="p-3 text-base">{q.icono || "—"}</td>
                <td className="p-3">{q.texto}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{categoriaLabels[q.categoria]}</span></td>
                <td className="p-3 text-xs text-slate-500 dark:text-slate-400">{tipoEntradaLabels[q.tipo_entrada]}</td>
                <td className="p-3">{q.obligatoria ? "✅" : "—"}</td>
                <td className="p-3">{q.es_accion_rapida ? "⚡" : "—"}</td>
                {canWrite && (
                  <td className="p-3 flex gap-2">
                    <button onClick={() => setEditing(q.id)} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Editar</button>
                    <button
                      onClick={() => { if (confirm("¿Eliminar esta pregunta?")) startTransition(() => eliminarPregunta(q.id)); }}
                      className="text-xs text-rose-600 dark:text-rose-400 font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="text-xs text-rose-500 px-4 pb-3">{error}</p>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">{editing === "nuevo" ? "Nueva" : "Editar"} pregunta</h3>
            <PreguntaForm
              inicial={editData}
              siguienteOrden={preguntas.length + 1}
              pending={pending}
              onCancel={() => setEditing(null)}
              onSubmit={(datos) => {
                setError(null);
                startTransition(async () => {
                  try {
                    if (editing === "nuevo") await crearPregunta(datos);
                    else await actualizarPregunta(editing as string, datos);
                    setEditing(null);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Ocurrió un error.");
                  }
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PreguntaForm({
  inicial,
  siguienteOrden,
  pending,
  onCancel,
  onSubmit,
}: {
  inicial: PreguntaDinamica | null | undefined;
  siguienteOrden: number;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (datos: {
    texto: string;
    categoria: string;
    tipoEntrada: string;
    opciones: string[];
    obligatoria: boolean;
    orden: number;
    icono: string;
    esAccionRapida: boolean;
  }) => void;
}) {
  const [texto, setTexto] = useState(inicial?.texto ?? "");
  const [categoria, setCategoria] = useState<string>(inicial?.categoria ?? "bebe");
  const [tipoEntrada, setTipoEntrada] = useState<string>(inicial?.tipo_entrada ?? "texto");
  const [opciones, setOpciones] = useState((inicial?.opciones ?? []).join(", "));
  const [obligatoria, setObligatoria] = useState(inicial?.obligatoria ?? false);
  const [orden, setOrden] = useState(inicial?.orden ?? siguienteOrden);
  const [icono, setIcono] = useState(inicial?.icono ?? "");
  const [esAccionRapida, setEsAccionRapida] = useState(inicial?.es_accion_rapida ?? false);
  const puedeSerAccionRapida = tipoEntrada === "toggle" || tipoEntrada === "seleccion_unica" || tipoEntrada === "foto";

  return (
    <div className="space-y-2 text-sm">
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Texto de la pregunta" className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
      <input
        value={icono}
        onChange={(e) => setIcono(e.target.value)}
        placeholder="Ícono (emoji, ej. 🌡️) — opcional"
        maxLength={4}
        className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      />
      <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {Object.entries(categoriaLabels).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
      <select value={tipoEntrada} onChange={(e) => setTipoEntrada(e.target.value)} className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {Object.entries(tipoEntradaLabels).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
      {tipoEntrada === "seleccion_unica" && (
        <input
          value={opciones}
          onChange={(e) => setOpciones(e.target.value)}
          placeholder="Opciones separadas por coma"
          className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
        />
      )}
      {tipoEntrada === "foto" && (
        <p className="text-[10px] text-slate-400">
          No requiere configuración adicional: el usuario podrá tomar o elegir una foto al responder.
        </p>
      )}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={obligatoria} onChange={(e) => setObligatoria(e.target.checked)} /> Obligatoria
        </label>
        <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className="w-20 rounded-lg px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
      </div>
      <label className={`flex items-center gap-2 ${puedeSerAccionRapida ? "" : "opacity-40"}`}>
        <input
          type="checkbox"
          checked={esAccionRapida}
          disabled={!puedeSerAccionRapida}
          onChange={(e) => setEsAccionRapida(e.target.checked)}
        />
        Mostrar como acción rápida (botón de un toque)
      </label>
      {!puedeSerAccionRapida && (
        <p className="text-[10px] text-slate-400">
          Solo preguntas tipo &quot;Sí/No&quot; o &quot;Selección única&quot; pueden ser acción rápida.
        </p>
      )}
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500">Cancelar</button>
        <button
          onClick={() =>
            onSubmit({
              texto,
              categoria,
              tipoEntrada,
              opciones: opciones.split(",").map((s) => s.trim()).filter(Boolean),
              obligatoria,
              orden,
              icono,
              esAccionRapida,
            })
          }
          disabled={pending || !texto}
          className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}