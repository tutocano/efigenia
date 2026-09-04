"use client";

import { useEffect, useRef } from "react";
import { logout } from "@/app/login/actions";

// Cierra la sesión sola después de 20 minutos sin actividad (sin mover el
// mouse, tocar la pantalla ni escribir). Cualquier interacción reinicia el
// contador.
const LIMITE_MS = 20 * 60 * 1000;

export default function IdleLogout() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function reiniciarContador() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        logout();
      }, LIMITE_MS);
    }

    const eventos = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    eventos.forEach((evento) => window.addEventListener(evento, reiniciarContador));
    reiniciarContador();

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, reiniciarContador));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
}
