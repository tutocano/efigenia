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
    return <p className="text-sm text-slate-500 dark:text-slate-400">Agrega un hijo para ver sus tendencias semanales.</p>;
  }

  const supabase = await createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - 6);
  desde.setHours(0, 0, 0, 0);

  const [{ data: registrosSueno }, { data: registrosSalud }, { data: miembros }, { data: bienestar }] = await Promise.all([
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
  ]);

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
