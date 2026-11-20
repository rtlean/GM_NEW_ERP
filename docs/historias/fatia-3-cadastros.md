# Fatia 3 — Cadastros

**Objetivo:** locadores, locatários, imóveis e contratos cadastrados e editáveis com regras corretas.
**Pronto quando:** os contratos reais estão no ERP e conferidos com o dono.

## US-3.1 Listar e buscar locadores
**Como** secretária **quero** ver e buscar locadores **para** encontrar rápido quem procuro.
- Lista com nome, CPF/CNPJ mascarado, WhatsApp, nº de imóveis e status.
- Busca por nome ou CPF/CNPJ; filtro "sem WhatsApp".
- Estado vazio com botão "Cadastrar primeiro locador".

Tamanho: P · Depende de: US-2.1

## US-3.2 Cadastrar e editar locador
**Como** secretária **quero** cadastrar e editar locadores **para** manter os dados certos.
- Campos: nome*, CPF/CNPJ*, e-mail, WhatsApp.
- Dado CPF/CNPJ inválido (inclusive CNPJ alfanumérico), então o campo mostra erro e não salva.
- Dado CPF/CNPJ já cadastrado, então mostra "Já existe: <nome>" com link.
- Dado WhatsApp "(27) 99999-8888", então salva `5527999998888`.
- WhatsApp é só cadastro (sem envio na v1).

Tamanho: M · Depende de: US-3.1

## US-3.3 Listar, cadastrar e editar locatário
**Como** secretária **quero** gerenciar locatários **para** vinculá-los a contratos.
- Mesmas regras de US-3.1/3.2 (CPF/CNPJ único, WhatsApp E.164).
- Lista mostra contratos ativos do locatário e seus locadores.
- Um locatário pode ter contratos com vários locadores sem duplicar o cadastro.

Tamanho: M · Depende de: US-3.2

## US-3.4 Cadastrar e editar imóvel
**Como** secretária **quero** cadastrar imóveis de um locador **para** usá-los nos contratos.
- Campos: locador*, tipo*, CEP, endereço, número, complemento, bairro, cidade, UF, características.
- Todo imóvel pertence a exatamente um locador.
- Filtro por locador e tipo.

Tamanho: M · Depende de: US-3.2

## US-3.5 Novo contrato (assistente)
**Como** secretária **quero** criar contrato em passos **para** não esquecer nada.
- Passos: 1 locador → 2 imóvel (ou criar) → 3 locatário por CPF/CNPJ (ou criar) → 4 valores e datas → 5 revisão.
- Campos: aluguel*, taxa (padrão 10%), dia de vencimento* (1–28), início*, fim.
- Dado um imóvel com contrato ativo, então avisa e pede confirmação.
- ⚠️ Bloqueio de decisão: taxa padrão 10% para todos? (PRD §5). Até decidir, campo editável com padrão 10%.

Tamanho: G → dividir em 3.5a (passos 1–3) e 3.5b (passos 4–5) · Depende de: US-3.3, US-3.4

## US-3.6 Anexar PDF do contrato
**Como** secretária **quero** anexar o PDF assinado **para** consultar quando precisar.
- Aceita só PDF até 10 MB; salvo no Supabase Storage e registrado em `contract_documents` (mesmo padrão do sistema antigo).
- Dado contrato com PDF, então botão "Ver contrato" abre o arquivo (`GET /api/contratos/{id}/pdf`, exige login).
- Substituir PDF mantém registro na auditoria.

Tamanho: P · Depende de: US-3.5

## US-3.7 Alterar aluguel a partir de um mês
**Como** dono **quero** mudar o aluguel a partir de um mês escolhido **para** aplicar reajustes e acordos.
- Dado que escolho 03/2027 e R$ 1.200, então cobranças a partir de 03/2027 usam R$ 1.200 no **mês inteiro**.
- Não posso escolher mês anterior ao atual (sem retroativo); não existe cálculo proporcional.
- Dado mês com cobrança já paga, então o valor dela não muda.
- Contrato mostra o histórico de alterações.

Tamanho: M · Depende de: US-3.5

## US-3.8 Encerrar contrato
**Como** secretária **quero** encerrar um contrato **para** parar de cobrar sem perder o histórico.
- Dado "Encerrar" com data de fim, então status vira `encerrado` e não gera cobranças após aquele mês.
- Pede confirmação com o nome do locatário e endereço.
- Contratos encerrados ficam em filtro próprio; nada é apagado.

Tamanho: P · Depende de: US-3.5

## Notas de implementação (US-3.1, branch feat/us-3.1)
- Tela `/locadores` segue o design: busca, filtro "Sem WhatsApp", lista com imóveis e total de aluguel, detalhe com os imóveis do locador.
- Status "Com imóvel" / "Sem imóvel" é calculado pelos imóveis cadastrados (não existe campo de status no banco).
- Leitura de imóveis fica em `src/lib/imoveis.ts` (só leitura, até a US-3.4).
- Botão "Novo locador" entra junto com a US-3.2.

