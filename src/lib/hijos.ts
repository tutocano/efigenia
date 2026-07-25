import { createClient } from "./supabase/server";
import type { Hijo } from "./supabase/types";

export async function getHijos(familiaId: string): Promise<Hijo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hijos")
    .select("*")
    .eq("familia_id", familiaId)
    .eq("activo", true)
    .order("creado_en", { ascending: true });
  return (data ?? []) as Hijo[];
}

// Re-exporta las funciones puras (sin dependencias de servidor) para que el
// resto del código siga pudiendo importarlas desde "@/lib/hijos" como antes.
// Los componentes de CLIENTE deben importarlas directo desde "@/lib/hijoEstado"
// en vez de este archivo, para no arrastrar el cliente de Supabase de servidor.
export { pickActiveChild, edadTexto, estaEnGestacion, estadoTexto } from "./hijoEstado";
