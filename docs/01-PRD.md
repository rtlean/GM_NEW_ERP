# PRD — Documento de Requisitos do Produto

| Item | Valor |
|---|---|
| Produto | ERP/CRM GM Soluções Imobiliárias |
| Empresa | G M ROLIM FILHO (ME, Simples Nacional), Rio Bananal/ES |
| Versão | 0.1 (rascunho) |
| Responsável | Roberto Trintin |

## 1. Visão do Produto
**Para** a GM Soluções Imobiliárias, **que** administra cerca de 86 contratos de locação de 22 locadores com uma equipe de duas pessoas,
**o** ERP GM **é** um sistema web de gestão de locação **que** centraliza cadastros, contratos, lançamentos mensais, relatório ao locador, cobrança e nota fiscal,
**diferente de** planilhas e do sistema antigo dividido em duas bases, **nosso produto** fecha o mês com poucos cliques, sem retrabalho e com dados confiáveis.

### Problema
- Dados divididos entre a base oficial (simples, sem chaves nem regras de acesso) e a base antiga (mais completa).
- Fechamento mensal e relatório ao locador dependem de trabalho manual.
- Cobrança e nota fiscal fora do sistema.

### Usuários (personas)
| Persona | Papel | Necessidade principal |
|---|---|---|
| Dono (administrador) | Decide, aprova, fala com locadores | Ver o mês e a inadimplência em 1 tela; relatório correto aos locadores |
| Secretária (operacional) | Cadastra, lança, cobra, envia | Lançar rápido, sem erro, e enviar relatórios e cobranças |

### Escopo
**Dentro (v1, acordado com o dono em 14/11/2026):** login e perfis; locadores, locatários, imóveis, contratos (PDF, alteração de aluguel, encerramento); reajuste anual pelo índice e aditivo em PDF; repasse manual ao locador (sem Pix nem TED); cobranças do mês com registro manual de pagamento; lançamentos; cálculo da taxa; relatório mensal em PDF (download); dashboard; migração dos dados.

**Fora da v1:** Pix, NFS-e, e-mail automático, consórcio, financiamento, conta digital, seguros, garantias, DIMOB, financeiro, repasses automáticos. Sicredi e WhatsApp entram na v1 (decisão do dono, 19/11/2026).

### Requisitos funcionais (MVP)
| ID | Requisito |
|---|---|
| RF01 | Usuário entra com e-mail e senha; sai pelo menu |
| RF02 | Administrador cria/edita usuários e define perfil |
| RF03 | CRUD de locadores com CPF/CNPJ validado e WhatsApp E.164 |
| RF04 | CRUD de locatários, único por CPF/CNPJ |
| RF05 | CRUD de imóveis ligados a um locador |
| RF06 | Contrato liga imóvel + locatário, com aluguel, taxa, datas e PDF |
| RF07 | Alteração de aluguel registrada por mês de vigência (mês inteiro) |
| RF08 | Encerramento de contrato sem apagar histórico |
| RF09 | Geração das cobranças mensais a partir dos contratos ativos |
| RF10 | Registro manual de pagamento (data e valor) |
| RF11 | Lançamentos por locador e competência (cobrar de locador ou locatário) |
| RF12 | Relatório mensal por locador em PDF A4 paisagem, 6 seções, igual ao modelo antigo |
| RF13 | Download do relatório em PDF e marcação "conferido" pelo dono |
| RF14 | Dashboard com totais do mês, recebido, em aberto e alertas |
| RF15 | Auditoria de alterações |

### Requisitos não funcionais
- Funciona em navegador de computador e celular (responsivo).
- Página principal carrega em até 3 s em conexão comum.
- Dados pessoais protegidos por RLS; LGPD respeitada.
- Backup diário (recurso do Supabase, conferir plano contratado).

## 2. Métricas e Objetivos
| Objetivo | Métrica | Linha de base | Meta |
|---|---|---|---|
| Fechar o mês mais rápido | Tempo para gerar e enviar todos os relatórios | A medir no sistema atual | Reduzir 70% |
| Dados confiáveis | Divergência entre relatório do ERP e o antigo (09–11/2026) | — | 0 centavo |
| Cadastro completo | % locadores com WhatsApp | 36% (8 de 22) | 100% |
| Cadastro completo | % locatários com WhatsApp válido | 92% (79 de 86) | 100% |
| Adoção | Planilhas paralelas em uso | A medir | 0 após a virada |
| Inadimplência visível | Atrasos identificados no dia seguinte ao vencimento | Manual | 100% automático |

Metas de redução são propostas, não dados medidos: validar a linha de base no primeiro mês.

## 3. Restrições
- Equipe de construção: 1 pessoa não técnica usando Claude Code (vibe coding).
- Stack definida: Next.js + TypeScript + Tailwind, Supabase (banco existente e login), GitHub (rtlean/GM_NEW_ERP), VPS da Integrator com domínio.
- Orçamento enxuto: preferir planos gratuitos/básicos.
- Integrações externas na v1: WhatsApp (módulo Integrações). O Sicredi fica no módulo Conta digital. NFS-e fica para versão futura.
- NFS-e nacional obrigatória para ME do Simples (confirmar regras vigentes com o contador).
- Regra de aluguel: mês inteiro, sem proporcional nem retroativo.

## 4. Riscos
| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Base oficial sem chaves e com RLS sem políticas | Alta | Alto | Fatia 1 recria o esquema com migrations |
| Duplicados e lacunas nos dados (Lorraine, Elecnor, e-bike, sem tipo) | Alta | Médio | Limpeza antes da migração, decisões do dono |
| Configuração do VPS (Node, HTTPS, atualizações) depende de quem não é técnico | Média | Alto | Passo a passo em docs/08-Deploy-VPS.md; alternativa com painel ICP/Docker; plano B: Vercel com domínio da Integrator |
| Regra proporcional no histórico antigo | Média | Médio | Migrar valores como foram cobrados; regra nova só daqui em diante |
| Construtor não técnico aprovar código ruim | Média | Alto | Fatias pequenas, testes, roteiro de teste manual, PR revisado |
| Dados pessoais vazarem (chave no Git) | Baixa | Alto | `.gitignore`, segredos no Supabase, revisão em cada PR |
| Construtor não técnico | Média | Alto | Histórias pequenas, CI obrigatório, guia de ambiente, plano antes do código |

## 5. Pendências de decisão
- Taxa de administração é 10% para todos? (a base já tem `admin_fee_basis_points`, vazia)
- Duplicados Lorraine (38/113) e Elecnor/Elecno (73/111).
- Linha do e-bike (R$ 2.000) e valor da Loja do Helinho (R$ 24.300).
- WhatsApp de 14 locadores e 2 locatários (ids 25 e 79).
- CNAE, código de serviço e tomador da NFS-e (contador).
