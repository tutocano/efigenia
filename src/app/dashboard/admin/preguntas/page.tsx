import { getSessionContext, esAdminDePreguntas } from "@/lib/familia";
import { createClient } from "@/lib/supabase/server";
import PreguntasManager from "@/components/admin/PreguntasManager";
import type { PreguntaDinamica } from "@/lib/supabase/types";

export default async function AdminPreguntasPage() {
  const ctx = await getSessionContext();
  const { familia } = ctx;
  const supabase = await createClient();
  const { data: preguntas } = await supabase
    .from("preguntas_dinamicas")
    .select("*")
    .eq("familia_id", familia.id)
    .order("orden", { ascending: true });

  return <PreguntasManager preguntas={(preguntas ?? []) as PreguntaDinamica[]} canWrite={esAdminDePreguntas(ctx)} />;
}