# Plano de Implementação (v1)

Escopo: imóveis, locadores, locatários e contratos, com lançamentos, relatório mensal e dashboard.
**Fora:** banco/Sicredi, Pix, NFS-e, WhatsApp, e-mail automático, consórcio, financiamento.
Stack: Next.js + Supabase (banco existente) + VPS Integrator. Repositório: github.com/rtlean/GM_NEW_ERP.

| Fatia | Entrega | Pronto quando | Estimativa |
|---|---|---|---|
| 0. Fundação | Projeto Next.js, layout com menu, CI, `/api/saude` | ✅ feito em 18/11/2026 (build, lint e testes ok) | — |
| 1. Banco | Conexão com o Supabase, tipos gerados, regra do aluguel | `/locadores` lista os 22 locadores reais (leitura) | 1 sem |
| 2. Acesso | Login (Supabase Auth), perfis, tela de usuários | Secretária não acessa Usuários | 1–2 sem |
| 3. Cadastros | Locadores, locatários, imóveis, contratos (PDF, alterar aluguel, encerrar) | Cadastro e edição funcionando com dados reais | 2–3 sem |
| 4. Mês | Lançamentos do mês, pagamento, despesas, taxa | Totais do mês conferidos | 2 sem |
| 5. Relatório | Relatório A4 paisagem + PDF + dashboard | Locatelli 11/2026 idêntico ao modelo | 2 sem |
| 6. Publicação | VPS + domínio + HTTPS, lançar a planilha provisória | Dono e secretária usam no dia a dia | 1 sem |

Sugestão: publicar uma versão de teste no VPS já ao fim da Fatia 2, para o dono acompanhar.

## Pré-requisitos
- [ ] Chaves do Supabase no `.env.local` (Fatia 1) — o dono do projeto cola, nunca no chat
- [ ] VPS contratado e domínio escolhido (até a Fatia 2)
- [ ] Decisão da taxa (até a Fatia 3)

## Ritual por história
Plano → aprovação → branch → código + testes → roteiro de teste manual → PR → CI verde → merge.
