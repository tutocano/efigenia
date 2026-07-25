import { redirect } from "next/navigation";

// La raíz del sitio no tiene contenido propio: siempre redirige al dashboard
// real (con su menú, selector de hijo, etc.). Si no hay sesión, la propia
// carga de /dashboard (getSessionContext) redirige a /login.
export default function RootPage() {
  redirect("/dashboard");
}
