import Link from "next/link";
import { getSessionContext } from "@/lib/familia";
import { createClient } from "@/lib/supabase/server";
import { getHijos, pickActiveChild } from "@/lib/hijos";
import WeeklyCharts, { type DiaSueno, type DiaColico, type DiaSuenoPadres } from "@/components/WeeklyCharts";

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function SemanaPage({
  searchParams,
}: {
  searchParams: Promise<{ hijo?: string }>;
}) {
  const { familia } = await getSessionContext();
  const params = await searchParams;
  const hijos = await getHijos(familia.id);
  const hijo = pickActiveChild(hijos, params.hijo);

  if (!hijo) {
    return (
      <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Todavía no hay ningún hijo agregado</p>
        <p className="text-xs text-slate-400 mt-1">
          Ve a{" "}
          <Link href="/dashboard/admin/hijos" className="text-indigo-600 dark:text-indigo-400 font-medium">
            Panel admin → Hijos
          </Link>{" "}
          para agregar uno y ver sus tendencias semanales.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - 6);
  desde.setHours(0, 0, 0, 0);

  const [{ data: registrosSueno }, { data: registrosSalud }, { data: miembros }, { data: bienestar }, { data: respuestasSemana }] =
    await Promise.all([
      supabase
        .from("registros")
        .select("detalle, hora_inicio")
        .eq("hijo_id", hijo.id)
        .eq("tipo", "sueno")
        .gte("hora_inicio", desde.toISOString()),
      supabase
        .from("registros")
        .select("detalle, hora_inicio")
        .eq("hijo_id", hijo.id)
        .eq("tipo", "salud")
        .gte("hora_inicio", desde.toISOString()),
      supabase.from("miembros_familia").select("id, nombre, rol").eq("familia_id", familia.id).in("rol", ["padre_madre_1", "padre_madre_2"]),
      supabase
        .from("bienestar_padres")
        .select("miembro_id, horas_sueno, fecha")
        .eq("familia_id", familia.id)
        .gte("fecha", desde.toISOString().slice(0, 10)),
      // Cualquier respuesta a preguntas dinámicas (incluye las de Embarazo/Madre,
      // que son las que sí aplican mientras el hijo todavía no nace). Se usa
      // solo para saber si hubo actividad esta semana, no se grafica.
      supabase
        .from("respuestas_preguntas")
        .select("id")
        .eq("hijo_id", hijo.id)
        .gte("respondido_en", desde.toISOString()),
    ]);

  const sinDatos =
    (registrosSueno ?? []).length === 0 &&
    (registrosSalud ?? []).length === 0 &&
    (bienestar ?? []).length === 0 &&
    (respuestasSemana ?? []).length === 0;

  if (sinDatos) {
    return (
      <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Todavía no hay datos de esta semana para {hijo.nombre}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Registra actividades desde{" "}
          <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 font-medium">
            Inicio
          </Link>{" "}
          y las gráficas van a empezar a llenarse.
        </p>
      </div>
    );
  }

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(desde);
    d.setDate(desde.getDate() + i);
    return d;
  });
  const claveDia = (d: Date) => d.toISOString().slice(0, 10);

  const sueno: DiaSueno[] = dias.map((d) => {
    const clave = claveDia(d);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const minutos = (registrosSueno ?? [])
      .filter((r: any) => r.hora_inicio.slice(0, 10) === clave)
      .reduce((acc: number, r: any) => acc + (Number(r.detalle?.duracion_minutos) || 0), 0);
    return { dia: DIAS_CORTOS[d.getDay()], horas: Math.round((minutos / 60) * 10) / 10 };
  });

  const colico: DiaColico[] = dias.map((d) => {
    const clave = claveDia(d);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const episodios = (registrosSalud ?? []).filter(
      (r: any) => r.hora_inicio.slice(0, 10) === clave && r.detalle?.malestar === "colico"
    ).length;
    return { dia: DIAS_CORTOS[d.getDay()], episodios };
  });

  const nombresPadres = (miembros ?? []).map((m) => m.nombre);
  const suenoPadres: DiaSuenoPadres[] = dias.map((d) => {
    const clave = claveDia(d);
    const fila: DiaSuenoPadres = { dia: DIAS_CORTOS[d.getDay()] };
    for (const m of miembros ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const registro = (bienestar as any[] | null)?.find((b) => b.miembro_id === m.id && b.fecha === clave);
      fila[m.nombre] = registro?.horas_sueno ?? 0;
    }
    return fila;
  });

  return <WeeklyCharts sueno={sueno} colico={colico} suenoPadres={suenoPadres} nombresPadres={nombresPadres} />;
}