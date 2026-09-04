import Link from "next/link";
import { getSessionContext } from "@/lib/familia";
import { createClient } from "@/lib/supabase/server";
import { getHijos, pickActiveChild } from "@/lib/hijos";
import HistorialRow from "@/components/HistorialRow";

const iconosRegistro: Record<string, string> = {
  sueno: "😴",
  alimentacion: "🍼",
  panal: "🧷",
  salud: "🌡️",
  animo: "😢",
};

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

interface ItemHistorial {
  id: string;
  kind: "registro" | "respuesta";
  rawId: string;
  momento: string;
  icono: string;
  texto: string;
  autor: string | null;
  fotoUrl?: string | null;
  etiqueta: string;
}

// Lunes de la semana calendario a la que pertenece `fecha` (para agrupar).
function inicioDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0 = domingo … 6 = sábado
  const diff = (dia === 0 ? -6 : 1) - dia; // retrocede hasta el lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ hijo?: string }>;
}) {
  const { familia, miembro } = await getSessionContext();
  const canDelete = miembro.permiso === "editor";
  const params = await searchParams;
  const hijos = await getHijos(familia.id);
  const hijo = pickActiveChild(hijos, params.hijo);

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
    .limit(100);

  const { data: respuestas } = await supabase
    .from("respuestas_preguntas")
    .select("*, preguntas_dinamicas!inner(texto, icono, tipo_entrada, categoria), miembros_familia(nombre)")
    .eq("hijo_id", hijo.id)
    .in("preguntas_dinamicas.categoria", ["bebe", "embarazo", "madre"])
    .order("respondido_en", { ascending: false })
    .limit(150);

  const itemsRegistros: ItemHistorial[] = (registros ?? []).map((r: any) => ({
    id: `registro-${r.id}`,
    kind: "registro" as const,
    rawId: r.id as string,
    momento: r.hora_inicio,
    icono: iconosRegistro[r.tipo] ?? "📝",
    texto: resumenRegistro(r.tipo, r.detalle),
    autor: r.miembros_familia?.nombre ?? null,
    etiqueta: "Bebé",
  }));

  const etiquetaPorCategoria: Record<string, string> = {
    bebe: "Bebé",
    embarazo: "Bebé en gestación",
    madre: "Madre",
  };

  const itemsRespuestas: ItemHistorial[] = (respuestas ?? []).map((r: any) => {
    const pregunta = r.preguntas_dinamicas;
    const esFoto = pregunta?.tipo_entrada === "foto";
    const valor = pregunta?.tipo_entrada === "toggle" ? (r.valor === "true" ? "Sí" : "No") : r.valor;
    return {
      id: `respuesta-${r.id}`,
      kind: "respuesta" as const,
      rawId: r.id as string,
      momento: r.respondido_en ?? r.creado_en,
      icono: pregunta?.icono || "📝",
      texto: esFoto ? pregunta?.texto ?? "Foto" : `${pregunta?.texto ?? "Pregunta"}: ${valor}`,
      autor: r.miembros_familia?.nombre ?? null,
      fotoUrl: esFoto ? r.valor : null,
      etiqueta: etiquetaPorCategoria[pregunta?.categoria] ?? "Bebé",
    };
  });

  const items = [...itemsRegistros, ...itemsRespuestas].sort(
    (a, b) => new Date(b.momento).getTime() - new Date(a.momento).getTime()
  );

  // Agrupa por semana calendario (lunes a domingo) para que el historial no
  // quede demasiado largo, conservando el orden ya descendente.
  const claveSemanaActual = inicioDeSemana(new Date()).toLocaleDateString("en-CA");
  const grupos: { clave: string; etiqueta: string; items: ItemHistorial[] }[] = [];
  for (const item of items) {
    const inicio = inicioDeSemana(new Date(item.momento));
    const clave = inicio.toLocaleDateString("en-CA"); // YYYY-MM-DD del lunes, estable para agrupar
    let grupo = grupos.find((g) => g.clave === clave);
    if (!grupo) {
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 6);
      const formatoCorto = (d: Date) => d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
      let etiqueta = `Semana del ${formatoCorto(inicio)} al ${formatoCorto(fin)}`;
      if (clave === claveSemanaActual) etiqueta = `Esta semana · ${etiqueta}`;
      grupo = { clave, etiqueta, items: [] };
      grupos.push(grupo);
    }
    grupo.items.push(item);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">Historial de {hijo.nombre}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Todo junto y en orden, agrupado por semana: bebé, bebé en gestación y madre.
        </p>
      </div>

      {grupos.map((grupo) => (
        <div key={grupo.clave}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{grupo.etiqueta}</p>
          <div className="space-y-2">
            {grupo.items.map((item) => (
              <HistorialRow
                key={item.id}
                kind={item.kind}
                rawId={item.rawId}
                icono={item.icono}
                texto={item.texto}
                momento={item.momento}
                autor={item.autor}
                canDelete={canDelete}
                fotoUrl={item.fotoUrl}
                etiqueta={item.etiqueta}
              />
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <p className="text-3xl mb-2">📜</p>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Todavía no hay nada registrado para {hijo.nombre}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Ve a{" "}
            <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 font-medium">
              Inicio
            </Link>{" "}
            y registra la primera actividad — aparecerá aquí al instante.
          </p>
        </div>
      )}
    </div>
  );
}