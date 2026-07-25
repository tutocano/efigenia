"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="text-center mb-6">
          <span className="text-3xl">🍼</span>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-1">Efigenia</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Recuperar contraseña</p>
        </div>

        {sent ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
            Te enviamos un correo a <span className="font-medium">{email}</span>. Ábrelo y haz clic en el
            enlace pronto (el enlace expira después de un rato) para elegir una contraseña nueva.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Correo de tu cuenta"
              required
              className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}

        <p className="text-xs text-slate-400 text-center mt-4">
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}