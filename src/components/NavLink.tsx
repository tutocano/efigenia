"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

export function SidebarNavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm flex items-center transition-colors ${
        active
          ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium"
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </Link>
  );
}

export function BottomNavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={`flex flex-col items-center text-[10px] gap-0.5 px-2 py-1 transition-transform active:scale-90 ${
        active ? "text-indigo-600 dark:text-indigo-400 font-medium" : "text-slate-500 dark:text-slate-400"
      }`}
    >
      <span className={`text-lg transition-transform ${active ? "scale-110" : ""}`}>{icon}</span>
      {label}
    </Link>
  );
}