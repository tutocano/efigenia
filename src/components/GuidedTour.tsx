"use client";

import { useState } from "react";

type Paso = { icono: string; titulo: string; texto: string };

const pasosComunes: Paso[] = [
  {
    icono: "🏠",
    titulo: "Inicio",
    texto: "Aquí tocas los botones grandes para registrar en dos segundos: siesta, comida, pañal, llanto, malestar y más.",
  },
  {
    icono: "📜",
    titulo: "Historial",
    texto: "Todo lo registrado, agrupado por semana, del más reciente al más antiguo.",
  },
  {
    icono: "📊",
    titulo: "Semana",
    texto: "Gráficas de los últimos 7 días para ver patrones de sueño, cólicos y descanso de los cuidadores.",
  },
];

const pasosEditor: Paso[] = [
  ...pasosComunes,
  {
    icono: "🧑‍🧑‍🧒",
    titulo: "Padres",
    texto: "Registra tu propio descanso y bienestar, y mira cómo está el resto de la familia hoy.",
  },
  {
    icono: "💬",
    titulo: "Chat IA",
    texto:
      "Escribe cualquier duda y recibe orientación al instante, combinando consejos probados con inteligencia artificial real (Google Gemini).",
  },
];

const pasosSuperadmin: Paso[] = [
  ...pasosEditor,
  {
    icono: "⚙️",
    titulo: "Admin",
    texto: "Administra la familia, los hijos, y crea las preguntas de seguimiento que la familia quiere llevar.",
  },
];

export default function GuidedTour({ variant }: { variant: "lector" | "editor" | "superadmin" }) {
  const pasos = variant === "lector" ? pasosComunes : variant === "superadmin" ? pasosSuperadmin : pasosEditor;
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState(0);

  function abrir() {
    setPaso(0);
    setAbierto(true);
  }

  function siguiente() {
    if (paso < pasos.length - 1) setPaso(paso + 1);
    else setAbierto(false);
  }

  function anterior() {
    if (paso > 0) setPaso(paso - 1);
  }

  if (!abierto) {
    return (
      <button
        onClick={abrir}
        className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2"
      >
        ▶️ Ver demo interactiva
      </button>
    );
  }

  const actual = pasos[paso];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setAbierto(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center gap-1 mb-4">
          {pasos.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === paso ? "w-6 bg-indigo-600" : "w-1.5 bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
        <div className="text-center">
          <span className="text-4xl">{actual.icono}</span>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-2">{actual.titulo}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{actual.texto}</p>
        </div>
        <div className="flex gap-2 mt-6">
          {paso > 0 && (
            <button
              onClick={anterior}
              className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500"
            >
              Atrás
            </button>
          )}
          <button onClick={siguiente} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
            {paso < pasos.length - 1 ? "Siguiente" : "Listo"}
          </button>
        </div>
        <button onClick={() => setAbierto(false)} className="w-full text-center text-xs text-slate-400 mt-3">
          Cerrar
        </button>
      </div>
    </div>
  );
}