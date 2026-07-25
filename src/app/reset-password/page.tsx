"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Al llegar aquí, la sesión ya debería estar establecida por la ruta
  // /auth/confirm (verifica el enlace en el servidor y guarda la sesión en
  // una cookie normal antes de redirigir para acá). Aquí solo confirmamos
  // que la sesión exista. Se dejan un par de casos de respaldo por si llega
  // un enlace de un formato viejo (correo enviado antes de este cambio).
  useEffect(() => {
    const url = new URL(window.location.href);
    const errorParam = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const hash = window.location.hash;

    if (errorParam) {
      setLinkError(errorParam);
      setReady(true);
      return;
    }

    if (hash.includes("error=")) {
      const params = new URLSearchParams(hash.slice(1));
      setLinkError(
        params.get("error_description")?.replace(/\+/g, " ") ??
          "El enlace no es válido o ya expiró."
      );
      setReady(true);
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setLinkError(
            "Este enlace se abrió en una app/navegador distinto al que lo pidió. Pide uno nuevo y ábrelo tocando 'Abrir en Safari' (o tu navegador) en vez de dejarlo abrir dentro de la app de correo."
          );
        }
        setReady(true);
      });
      return;
    }

    let cancelled = false;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setReady(true);
        return;
      }
      setTimeout(async () => {
        const retry = await supabase.auth.getSession();
        if (cancelled) return;
        if (retry.data.session) {
          setReady(true);
        } else {
          setLinkError(
            "No encontramos una sesión activa para este enlace. Pide uno nuevo y ábrelo apenas te llegue."
          );
          setReady(true);
        }
      }, 1200);
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/dashboard"), 1500);
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="text-center mb-6">
          <span className="text-3xl">🍼</span>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-1">Efigenia</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Elegir nueva contraseña</p>
        </div>

        {!ready && <p className="text-sm text-slate-500 text-center">Verificando enlace…</p>}

        {ready && linkError && (
          <div className="text-center space-y-3">
            <p className="text-sm text-rose-500">{linkError}</p>
            <p className="text-xs text-slate-400">
              Pide un enlace nuevo desde{" "}
              <a href="/forgot-password" className="text-indigo-600 dark:text-indigo-400 font-medium">
                recuperar contraseña
              </a>{" "}
              y ábrelo apenas te llegue.
            </p>
          </div>
        )}

        {ready && !linkError && !done && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Contraseña nueva"
              required
              className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              placeholder="Repite la contraseña"
              required
              className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
            >
              {pending ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}

        {done && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center">
            Contraseña actualizada. Entrando…
          </p>
        )}
      </div>
    </main>
  );
}