import type { NextConfig } from "next";

/**
 * Hostnames del bucket público de R2 desde los que Next acepta servir imágenes.
 *
 * Estaba hardcodeado al bucket de desarrollo, y cada bucket de R2 tiene su
 * propio hostname: al pasar a producción las fotos dejaban de mostrarse sin
 * ningún error visible más que el bloqueo de next/image. Ahora sale de
 * NEXT_PUBLIC_R2_HOST (acepta varios separados por coma) y el default es el de
 * desarrollo, para no romper el entorno local de nadie.
 */
const r2Hosts = (
  process.env.NEXT_PUBLIC_R2_HOST ?? "pub-ce447cb398f848b893911f0d983f9928.r2.dev"
)
  .split(",")
  .map((h) => h.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""))
  .filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    // Las fotos ya llegan optimizadas: el navegador las redimensiona a 1600px y
    // las pasa a WebP (~150 KB) antes de subirlas a R2. Volver a pasarlas por la
    // optimización de imágenes de Vercel no aporta nada y consume la cuota del
    // plan (con la cuota agotada, /_next/image responde 402 y la foto no carga).
    // Por eso se sirven sin optimizar: next/image apunta directo a la URL de R2.
    unoptimized: true,
    // La API ya devuelve la URL absoluta de cada foto. Con unoptimized estos
    // patterns no se aplican, pero se dejan por si se reactiva la optimización.
    remotePatterns: r2Hosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/**",
    })),
  },
};

export default nextConfig;
