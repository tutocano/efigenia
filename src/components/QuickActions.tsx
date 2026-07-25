"use client";

import { useState, useTransition } from "react";
import { registrarActividad, guardarRespuestasGuiadas } from "@/app/dashboard/actions";
import type { PreguntaDinamica, TipoRegistro } from "@/lib/supabase/types";
import FotoCampo from "./FotoCampo";

type Modal = "comida" | "panal" | "llanto" | "malestar" | null;

export default function QuickActions({
  hijoId,
  preguntasRapidas = [],
}: {
  hijoId: string;
  preguntasRapidas?: PreguntaDinamica[];
}) {
  const [siestaStart, setSiestaStart] = useState<number | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [preguntaModal, setPreguntaModal] = useState<PreguntaDinamica | null>(null);
  const [pending, startTransition] = useTransition();

  function responderPreguntaRapida(preguntaId: string, valor: string) {
    startTransition(() => {
      guardarRespuestasGuiadas(hijoId, [{ preguntaId, valor }]);
    });
    setPreguntaModal(null);
  }

  function tocarPreguntaRapida(p: PreguntaDinamica) {
    setPreguntaModal(p);
  }

  function toggleSiesta() {
    if (siestaStart === null) {
      setSiestaStart(Date.now());
      return;
    }
    const minutos = Math.max(1, Math.round((Date.now() - siestaStart) / 60000));
    const inicio = new Date(siestaStart).toISOString();
    setSiestaStart(null);
    startTransition(() => {
      registrarActividad({
        hijoId,
        tipo: "sueno",
        detalle: { duracion_minutos: minutos },
        horaInicio: inicio,
        horaFin: new Date().toISOString(),
      });
    });
  }

  function log(tipo: TipoRegistro, detalle: Record<string, unknown>) {
    startTransition(() => {
      registrarActividad({ hijoId, tipo, detalle });
    });
    setModal(null);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={toggleSiesta}
          className={`flex flex-col items-center justify-center gap-1 aspect-square rounded-3xl border text-[11px] font-medium text-center leading-tight px-1 ${
            siestaStart
              ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 border-red-200 dark:border-red-900"
              : "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900"
          }`}
        >
          <span className="text-2xl">😴</span>
          {siestaStart ? "Durmiendo… toca al despertar" : "Empezó siesta"}
        </button>
        <button
          onClick={() => setModal("comida")}
          className="flex flex-col items-center justify-center gap-1 aspect-square rounded-3xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900 text-[11px] font-medium"
        >
          <span className="text-2xl">🍼</span>Comida
        </button>
        <button
          onClick={() => setModal("panal")}
          className="flex flex-col items-center justify-center gap-1 aspect-square rounded-3xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-900 text-[11px] font-medium"
        >
          <span className="text-2xl">🧷</span>Pañal
        </button>
        <button
          onClick={() => setModal("llanto")}
          className="flex flex-col items-center justify-center gap-1 aspect-square rounded-3xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900 text-[11px] font-medium"
        >
          <span className="text-2xl">😢</span>Llanto
        </button>
        <button
          onClick={() => setModal("malestar")}
          className="flex flex-col items-center justify-center gap-1 aspect-square rounded-3xl bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-900 text-[11px] font-medium"
        >
          <span className="text-2xl">🌡️</span>Malestar
        </button>
        <button
          onClick={() => log("animo", { tummy_time: true })}
          className="flex flex-col items-center justify-center gap-1 aspect-square rounded-3xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900 text-[11px] font-medium"
        >
          <span className="text-2xl">🧸</span>Juego / tummy time
        </button>
        {preguntasRapidas.map((p) => (
          <button
            key={p.id}
            onClick={() => tocarPreguntaRapida(p)}
            className="flex flex-col items-center justify-center gap-1 aspect-square rounded-3xl bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900 text-[11px] font-medium px-1 text-center leading-tight"
          >
            <span className="text-2xl">{p.icono || "⚡"}</span>
            {p.texto}
          </button>
        ))}
      </div>

      {modal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {modal === "comida" && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => log("alimentacion", { tipo: "lactancia", lado: "izquierdo" })} className="py-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-sm font-medium">🤱 Pecho izq.</button>
                <button onClick={() => log("alimentacion", { tipo: "lactancia", lado: "derecho" })} className="py-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-sm font-medium">🤱 Pecho der.</button>
                <button onClick={() => log("alimentacion", { tipo: "formula" })} className="py-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-sm font-medium">🍼 Biberón</button>
                <button onClick={() => log("alimentacion", { tipo: "solidos" })} className="py-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-sm font-medium">🥣 Sólidos</button>
              </div>
            )}
            {modal === "panal" && (
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => log("panal", { tipo: "pipi" })} className="py-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-sm font-medium">💧 Pipí</button>
                <button onClick={() => log("panal", { tipo: "popo" })} className="py-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-sm font-medium">💩 Popó</button>
                <button onClick={() => log("panal", { tipo: "mixto" })} className="py-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-sm font-medium">🔄 Mixto</button>
              </div>
            )}
            {modal === "llanto" && (
              <div className="space-y-2">
                <button onClick={() => log("animo", { nivel_llanto: "poco" })} className="w-full py-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-sm font-medium">🙂 Poco</button>
                <button onClick={() => log("animo", { nivel_llanto: "frecuente" })} className="w-full py-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-sm font-medium">😟 Frecuente</button>
                <button onClick={() => log("animo", { nivel_llanto: "inconsolable" })} className="w-full py-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-sm font-medium">😭 Inconsolable</button>
              </div>
            )}
            {modal === "malestar" && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => log("salud", { malestar: "colico" })} className="py-3 rounded-xl bg-orange-50 dark:bg-orange-950 text-sm font-medium">Cólico</button>
                <button onClick={() => log("salud", { malestar: "gases" })} className="py-3 rounded-xl bg-orange-50 dark:bg-orange-950 text-sm font-medium">Gases</button>
                <button onClick={() => log("salud", { malestar: "fiebre" })} className="py-3 rounded-xl bg-orange-50 dark:bg-orange-950 text-sm font-medium">Fiebre</button>
                <button onClick={() => log("salud", { malestar: "brote_crecimiento" })} className="py-3 rounded-xl bg-orange-50 dark:bg-orange-950 text-sm font-medium">Brote crec.</button>
              </div>
            )}
            <button onClick={() => setModal(null)} className="mt-3 w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {preguntaModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setPreguntaModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
              {preguntaModal.icono ? `${preguntaModal.icono} ` : ""}
              {preguntaModal.texto}
            </p>
            {preguntaModal.tipo_entrada === "foto" ? (
              <FotoCampo
                valor=""
                onChange={(url) => {
                  if (url) responderPreguntaRapida(preguntaModal.id, url);
                }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {preguntaModal.tipo_entrada === "toggle" ? (
                  <>
                    <button
                      onClick={() => responderPreguntaRapida(preguntaModal.id, "true")}
                      className="py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-sm font-medium"
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => responderPreguntaRapida(preguntaModal.id, "false")}
                      className="py-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-sm font-medium"
                    >
                      No
                    </button>
                  </>
                ) : (
                  (preguntaModal.opciones ?? []).map((o) => (
                    <button
                      key={o}
                      onClick={() => responderPreguntaRapida(preguntaModal.id, o)}
                      className="py-3 rounded-xl bg-violet-50 dark:bg-violet-950 text-sm font-medium"
                    >
                      {o}
                    </button>
                  ))
                )}
              </div>
            )}
            <button onClick={() => setPreguntaModal(null)} className="mt-3 w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500">
              Cancelar
            </button>
          </div>
        </div>
      )}
      {pending && <p className="text-[11px] text-slate-400 mt-2">Guardando…</p>}
    </div>
  );
}