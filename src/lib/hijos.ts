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

export function pickActiveChild(hijos: Hijo[], hijoIdParam?: string): Hijo | null {
  if (hijoIdParam) {
    const found = hijos.find((h) => h.id === hijoIdParam);
    if (found) return found;
  }
  return hijos[0] ?? null;
}

export function edadTexto(fechaISO: string): string {
  const dias = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 86400000);
  if (dias < 0) return "recién nacido";
  const meses = Math.floor(dias / 30);
  const diasRest = dias % 30;
  return meses > 0 ? `${meses} meses, ${diasRest} días` : `${dias} días`;
}
