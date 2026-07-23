import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/familia";
import { createClient } from "@/lib/supabase/server";
import BienestarForm from "@/components/BienestarForm";
import GuidedQuestions from "@/components/GuidedQuestions";
import { rolLabels } from "@/lib/supabase/types";
import type { BienestarPadre, PreguntaDinamica } from "@/lib/supabase/types";

export default async function PadresPage() {
  const { miembro, familia } = await getSessionContext();
  if (miembro.permiso === "lector") redirect("/dashboard");

  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [{ data: miembros }, { data: bienestarHoy }, { data: miBienestar }, { data: preguntasRol }, { data: preguntasGeneral }] =
    await Promise.all([
      supabase.from("miembros_familia").select("*").eq("familia_id", familia.id).neq("rol", "familiar"),
      supabase.from("bienestar_padres").select("*, miembros_familia(nombre)").eq("familia_id", familia.id).eq("fecha", hoy),
      supabase.from("bienestar_padres").select("*").eq("miembro_id", miembro.id).eq("fecha", hoy).maybeSingle(),
      miembro.rol === "padre_madre_1" || miembro.rol === "padre_madre_2"
        ? supabase
            .from("preguntas_dinamicas")
            .select("*")
            .eq("familia_id", familia.id)
            .eq("categoria", miembro.rol)
            .eq("activa", true)
            .order("orden", { ascending: true })
        : Promise.resolve({ data: [] as PreguntaDinamica[] }),
      supabase
        .from("preguntas_dinamicas")
        .select("*")
        .eq("familia_id", familia.id)
        .eq("categoria", "general")
        .eq("activa", true)
        .order("orden", { ascending: true }),
    ]);

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cuidado de los cuidadores</p>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          {miembro.nombre} <span className="text-slate-400 font-normal">· {rolLabels[miembro.rol]} · Tú</span>
        </p>
        <BienestarForm inicial={(miBienestar as BienestarPadre) ?? null} />
        {(preguntasRol as PreguntaDinamica[]).length > 0 && (
          <div className="mt-3">
            <GuidedQuestions hijoId={null} preguntas={preguntasRol as PreguntaDinamica[]} />
          </div>
        )}
      </div>

      {(preguntasGeneral as PreguntaDinamica[])?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">General</p>
          <GuidedQuestions hijoId={null} preguntas={preguntasGeneral as PreguntaDinamica[]} />
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Estado de hoy de toda la familia</p>
        <div className="space-y-2">
          {(miembros ?? [])
            .filter((m) => m.id !== miembro.id)
            .map((m) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const registro = (bienestarHoy as any[] | null)?.find((b) => b.miembro_id === m.id);
              return (
                <div key={m.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs">
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    {m.nombre} <span className="text-slate-400 font-normal">· {rolLabels[m.rol as keyof typeof rolLabels]}</span>
                  </p>
                  {registro ? (
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      {registro.horas_sueno != null ? `${registro.horas_sueno}h de sueño · ` : ""}
                      {registro.estado_animo ?? "sin ánimo registrado"}
                      {registro.nota_rapida ? ` · "${registro.nota_rapida}"` : ""}
                    </p>
                  ) : (
                    <p className="text-slate-400 mt-0.5">Todavía no ha registrado su estado de hoy.</p>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
