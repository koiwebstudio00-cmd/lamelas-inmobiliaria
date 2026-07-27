import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Bucket público de R2: la API ya devuelve la URL absoluta de cada foto.
      {
        protocol: "https",
        hostname: "pub-ce447cb398f848b893911f0d983f9928.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
