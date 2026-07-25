"use client";

import { useRef, useState } from "react";
import { comprimirImagen } from "@/lib/imagen";
import { subirFotoRegistro } from "@/app/dashboard/actions";

// Campo reutilizable para preguntas tipo "foto": abre la cámara (celular) o
// el explorador de archivos (desktop), comprime la imagen en el navegador,
// la sube y devuelve la URL pública mediante onChange. Se usa tanto en
// preguntas guiadas (PreguntaCampo) como en acciones rápidas (QuickActions).
export default function FotoCampo({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarArchivo(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    setSubiendo(true);
    try {
      const comprimida = await comprimirImagen(archivo);
      const fd = new FormData();
      fd.append("file", comprimida, "foto.jpg");
      const url = await subirFotoRegistro(fd);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => manejarArchivo(e.target.files?.[0])}
      />
      {valor ? (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={valor}
            alt="Foto adjunta"
            className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium disabled:opacity-60"
          >
            {subiendo ? "Subiendo…" : "Cambiar"}
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={subiendo}
            className="text-xs text-rose-500 font-medium disabled:opacity-60"
          >
            Quitar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="w-full py-2 rounded-lg bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 disabled:opacity-60"
        >
          {subiendo ? "Subiendo…" : "📷 Tomar o elegir foto"}
        </button>
      )}
      {error && <p className="text-[10px] text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
