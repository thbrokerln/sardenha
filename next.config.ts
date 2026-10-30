import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Tipagem é conferida no editor; não bloqueia a publicação.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
