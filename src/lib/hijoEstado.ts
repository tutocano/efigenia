import type { Hijo } from "./supabase/types";

// Funciones puras sobre `Hijo` (sin acceso a base de datos), pensadas para
// poder importarse también desde componentes de cliente. Viven en un archivo
// separado de lib/hijos.ts porque ese archivo importa el cliente de Supabase
// para servidor (que usa next/headers) — si un componente de cliente
// importa cualquier cosa de ahí, arrastra ese código de servidor y Next.js
// falla al compilar. Este archivo no importa nada de servidor.

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

// Un hijo está "en gestación" mientras no tenga fecha de nacimiento.
export function estaEnGestacion(hijo: Pick<Hijo, "fecha_nacimiento">): boolean {
  return !hijo.fecha_nacimiento;
}

// Versión null-safe de edadTexto: si el hijo todavía no nace, muestra las
// semanas de gestación (a partir de la FPP, si existe) en vez de la edad.
export function estadoTexto(hijo: Pick<Hijo, "fecha_nacimiento" | "fecha_probable_parto">): string {
  if (hijo.fecha_nacimiento) return edadTexto(hijo.fecha_nacimiento);
  if (hijo.fecha_probable_parto) {
    // FPP - 280 días ≈ fecha de última regla estimada.
    const fur = new Date(hijo.fecha_probable_parto).getTime() - 280 * 86400000;
    const semanas = Math.max(0, Math.floor((Date.now() - fur) / (7 * 86400000)));
    return `semana ${semanas} de embarazo`;
  }
  return "en gestación";
}
