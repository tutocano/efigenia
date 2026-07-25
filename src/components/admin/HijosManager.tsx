"use client";

import { useState, useTransition } from "react";
import { crearHijo, actualizarHijo, eliminarHijo } from "@/app/dashboard/admin/actions";
import { estaEnGestacion, estadoTexto } from "@/lib/hijoEstado";
import type { Hijo } from "@/lib/supabase/types";

export default function HijosManager({ hijos, canWrite }: { hijos: Hijo[]; canWrite: boolean }) {
  const [editing, setEditing] = useState<null | "nuevo" | string>(null);
  const [pending, startTransition] = useTransition();
  const editData = editing && editing !== "nuevo" ? hijos.find((h) => h.id === editing) : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Hijos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Aparecen en el selector de la app móvil</p>
        </div>
        {canWrite && (
          <button onClick={() => setEditing("nuevo")} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium px-4 py-2 rounded-lg shrink-0">
            + Nuevo hijo
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800">
              <th className="p-3">Nombre</th>
              <th className="p-3">Estado</th>
              <th className="p-3">FPP / Nacimiento</th>
              <th className="p-3">Edad / Semana</th>
              <th className="p-3">Sexo</th>
              {canWrite && <th className="p-3">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {hijos.map((h) => {
              const gestacion = estaEnGestacion(h);
              return (
                <tr key={h.id} className="text-slate-700 dark:text-slate-200">
                  <td className="p-3">{h.sexo === "masculino" ? "👦" : h.sexo === "femenino" ? "👧" : "🤰"} {h.nombre}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${gestacion ? "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300" : "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"}`}>
                      {gestacion ? "En gestación" : "Nacido"}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-500 dark:text-slate-400">
                    {gestacion ? h.fecha_probable_parto || "—" : h.fecha_nacimiento}
                  </td>
                  <td className="p-3 text-xs text-slate-500 dark:text-slate-400">{estadoTexto(h)}</td>
                  <td className="p-3 text-xs text-slate-500 dark:text-slate-400">
                    {h.sexo === "masculino" ? "Niño" : h.sexo === "femenino" ? "Niña" : "Por definir"}
                  </td>
                  {canWrite && (
                    <td className="p-3 flex gap-2">
                      <button onClick={() => setEditing(h.id)} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Editar</button>
                      <button
                        onClick={() => { if (confirm(`¿Eliminar a ${h.nombre}?`)) startTransition(() => eliminarHijo(h.id)); }}
                        className="text-xs text-rose-600 dark:text-rose-400 font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">{editing === "nuevo" ? "Nuevo hijo" : "Editar hijo"}</h3>
            <HijoForm
              inicial={editData}
              pending={pending}
              onCancel={() => setEditing(null)}
              onSubmit={(datos) =>
                startTransition(async () => {
                  if (editing === "nuevo") await crearHijo(datos);
                  else await actualizarHijo(editing as string, datos);
                  setEditing(null);
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function HijoForm({
  inicial,
  pending,
  onCancel,
  onSubmit,
}: {
  inicial: Hijo | null | undefined;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (datos: {
    nombre: string;
    fechaInicioSeguimiento: string;
    fechaProbableParto?: string;
    fechaNacimiento?: string;
    sexo: string;
  }) => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [fechaInicio, setFechaInicio] = useState(
    inicial?.fecha_inicio_seguimiento ?? new Date().toISOString().slice(0, 10)
  );
  const [fechaProbableParto, setFechaProbableParto] = useState(inicial?.fecha_probable_parto ?? "");
  const [fechaNacimiento, setFechaNacimiento] = useState(inicial?.fecha_nacimiento ?? "");
  const [sexo, setSexo] = useState<"masculino" | "femenino" | "prefiero_no_decir">(
    inicial?.sexo ?? "prefiero_no_decir"
  );

  return (
    <div className="space-y-2 text-sm">
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />

      <label className="block text-[11px] text-slate-500 dark:text-slate-400">
        Fecha de inicio de seguimiento (obligatoria)
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="w-full mt-1 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        />
      </label>

      <label className="block text-[11px] text-slate-500 dark:text-slate-400">
        Fecha probable de parto (si está en gestación)
        <input
          type="date"
          value={fechaProbableParto}
          onChange={(e) => setFechaProbableParto(e.target.value)}
          className="w-full mt-1 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        />
      </label>

      <label className="block text-[11px] text-slate-500 dark:text-slate-400">
        Fecha de nacimiento (déjala vacía mientras está en gestación)
        <input
          type="date"
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          className="w-full mt-1 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        />
      </label>
      {!inicial?.fecha_nacimiento && fechaNacimiento && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          Al guardar con esta fecha, el hijo pasa a estado &quot;Nacido&quot; y en Inicio se mostrarán las preguntas y
          acciones rápidas de categoría &quot;Bebé&quot; en vez de las de embarazo.
        </p>
      )}

      <select
        value={sexo}
        onChange={(e) => setSexo(e.target.value as "masculino" | "femenino" | "prefiero_no_decir")}
        className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      >
        <option value="prefiero_no_decir">Por definir / prefiero no decir</option>
        <option value="femenino">Niña</option>
        <option value="masculino">Niño</option>
      </select>

      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500">Cancelar</button>
        <button
          onClick={() =>
            onSubmit({
              nombre,
              fechaInicioSeguimiento: fechaInicio,
              fechaProbableParto: fechaProbableParto || undefined,
              fechaNacimiento: fechaNacimiento || undefined,
              sexo,
            })
          }
          disabled={pending || !nombre || !fechaInicio}
          className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
