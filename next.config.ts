import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera um pacote autocontido para rodar no VPS com `node server.js` (docs/08-Deploy-VPS.md).
  output: "standalone",
  // Upload de contrato (PDF/Word até 10 MB) passa pela ação de servidor; o padrão do Next é 1 MB.
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
