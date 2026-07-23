"use client";

import { useState, useTransition } from "react";
import { crearMiembro, actualizarMiembro, eliminarMiembro } from "@/app/dashboard/admin/actions";
import { rolLabels, type MiembroFamilia, type RolFamiliar } from "@/lib/supabase/types";

function permisoDe(rol: RolFamiliar) {
  return rol === "familiar" ? "Solo lectura" : "Editor";
}

export default function MembersManager({
  miembros,
  isOwner,
  ownerUserId,
}: {
  miembros: MiembroFamilia[];
  isOwner: boolean;
  ownerUserId: string;
}) {
  const [editing, setEditing] = useState<null | "nuevo" | string>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const editData = editing && editing !== "nuevo" ? miembros.find((m) => m.id === editing) : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Miembros y accesos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Crea la cuenta con la que cada persona entra a la app. &quot;Familiar&quot; queda en solo lectura.
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setEditing("nuevo")}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium px-4 py-2 rounded-lg shrink-0"
          >
            + Nuevo miembro
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800">
              <th className="p-3">Nombre</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Permiso</th>
              {isOwner && <th className="p-3">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {miembros.map((m) => (
              <tr key={m.id} className="text-slate-700 dark:text-slate-200">
                <td className="p-3">
                  {m.nombre} {m.user_id === ownerUserId && <span className="text-[10px] text-indigo-500">(owner)</span>}
                </td>
                <td className="p-3 text-xs">{m.email}</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{rolLabels[m.rol]}</span>
                </td>
                <td className={`p-3 text-xs ${m.rol === "familiar" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {permisoDe(m.rol)}
                </td>
                {isOwner && (
                  <td className="p-3 flex gap-2">
                    <button onClick={() => setEditing(m.id)} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      Editar
                    </button>
                    {m.user_id !== ownerUserId && (
                      <button
                        onClick={() => {
                          if (!confirm(`¿Eliminar a ${m.nombre}?`)) return;
                          startTransition(() => eliminarMiembro(m.id));
                        }}
                        className="text-xs text-rose-600 dark:text-rose-400 font-medium"
                      >
                        Eliminar
                      </button>
                    )}
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
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">
              {editing === "nuevo" ? "Nuevo miembro" : "Editar miembro"}
            </h3>
            <MemberForm
              inicial={editData}
              pending={pending}
              error={error}
              onCancel={() => { setEditing(null); setError(null); }}
              onSubmit={(datos) => {
                setError(null);
                startTransition(async () => {
                  try {
                    if (editing === "nuevo") {
                      await crearMiembro({ nombre: datos.nombre, email: datos.email, password: datos.password, rol: datos.rol });
                    } else {
                      await actualizarMiembro(editing as string, {
                        nombre: datos.nombre,
                        rol: datos.rol,
                        nuevaPassword: datos.password || undefined,
                      });
                    }
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

function MemberForm({
  inicial,
  pending,
  error,
  onCancel,
  onSubmit,
}: {
  inicial: MiembroFamilia | null | undefined;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (datos: { nombre: string; email: string; password: string; rol: RolFamiliar }) => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [email, setEmail] = useState(inicial?.email ?? "");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolFamiliar>(inicial?.rol ?? "cuidador");
  const esNuevo = !inicial;

  return (
    <div className="space-y-2 text-sm">
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre"
        className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Correo"
        type="email"
        disabled={!esNuevo}
        className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-60"
      />
      <select
        value={rol}
        onChange={(e) => setRol(e.target.value as RolFamiliar)}
        className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      >
        {Object.entries(rolLabels).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={esNuevo ? "Contraseña" : "Nueva contraseña (opcional)"}
        type="text"
        className="w-full rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500">
          Cancelar
        </button>
        <button
          onClick={() => onSubmit({ nombre, email, password, rol })}
          disabled={pending || !nombre || (esNuevo && (!email || !password))}
          className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
