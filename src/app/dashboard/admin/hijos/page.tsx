import { getSessionContext } from "@/lib/familia";
import { getHijos } from "@/lib/hijos";
import HijosManager from "@/components/admin/HijosManager";

export default async function AdminHijosPage() {
  const { familia, miembro } = await getSessionContext();
  const hijos = await getHijos(familia.id);
  return <HijosManager hijos={hijos} canWrite={miembro.permiso === "editor"} />;
}
