import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera um pacote autocontido para rodar no VPS com `node server.js` (docs/08-Deploy-VPS.md).
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
