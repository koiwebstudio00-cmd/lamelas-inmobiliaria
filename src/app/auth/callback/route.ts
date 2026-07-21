import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Supabase auth callback handler.
 * Intercambia el ?code= (PKCE) por una sesión y redirige al destino.
 * Usado por el flujo de recuperación de contraseña.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/propiedades";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si falla: link inválido o expirado
  return NextResponse.redirect(`${origin}/recuperar?error=link-invalido`);
}
