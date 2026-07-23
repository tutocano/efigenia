import Link from "next/link";
import { getSessionContext } from "@/lib/familia";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, familia } = await getSessionContext();
  const isOwner = familia.owner_user_id === userId;

  const tabs = [
    { href: "/dashboard/admin", label: "Familia y miembros" },
    { href: "/dashboard/admin/hijos", label: "Hijos" },
    { href: "/dashboard/admin/preguntas", label: "Preguntas" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Panel admin</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Accesible desde el móvil y desktop para cualquier miembro de {familia.nombre}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-full p-1 inline-flex flex-wrap gap-1 text-sm shadow-sm border border-slate-200 dark:border-slate-700">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="px-4 py-1.5 rounded-full font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            {t.label}
          </Link>
        ))}
      </div>

      {!isOwner && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 rounded-xl px-3 py-2">
          Solo quien creó la familia puede renombrarla o administrar miembros y contraseñas. Tú sí puedes gestionar hijos y preguntas.
        </p>
      )}

      {children}
    </div>
  );
}
