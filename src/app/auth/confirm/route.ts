import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// El enlace de recuperación de contraseña apunta aquí primero (en vez de
// directo a /reset-password). Esta ruta corre en el servidor y verifica el
// token ahí mismo, guardando la sesión en una cookie normal de respuesta
// (Set-Cookie) — esto es mucho más confiable que hacerlo desde el navegador,
// y funciona sin importar en qué app/navegador se abra el enlace del correo.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/reset-password";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/reset-password?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/reset-password?error=${encodeURIComponent("Enlace inválido o incompleto.")}`
  );
}