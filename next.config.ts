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
    // La API ya devuelve la URL absoluta de cada foto.
    remotePatterns: r2Hosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/**",
    })),
  },
};

export default nextConfig;
