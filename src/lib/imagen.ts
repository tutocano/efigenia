"use client";

// Comprime y redimensiona una imagen en el navegador antes de subirla, usando
// <canvas> nativo (sin dependencias externas). Las fotos de celulares modernos
// suelen pesar 3-8 MB; después de esto quedan típicamente en 150-400 KB,
// lo que baja el costo de storage y acelera la subida en redes lentas.
export async function comprimirImagen(
  archivo: File,
  maxLado = 1280,
  calidad = 0.7
): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  let { width, height } = bitmap;

  if (width > maxLado || height > maxLado) {
    const escala = maxLado / Math.max(width, height);
    width = Math.round(width * escala);
    height = Math.round(height * escala);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen para subirla.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", calidad)
  );
  if (!blob) throw new Error("No se pudo comprimir la imagen.");
  return blob;
}
