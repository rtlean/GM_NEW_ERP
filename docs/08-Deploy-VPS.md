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