## Notas de implementação (US-3.2, branch feat/us-3.2)
- Telas `/locadores/novo` e `/locadores/[id]/editar`, com botões "Novo locador" e "Editar" (no formato do design).
- CPF e CNPJ são validados pelos dígitos verificadores; CNPJ alfanumérico é aceito (`src/lib/documentos.ts`).
- Duplicidade: se o CPF/CNPJ já existe em outro locador, aparece "Já existe: <nome>" com link.
- WhatsApp é salvo como `5527999998888`; é só cadastro, sem envio.
- Taxa de administração: padrão 10% para locador novo, de 0 a 100, guardada em centésimos (1000).
- Repasse: Pix (tipo e chave) ou conta bancária (banco, agência, conta, tipo de conta), usando os mesmos valores já existentes no banco.
- Cidade do locador incluída na migração `tenants_multi_owner` (coluna `owners.city`), aprovada pelo dono em 19/11/2026.
- Os 22 locadores existentes continuam com taxa 0%. Só locadores novos entram com 10%.
- Não há exclusão de locador; nada é apagado.

## Notas da migração para US-3.3 (branch feat/us-3.3)
- Locatário com CNPJ: 18 registros tinham 14 dígitos guardados na coluna `cpf` (são CNPJs). A nova coluna `document` trata os dois casos.
- Decisão do dono (19/11/2026): um locatário pode ter imóveis de locadores diferentes, por isso o vínculo foi para `tenant_owners`.
- Pendente: taxa de administração dos 22 locadores atuais (estão em 0%).

## Notas de implementação (US-3.3, branch feat/us-3.3-locatarios)
- Telas `/locatarios`, `/locatarios/novo` e `/locatarios/[id]/editar`, com busca por nome ou CPF/CNPJ.
- Cadastro pede nome, CPF/CNPJ (com dígitos verificadores), e-mail e WhatsApp (ver "Layout do design" abaixo: o locador não é pedido no cadastro).
- Mesmo CPF/CNPJ de outro locatário: aparece "Já existe: <nome>".
- O vínculo com locadores fica em `tenant_owners` (migração da US-3.3). Um locatário pode ter imóveis de locadores diferentes.
- Lista mostra os contratos ativos de cada locatário (leitura em `src/lib/contratos.ts`; a tela de contratos é a US-3.5).
- Aluguel (`rent_cents`) e tipo de imóvel (`property_type`) dos locatários existentes não são editados nesta história.
- Pendente: a tela só adiciona vínculos com locadores; remover um vínculo exige uma coluna de status (decisão futura, sem apagar registros).

## Notas de implementação (US-3.4, branch feat/us-3.4-tela)
- Telas `/imoveis`, `/imoveis/novo` e `/imoveis/[id]/editar`, com filtros por locador, tipo e busca por endereço, bairro ou código.
- Formulário em 3 abas do design: Identificação, Características e Valores e vínculos.
- Código do imóvel é gerado pelo sistema: próximo número da sequência (0091, 0092...).
- Situação do cadastro: Disponível ou Em manutenção. "Alugado" vem do contrato (US-3.5). Na edição, um imóvel alugado continua alugado.
- Características (texto livre) gravadas em `properties.caracteristicas`.
- Diferenças em relação ao design, para decisão: lista de tipos do design (inclui Depósito, Terreno e Ponto comercial, sem Consultório); campos de matrícula, IPTU, valor de venda, condomínio e comodidades do design não estão nesta versão.

## Ajuste de layout: tela de Imóveis (PR 1, branch `fix/design-imoveis`)

Motivo: o dono pediu que as telas sigam o layout do Claude Design (regra do projeto).

- Lista e cadastro ficam na mesma tela (`/imoveis`). Cadastro em painel, não em página separada.
- `/imoveis/novo` e `/imoveis/[id]/editar` agora só redirecionam para o painel.
- Cards com selo de situação colorido, linha tipo · bairro · locador e barra "Cadastro X% completo".
- Busca única por imóvel, bairro, código ou locador (filtros de locador e tipo saíram do topo).
- Abas: Identificação, Características, Comodidades e Valores e vínculos.
- Tipo "Consultório" voltou à lista (decisão do dono).
- Progresso conta só os campos que já existem no banco: endereço, CEP, bairro, aluguel e locador.
- Após salvar, volta ao painel com a marca "Salvo".

Ainda fora (dependem de migração aditiva **não aprovada** para produção): nome de identificação, finalidade, situação "Vendido", matrícula, inscrição do IPTU, quartos, suítes, banheiros, vagas, áreas, andar, mobília, pets, valor de venda, condomínio, IPTU e comodidades. Número, cidade e UF continuam, por decisão do dono.
Taxa de administração: continua flexível por locador (decisão do dono), sem padronizar.

## Ajuste de layout: campos do imóvel (PR 2, branch `fix/design-imoveis-campos`)

