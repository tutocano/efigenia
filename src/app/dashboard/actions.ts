"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/familia";
import type { TipoRegistro } from "@/lib/supabase/types";

export async function registrarActividad(input: {
  hijoId: string;
  tipo: TipoRegistro;
  detalle: Record<string, unknown>;
  horaInicio?: string;
  horaFin?: string;
}) {
  const { miembro, familia } = await requireEditor();
  const supabase = await createClient();
  const { error } = await supabase.from("registros").insert({
    familia_id: familia.id,
    hijo_id: input.hijoId,
    miembro_id: miembro.id,
    tipo: input.tipo,
    detalle: input.detalle,
    hora_inicio: input.horaInicio ?? new Date().toISOString(),
    hora_fin: input.horaFin ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function eliminarRegistro(id: string) {
  const { familia } = await requireEditor();
  const supabase = await createClient();
  const { error } = await supabase.from("registros").delete().eq("id", id).eq("familia_id", familia.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historial");
  revalidatePath("/dashboard/semana");
}

export async function eliminarRespuestaPregunta(id: string) {
  const { familia } = await requireEditor();
  const supabase = await createClient();
  const { error } = await supabase.from("respuestas_preguntas").delete().eq("id", id).eq("familia_id", familia.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historial");
  revalidatePath("/dashboard/padres");
}

export async function guardarRespuestasGuiadas(
  hijoId: string | null,
  respuestas: { preguntaId: string; valor: string; respondidoEn?: string }[]
) {
  const { miembro, familia } = await requireEditor();
  const supabase = await createClient();
  const rows = respuestas
    .filter((r) => r.valor !== "" && r.valor !== undefined)
    .map((r) => ({
      pregunta_id: r.preguntaId,
      familia_id: familia.id,
      hijo_id: hijoId,
      miembro_id: miembro.id,
      valor: r.valor,
      // Si el usuario no eligió una hora específica (doble clic / mantener
      // presionado sobre la pregunta), se guarda con la hora actual.
      respondido_en: r.respondidoEn || new Date().toISOString(),
    }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("respuestas_preguntas").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/padres");
}

export async function guardarBienestar(input: {
  horasSueno?: number;
  estadoAnimo?: string;
  comioBien?: boolean;
  tomoAguaSuficiente?: boolean;
  notaRapida?: string;
}) {
  const { miembro, familia } = await requireEditor();
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("bienestar_padres").upsert(
    {
      familia_id: familia.id,
      miembro_id: miembro.id,
      fecha: hoy,
      horas_sueno: input.horasSueno ?? null,
      estado_animo: input.estadoAnimo ?? null,
      comio_bien: input.comioBien ?? null,
      tomo_agua_suficiente: input.tomoAguaSuficiente ?? null,
      nota_rapida: input.notaRapida ?? null,
    },
    { onConflict: "miembro_id,fecha" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/padres");
}

export async function enviarMensajeChat(hijoId: string | null, contenido: string): Promise<string> {
  const { miembro, familia } = await requireEditor();
  const supabase = await createClient();

  await supabase.from("mensajes_chat_ia").insert({
    familia_id: familia.id,
    hijo_id: hijoId,
    autor: "padre",
    miembro_id: miembro.id,
    contenido,
  });

  const respuesta = generarRespuestaIA(contenido);

  await supabase.from("mensajes_chat_ia").insert({
    familia_id: familia.id,
    hijo_id: hijoId,
    autor: "ia",
    contenido: respuesta,
  });

  revalidatePath("/dashboard/chat");
  return respuesta;
}

// Respuesta simulada: útil para probar el flujo sin depender de una API key.
// Para conectar un modelo real, sustituye este cuerpo por una llamada a la
// API de Claude (u otro proveedor) usando una variable de entorno server-only
// (nunca expongas la API key al cliente).
function generarRespuestaIA(texto: string): string {
  const t = texto.toLowerCase();
  const disclaimer = " Recuerda que esto no reemplaza una consulta con el pediatra.";
  if (t.includes("cólico") || t.includes("colico")) {
    return (
      "Los cólicos suelen mejorar con masajes circulares en la barriga, la postura boca abajo sobre el antebrazo y pausas para eructar durante la toma. Si el llanto se vuelve inconsolable o hay fiebre, contacta al pediatra." +
      disclaimer
    );
  }
  if (t.includes("sueño") || t.includes("dormir") || t.includes("duerme")) {
    return (
      "A esta edad es normal que el sueño aún sea irregular. Una rutina corta antes de la siesta (luz baja, sonido blanco) puede ayudar a que se calme más rápido." +
      disclaimer
    );
  }
  if (t.includes("fiebre")) {
    return (
      "Si la temperatura supera 38°C en un bebé menor de 3 meses, se recomienda contactar al pediatra de inmediato, no solo observar en casa." +
      disclaimer
    );
  }
  return (
    "Gracias por contarme. Con lo que sé de las últimas horas no veo señales de alarma, pero cuéntame más detalles si quieres que profundice." +
    disclaimer
  );
}