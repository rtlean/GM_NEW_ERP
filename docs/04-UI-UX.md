# UI/UX Design

## Referência visual
Protótipo navegável (32 telas) no canvas de design do projeto: "ERP Soluções Imobiliárias" no Claude.
Telas com dados reais: Dashboard, Contratos, Locadores, Locatários, Imóveis, Lançamentos, Relatório mensal.
As demais são demonstrativas.

## Identidade
| Token | Valor | Uso |
|---|---|---|
| `--navy` | `#002356` | Cor principal, textos, menu ativo |
| `--gold` | `#D4A853` | Destaques, contador de pendências, item ativo do submenu |
| `--bg` | `#FFFFFF` / `#F5F7FB` | Fundo |
| `--line` | `#E8ECF3` | Bordas |
| `--muted` | `#4F5B72` | Texto secundário |
| `--warn-bg` | `#FBF3D9` | Avisos |
| Fonte | Figtree 400–800 | Toda a interface |

Logo da marca "Soluções Imobiliárias" no canto superior esquerdo (link para o Dashboard).

## Navegação
Barra superior com grupos (pílulas) e submenu com sublinhado dourado:
- Dashboard · Imóveis
- **Locação:** Contratos, Locadores, Locatários, Lançamentos, Relatório mensal
- **Usuários** (só admin) · **Sair**

Telas do protótipo fora da v1 (Sicredi, Notas, WhatsApp, Consórcio, Financiamento, Financeiro etc.) não entram no menu.

## Padrões de tela
| Padrão | Regra |
|---|---|
| Lista | Busca no topo, filtros em chips, tabela com ação por linha, totais no rodapé |
| Formulário | Em painel lateral ou página; máscara visual, valor salvo limpo; erros abaixo do campo |
| Valores | `R$ 1.234,56`, alinhados à direita |
| Datas | `dd/mm/aaaa`; competência `mm/aaaa` |
| Estados vazios | Mensagem + botão de ação ("Cadastrar primeiro locador") |
| Carregando/erro | Skeleton; mensagem em português com o que fazer |
| Confirmação | Ações irreversíveis pedem confirmação com o nome do item |

## Acessibilidade
- Alvos de clique de no mínimo 44 px; contraste AA; navegação por teclado; `aria-current` no menu.
- Responsivo: menu rola horizontalmente no celular; tabelas viram cartões abaixo de 640 px.

## Telas do MVP
| Tela | Elementos-chave |
|---|---|
| Login | E-mail, senha, ilustração |
| Dashboard | Cards: aluguel do mês, recebido, em aberto, taxa; lista de atrasos; alertas de cadastro incompleto |
| Locadores / Locatários | Lista + novo/editar; CPF/CNPJ validado; WhatsApp com máscara |
| Imóveis | Lista por locador; características |
| Contratos | Assistente de novo contrato; upload PDF; alterar aluguel por mês; encerrar |
| Lançamentos | Locador + competência; tabela de despesas/créditos; prévia do relatório |
| Relatório mensal | Prévia A4 paisagem; baixar PDF; marcar conferido |
| Usuários | Lista, criar com senha provisória, perfil, ativar/desativar, redefinir senha |
