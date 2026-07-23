import { getSessionContext } from "@/lib/familia";
import { createClient } from "@/lib/supabase/server";
import FamiliaForm from "@/components/admin/FamiliaForm";
import MembersManager from "@/components/admin/MembersManager";
import type { MiembroFamilia } from "@/lib/supabase/types";

export default async function AdminFamiliaPage() {
  const { userId, familia } = await getSessionContext();
  const isOwner = familia.owner_user_id === userId;

  const supabase = await createClient();
  const { data: miembros } = await supabase
    .from("miembros_familia")
    .select("*")
    .eq("familia_id", familia.id)
    .order("creado_en", { ascending: true });

  return (
    <div className="space-y-4">
      {isOwner && <FamiliaForm nombreInicial={familia.nombre} />}
      <MembersManager miembros={(miembros ?? []) as MiembroFamilia[]} isOwner={isOwner} ownerUserId={familia.owner_user_id} />
    </div>
  );
}
