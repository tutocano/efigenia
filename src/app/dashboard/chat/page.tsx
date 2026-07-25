import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/familia";
import { createClient } from "@/lib/supabase/server";
import { getHijos, pickActiveChild, estadoTexto } from "@/lib/hijos";
import ChatPanel, { type ChatMsg } from "@/components/ChatPanel";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ hijo?: string }>;
}) {
  const { familia, miembro } = await getSessionContext();
  if (miembro.permiso === "lector") redirect("/dashboard");

  const params = await searchParams;
  const hijos = await getHijos(familia.id);
  const hijo = pickActiveChild(hijos, params.hijo);

  const supabase = await createClient();
  const { data: mensajes } = hijo
    ? await supabase
        .from("mensajes_chat_ia")
        .select("id, autor, contenido")
        .eq("hijo_id", hijo.id)
        .order("creado_en", { ascending: true })
        .limit(50)
    : { data: [] };

  const historial: ChatMsg[] =
    mensajes && mensajes.length > 0
      ? (mensajes as ChatMsg[])
      : [
          {
            id: "bienvenida",
            autor: "ia",
            contenido: "Hola, soy tu asistente de Efigenia. Cuéntame qué duda tienes hoy.",
          },
        ];

  return (
    <div>
      <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 rounded-xl p-3 mb-3 text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
        Contexto activo: {hijo ? `${hijo.nombre}, ${estadoTexto(hijo)}` : "sin hijo seleccionado"}
      </div>
      <ChatPanel hijoId={hijo?.id ?? null} mensajesIniciales={historial} />
    </div>
  );
}
