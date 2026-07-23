"use client";

import { useState, useTransition } from "react";
import { crearHijo, actualizarHijo, eliminarHijo } from "@/app/dashboard/admin/actions";
import type { Hijo } from "@/lib/supabase/types";

function edadTexto(fechaISO: string): string {
  const dias = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 86400000);
  if (dias < 0) return "aún no nace";
  const meses = Math.floor(dias / 30);
  const diasRest = dias % 30;
  return meses > 0 ? `${meses} meses, ${diasRest} días` : `${dias} días`;
}

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
              <th className="p-3">Fecha de nacimiento</th>
              <th className="p-3">Edad</th>
              <th className="p-3">Sexo</th>
              {canWrite && <th className="p-3">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {hijos.map((h) => (
              <tr key={h.id} className="text-slate-700 dark:text-slate-200">
                <td className="p-3">{h.sexo === "masculino" ? "👦" : "👧"} {h.nombre}</td>
                <td className="p-3">{h.fecha_nacimiento}</td>
                <td className="p-3 text-xs text-slate-500 dark:text-slate-400">{edadTexto(h.fecha_nacimiento)}</td>
                <td className="p-3 text-xs text-slate-500 dark:text-slate-400">{h.sexo === "masculino" ? "Niño" : "Niña"}</td>
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
            ))}
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
  onSubmit: (datos: { nombre: string; fechaNacimiento: string; sexo: string }) => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [fecha, setFecha] = useState(inicial?.fecha_nacimiento ?? "");
  const [sexo, setSexo] = useState<"masculino" | "femenino">(
  inicial?.sexo === "masculino" ? "masculino" : "femenino"
);

  return (
    <div className="space-y-2 text-sm">
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        <select value={sexo} onChange={(e) => setSexo(e.target.value as "masculino" | "femenino")} className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="femenino">Niña</option>
          <option value="masculino">Niño</option>
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500">Cancelar</button>
        <button
          onClick={() => onSubmit({ nombre, fechaNacimiento: fecha, sexo })}
          disabled={pending || !nombre || !fecha}
          className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
