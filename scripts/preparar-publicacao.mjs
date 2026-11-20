// Prepara a pasta de publicação gerada pelo "next build" (output: standalone).
// O servidor standalone não copia sozinho os arquivos estáticos e a pasta public/.
// Uso: npm run build:deploy (depois, compacte a pasta do projeto para enviar ao painel).
import { cp, access } from "node:fs/promises";
import { join } from "node:path";

const raiz = process.cwd();
const standalone = join(raiz, ".next", "standalone");

await access(join(standalone, "server.js")).catch(() => {
  throw new Error("Pasta .next/standalone/server.js não encontrada. Rode antes: npm run build.");
});

await cp(join(raiz, "public"), join(standalone, "public"), { recursive: true });
await cp(join(raiz, ".next", "static"), join(standalone, ".next", "static"), { recursive: true });

console.log("Publicação preparada em .next/standalone (public e static copiados).");
