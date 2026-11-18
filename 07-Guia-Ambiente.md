# Guia do computador (para não técnicos)

Só é necessário se você quiser rodar o sistema no seu Mac. A construção pode ser feita pelo Claude sem isso.

| # | Instalar | Onde |
|---|---|---|
| 1 | Git | já vem no Mac (`git --version` instala se faltar) |
| 2 | Node.js 22 LTS | nodejs.org |
| 3 | Claude Code Desktop | app Claude |

## Rodar
```
git clone https://github.com/rtlean/GM_NEW_ERP.git
cd GM_NEW_ERP
npm install
cp .env.example .env.local   # preencha as chaves do Supabase (só no seu computador)
npm run dev                  # abre em http://localhost:3000
```
