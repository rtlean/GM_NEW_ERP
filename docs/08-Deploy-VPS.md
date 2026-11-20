# Publicação no VPS da Integrator

> Rascunho: confirmar sistema operacional, acesso root e painel do plano contratado. Os comandos assumem Ubuntu 22.04/24.04 com acesso SSH.

## O que contratar
- VPS com **acesso root (SSH)**, Ubuntu LTS, mínimo **1 vCPU e 2 GB de RAM** (estimativa para 2 usuários; confirmar no plano).
- **Domínio** (ex.: `erp.<dominio>.com.br`) apontado para o IP do VPS (registro DNS tipo A).

## Instalação (uma vez) — o Claude conduz passo a passo
1. Atualizar o servidor e ligar o firewall (portas 22, 80, 443).
2. Instalar Node.js 22 LTS, PM2 e Nginx.
3. Clonar `rtlean/GM_NEW_ERP` em `/opt/gm-erp`, criar o arquivo `.env` com as chaves do Supabase.
4. `npm ci && npm run build`; copiar `public/` e `.next/static/` para `.next/standalone/`.
5. `pm2 start .next/standalone/server.js --name gm-erp` com `PORT=3000`; `pm2 save` e `pm2 startup`.
6. Nginx como proxy reverso do domínio → `localhost:3000`.
7. HTTPS gratuito com Let's Encrypt (Certbot).

## Atualizar (a cada versão)
`git pull && npm ci && npm run build && (copiar estáticos) && pm2 restart gm-erp` — vamos transformar isso num script `deploy.sh`.

## Plano B
Se o VPS ficar trabalhoso: publicar na Vercel (gratuito para começar) e apontar o domínio da Integrator para lá.

## Publicação no painel Integrator Node.js (hospedagem compartilhada)
Usado em 20/11/2026, no lugar do VPS, porque a conta tem o painel Integrator Node.js (não tem acesso root).

1. Na sua máquina (ou no ambiente de build): `npm ci` e depois `npm run build:deploy`. Isso gera `.next/standalone` com `public` e `.next/static` copiados.
2. Compacte a pasta do projeto contendo `server.js` (raiz) e `.next/standalone/`, e envie pela aba **Deploy** do painel (upload de arquivo).
3. Na aba **Registrar**: Index = `server.js`; domínio `admgmimobiliaria.com.br`; Node.js 22 (ou o mais alto disponível); modo Produção.
4. Variáveis de ambiente (cadastrar **antes** do build, pois `NEXT_PUBLIC_*` entram no código gerado): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
5. Ativar HTTPS (AutoSSL) no cPanel depois que o DNS propagar (registro A para o IP compartilhado do servidor).
6. Testar: `/api/health` responde `{"status":"ok"}`; `/login` abre; login funciona.

Observação: como a chave `SUPABASE_SECRET_KEY` fica só no painel, nunca no repositório.