- Migração aditiva `20261120090000_properties_detalhes_design_imoveis.sql`, aplicada em produção com aprovação do dono (20/11/2026). Cria 17 colunas em `properties` e a situação `sold` ("Vendido"). Nenhuma coluna existente foi alterada ou apagada.
- Campos do design ligados ao formulário: nome de identificação, finalidade, matrícula, inscrição do IPTU, quartos, suítes, banheiros, vagas, áreas, andar, mobília, aceita pets, comodidades, valor de venda, condomínio e IPTU.
- Número, complemento, cidade e UF continuam (decisão do dono).
- "Cadastro X% completo" conta os 12 campos da lista do design.
- A coluna antiga `caracteristicas` não é mais gravada pelo formulário. O texto que já existir continua no banco e não aparece na tela.
- Comodidades usam os 12 itens do design. "Adicionar fotos" aparece desabilitado: fotos ficam para uma etapa futura.
- Taxa de administração segue flexível por locador (decisão do dono).

## Ajuste de layout: tela de Locadores (branch `feat/design-locadores`)

- Cadastro em painel acima da lista (`/locadores?novo=1` e `/locadores?id=N&editar=1`). As páginas separadas viraram redirecionamento.
- Campos do design: nome ou razão social, CPF ou CNPJ, e-mail, telefone, cidade e taxa de administração (padrão 10%). A taxa continua flexível por locador (decisão do dono).
- Forma de repasse "Pix" ou "Conta bancária". Chave Pix com tipos CPF, CNPJ, E-mail, Telefone e Aleatória.
- Conta bancária: banco, agência e "Conta com dígito" (ex.: 12345-6). Código do banco e tipo de conta não aparecem na tela, mas são preservados ao editar.
- Lista ordenada pelo total de aluguel (maior primeiro), com a contagem "N locadores cadastrados".
- Detalhe: taxa, forma de repasse e cidade; botões "Editar dados" e "Novo contrato"; imóveis com o aluguel de cada um.
- Campo do locatário em cada imóvel aparece como "a definir no contrato (US-3.5)", porque o vínculo ainda não existe.
- Busca e filtro "Sem WhatsApp" saíram da tela, porque o design não os mostra.
- Mensagem de sucesso com botão Fechar.
- Sem mudança no banco.

## Notas de implementação (US-3.3, layout do design, branch feat/design-locatarios)
- Tela `/locatarios` no layout do Claude Design: painel de cadastro acima da lista, lista à esquerda e detalhe à direita. `/locatarios/novo` e `/locatarios/[id]/editar` viraram redirecionamento.
- Cadastro: nome ou razão social (salvo em maiúsculas), CPF ou CNPJ, RG, e-mail, "Telefone (WhatsApp)" e observações. RG e observações usam as colunas `rg` e `notes` de `tenants`, sem migração.
- Locador não é pedido no cadastro. O vínculo nasce no contrato (US-3.5). A tela não grava mais `tenant_owners`; vínculos já existentes continuam como estão.
- Busca por nome ou CPF/CNPJ e filtros "Todos" e "Com mais de um imóvel" (conta contratos ativos).
- Detalhe: imóveis dos contratos ativos (registro, tipo, locador e aluguel), total "Aluguéis por mês" (soma dos contratos ativos) e "N imóveis · N locadores".
- Regras: CPF/CNPJ único; nome repetido não cria outro cadastro na inclusão (na edição não é checado); aviso de nomes parecidos (até 2 letras de diferença, sem contar LTDA, S/A, ME, EPP, EIRELI), só como alerta.
- Na lista, locatário sem contrato ativo mostra "Sem imóvel" (o design mostrava "Novo" para cadastros novos).
- Leitura de contratos em `src/lib/contratos.ts` e de imóveis em `src/lib/imoveis.ts`.

## Nota de implementação — US-3.5a Contratos: lista e passos 1 a 3 (branch feat/contratos-lista)
- Tela `/contratos` no layout do design, só para leitura: colunas Registro, Locatário, Imóvel, Locador, Aluguel e Situação (ativo, encerrado ou rascunho).
- Filtros: Todos, Ativos e Encerrados (no lugar de "Sem contrato / Com contrato" do design, que dependem do PDF da US-3.6). Busca por locatário, locador, código ou tipo do imóvel.
- Cabeçalho mostra registros, ativos e a soma dos aluguéis dos contratos ativos.
- Assistente "Novo contrato": passo 1 escolhe o locador, passo 2 o imóvel (com aviso se já estiver alugado) e passo 3 o locatário. Ainda não grava nada.
- Leitura em `src/lib/contratos.ts` (`listarContratos`, `listarImoveisParaContrato`) e em `src/lib/imoveis.ts` (`listarImoveisParaSelecao`).
- Pendente para a US-3.5b: cadastro de novo imóvel e de novo locatário dentro do assistente; passos 4 e 5 (condições, revisão e gravação); a regra de imóvel alugado será comparada por id e não por nome; taxa de administração flexível (locador, depois locatário, depois 10%); o banco não tem coluna de dia de vencimento em `contracts`, então isso precisa de aprovação antes de qualquer migração.
