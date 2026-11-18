# Fatia 0 — Fundação ✅ (18/11/2026)

## US-0.1 Projeto Next.js ✅
- Next.js 16 + TypeScript + Tailwind 4, `output: "standalone"` para o VPS.
- Fonte Figtree local (`@fontsource-variable/figtree`), cores da marca em `globals.css`.
- `GET /api/saude` → `{"status":"ok"}`.

## US-0.2 Layout com barra superior ✅
- Logo, grupos Dashboard, Imóveis, Locação (Contratos, Locadores, Locatários, Lançamentos, Relatório mensal), Usuários e Sair.
- Grupo ativo em pílula azul; item ativo do submenu com sublinhado dourado; menu rola no celular.
- Módulos ainda não feitos mostram "Em construção" (`src/app/[modulo]/page.tsx`).

## US-0.3 Verificação automática ✅
- GitHub Actions roda `npm ci`, `npm run lint`, `npm test`, `npm run build` em todo push e PR.
- Testes do menu em `src/lib/menu.test.ts`.
