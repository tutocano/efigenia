import Link from "next/link";
import { getSessionContext } from "@/lib/familia";
import { createClient } from "@/lib/supabase/server";
import { getHijos, pickActiveChild, edadTexto } from "@/lib/hijos";
import QuickActions from "@/components/QuickActions";
import GuidedQuestions from "@/components/GuidedQuestions";
import type { PreguntaDinamica } from "@/lib/supabase/types";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ hijo?: string }>;
}) {
  const { familia, miembro } = await getSessionContext();
  const params = await searchParams;
  const hijos = await getHijos(familia.id);
  const hijo = pickActiveChild(hijos, params.hijo);
  const isViewer = miembro.permiso === "lector";

  if (!hijo) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Todavía no hay hijos registrados.{" "}
        <Link href="/dashboard/admin/hijos" className="text-indigo-600 dark:text-indigo-400 font-medium">
          Agrega uno en Panel admin → Hijos
        </Link>
        .
      </div>
    );
  }

  const supabase = await createClient();
  const { data: registros } = await supabase
    .from("registros")
    .select("*, miembros_familia(nombre)")
    .eq("hijo_id", hijo.id)
    .order("hora_inicio", { ascending: false })
    .limit(6);

  const { data: preguntas } = await supabase
    .from("preguntas_dinamicas")
    .select("*")
    .eq("familia_id", familia.id)
    .eq("categoria", "bebe")
    .eq("activa", true)
    .order("orden", { ascending: true });

  const todasPreguntas = (preguntas ?? []) as PreguntaDinamica[];
  const preguntasRapidas = todasPreguntas.filter((p) => p.es_accion_rapida);
  const preguntasGuiadas = todasPreguntas.filter((p) => !p.es_accion_rapida);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl p-4 text-white">
        <p className="text-xs opacity-80">
          {hijo.nombre} · {edadTexto(hijo.fecha_nacimiento)}
        </p>
        <p className="text-sm mt-2 opacity-90">
          {registros?.length ?? 0} registro{registros?.length === 1 ? "" : "s"} reciente
          {registros?.length === 1 ? "" : "s"}
        </p>
      </div>

      {isViewer && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 rounded-xl px-3 py-2">
          Tu cuenta es de solo lectura: puedes ver el resumen y las tendencias, pero no registrar datos.
        </p>
      )}

      {!isViewer && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Acciones rápidas</p>
          <QuickActions hijoId={hijo.id} preguntasRapidas={preguntasRapidas} />
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Actividad reciente</p>
        <div className="space-y-2">
          {(registros ?? []).map((r) => (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <RegistroRow key={r.id} registro={r as any} />
          ))}
          {(!registros || registros.length === 0) && (
            <p className="text-xs text-slate-400">Todavía no hay registros para {hijo.nombre}.</p>
          )}
        </div>
      </div>

      {!isViewer && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Preguntas de seguimiento <span className="text-slate-400 font-normal">(definidas en el Panel admin)</span>
          </p>
          <GuidedQuestions hijoId={hijo.id} preguntas={preguntasGuiadas} />
        </div>
      )}
    </div>
  );
}

const iconos: Record<string, string> = { sueno: "😴", alimentacion: "🍼", panal: "🧷", salud: "🌡️", animo: "😢" };

function resumenRegistro(tipo: string, detalle: Record<string, unknown>): string {
  switch (tipo) {
    case "sueno":
      return `Siesta: ${detalle.duracion_minutos ?? "?"} min`;
    case "alimentacion":
      return `Alimentación: ${detalle.tipo ?? ""}${detalle.lado ? ` (${detalle.lado})` : ""}`;
    case "panal":
      return `Pañal: ${detalle.tipo ?? ""}`;
    case "salud":
      return `Malestar: ${detalle.malestar ?? ""}`;
    case "animo":
      return detalle.nivel_llanto ? `Llanto: ${detalle.nivel_llanto}` : "Juego / tummy time";
    default:
      return "Registro";
  }
}

function RegistroRow({
  registro,
}: {
  registro: {
    id: string;
    tipo: string;
    detalle: Record<string, unknown>;
    hora_inicio: string;
    miembros_familia?: { nombre?: string } | null;
  };
}) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
      <span className="text-lg">{iconos[registro.tipo] ?? "📝"}</span>
      <div className="flex-1">
        <p className="text-xs text-slate-700 dark:text-slate-200">{resumenRegistro(registro.tipo, registro.detalle)}</p>
        <p className="text-[10px] text-slate-400">
          {new Date(registro.hora_inicio).toLocaleString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          })}
          {registro.miembros_familia?.nombre ? ` · ${registro.miembros_familia.nombre}` : ""}
        </p>
      </div>
    </div>
  );
}