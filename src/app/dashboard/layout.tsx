import Link from "next/link";
import { getSessionContext } from "@/lib/familia";
import { getHijos } from "@/lib/hijos";
import { logout } from "@/app/login/actions";
import { rolLabels } from "@/lib/supabase/types";
import { SidebarNavLink, BottomNavLink } from "@/components/NavLink";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { miembro, familia } = await getSessionContext();
  const hijos = await getHijos(familia.id);
  const isViewer = miembro.permiso === "lector";

  const navItems = [
    { href: "/dashboard", label: "Inicio", icon: "🏠" },
    { href: "/dashboard/historial", label: "Historial", icon: "📜" },
    ...(isViewer ? [] : [{ href: "/dashboard/padres", label: "Padres", icon: "🧑‍🧑‍🧒" }]),
    { href: "/dashboard/semana", label: "Semana", icon: "📊" },
    ...(isViewer ? [] : [{ href: "/dashboard/chat", label: "Chat IA", icon: "💬" }]),
    { href: "/dashboard/admin", label: "Admin", icon: "⚙️" },
  ];

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:border-r md:border-slate-200 md:dark:border-slate-800 md:bg-white md:dark:bg-slate-900 md:p-4 md:gap-1">
        <div className="mb-4">
          <p className="font-semibold text-slate-800 dark:text-slate-100">🍼 Efigenia</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{familia.nombre}</p>
        </div>
        {navItems.map((item) => (
          <SidebarNavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
        ))}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-medium text-slate-700 dark:text-slate-200">{miembro.nombre}</p>
          <p>{rolLabels[miembro.rol]}</p>
          <form action={logout}>
            <button type="submit" className="mt-2 text-rose-500 font-medium">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-dvh">
        {/* Header móvil */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">🍼 {familia.nombre}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {miembro.nombre} · {rolLabels[miembro.rol]}
            </p>
          </div>
          <form action={logout}>
            <button type="submit" className="text-xs text-rose-500 font-medium">
              Salir
            </button>
          </form>
        </header>

        {/* Selector de hijo (se conserva la ruta actual, solo cambia ?hijo=) */}
        {hijos.length > 0 && (
          <div className="px-4 pt-3 flex gap-2 overflow-x-auto">
            {hijos.map((h) => (
              <Link
                key={h.id}
                href={`?hijo=${h.id}`}
                className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                {h.sexo === "masculino" ? "👦" : h.sexo === "femenino" ? "👧" : "🤰"} {h.nombre}
              </Link>
            ))}
          </div>
        )}

        <main className="flex-1 p-4 pb-24 md:pb-6 w-full max-w-2xl mx-auto md:mx-0 md:max-w-3xl">{children}</main>

        {/* Nav inferior móvil */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-around py-2"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {navItems.map((item) => (
            <BottomNavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </nav>
      </div>
    </div>
  );
}