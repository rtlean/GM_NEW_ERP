# Pipeline (módulo incluído na v1 por decisão do dono, 21/11/2026)

Design: `Pipeline.dc.html` (artefato "ERP Soluções Imobiliárias"). Tela `/pipeline`.
Decisões do dono (21/11/2026):
- Cinco colunas: quatro de venda (Prospecção, Visita, Proposta e Fechamento) e a última, Lead Frio, para oportunidade perdida (decisão do dono, 21/11/2026).
- Sem comissionamento: nada de percentual de comissão, comissão prevista nem chance ponderada.
- Só o dono (perfil admin) usa o módulo. Ele não aparece para a secretária nem para outros perfis operacionais.
- Sem corretor: o design tinha filtro e avatar de corretor; saem da v1.
- Sem integração de WhatsApp nesta entrega. Entra com o Módulo de Integrações.
- Começa vazio: o primeiro cadastro de lead será feito em produção, sem dados de exemplo.

## US-P.1 Kanban de negócios (tela /pipeline)
**Como** dono **quero** ver meus negócios em cinco colunas e mover cada um de etapa **para** acompanhar onde cada oportunidade está.

- Cabeçalho: título "Pipeline", resumo "N negócios · R$ X em valor" e botão "Novo lead".
- Busca por cliente ou imóvel (filtra as colunas).
- Cinco colunas na ordem Prospecção, Visita, Proposta, Fechamento e Lead Frio (última), cada uma com contagem e total de valor.
- Cartão: tipo (Locação ou Venda), cliente, imóvel, valor ("R$ X/mês" para locação), próximo passo (destacado quando urgente), botões de voltar e avançar uma etapa.
- Arrastar e soltar entre colunas (computador). Os botões de voltar e avançar valem também para celular.
- Painel lateral ao clicar no nome: imóvel, valor, próximo passo e troca de etapa por lista.
- Formulário "Novo lead": cliente, tipo (Locação ou Venda), valor (aluguel ou valor do imóvel) e imóvel (opcional, acréscimo ao design). Entra sempre em Prospecção.
- Aviso "Desfazer" depois de mover ou criar.

Critérios:
- Dado nenhum negócio cadastrado, quando abro /pipeline, então cada coluna mostra "Arraste um negócio para cá" e o resumo mostra "0 negócios · R$ 0,00".
- Dado o formulário com cliente vazio ou valor menor que 1, então não salva e mostra o erro abaixo do campo.
- Dado um lead salvo, então ele aparece em Prospecção e o aviso diz "... adicionado à Prospecção".
- Dado um negócio em Prospecção, quando clico "Mover para Visita", então ele vai para Visita, e o botão de voltar fica desabilitado em Prospecção.
- Dado um negócio em Lead Frio, então o botão de avançar mostra "Última etapa" e fica desabilitado.
- Dado um negócio em Lead Frio, quando clico voltar, então ele volta para Fechamento (reativação).
- Dado um arrasto de Prospecção para Proposta, então a etapa muda e o aviso "Desfazer" devolve o negócio para Prospecção.
- Dado a busca "Renata", então só aparecem os cartões cujo cliente ou imóvel contém "Renata".
- Dado que a movimentação é gravada, então a auditoria registra `pipeline.movido` com a etapa de origem e de destino.
- Dado que um negócio não é mais desejado, então não há botão de excluir: nada é apagado (regra do projeto).
- Dado um usuário operacional (secretária), então "Pipeline" não aparece no menu e /pipeline responde 404.

Tamanho: M · Depende de: nenhuma.

✅ **Decidido (21/11/2026):** "Marcar como perdido" do design vira a coluna final **Lead Frio**. Nada é apagado; quem está em Lead Frio volta para Fechamento com o botão de voltar.

## Modelo de dados (migração aditiva)
Tabela nova `pipeline_negocios`:
- `id`, `company_id` (padrão 1), `nome`, `tipo` ("Locação" ou "Venda"), `imovel` (opcional), `valor_centavos` (inteiro, maior que zero), `etapa` (uma das cinco colunas, com verificação no banco), `proximo_passo` (opcional), `urgente` (padrão falso), `criado_em`, `criado_por`, `atualizado_em`, `atualizado_por`.
- Nada é apagado: a tabela não tem ação de exclusão no código.
- Auditoria em `audit_events`: `pipeline.criado` e `pipeline.movido`.

## Plano técnico
- `supabase/migrations/20261121180000_pipeline_negocios.sql`: cria a tabela com RLS ligado, igual às outras tabelas do ERP. Desfazer: `drop table public.pipeline_negocios` (só se nenhum dado tiver sido gravado).
- `src/lib/pipeline-regras.ts`: funções puras (etapas, validação do formulário, próxima e anterior etapa, resumo). Com testes em `pipeline-regras.test.ts`.
- `src/lib/pipeline.ts`: acesso ao banco (listar, criar, mover), toda consulta com `company_id = 1`.
- `src/app/pipeline/page.tsx` e `actions.ts`: tela e ações no servidor. A ação refaz as validações (não confia só na tela).
- `src/components/pipeline/PipelineKanban.tsx`: componente visual do design.
- `src/lib/permissoes.ts`: "pipeline" sai da lista de telas liberáveis e da secretária, e passa a ser exclusiva do admin.
- `src/lib/menu.ts`: o item Pipeline deixa de ser "em construção".
- `CLAUDE.md`, `docs/01-PRD.md` e `docs/04-UI-UX.md`: tiram Pipeline da lista "fora da v1".

Roteiro de teste manual (depois de aplicar em homologação):
1. Entrar como dono, abrir Pipeline e conferir as cinco colunas vazias.
2. Criar um lead de locação com valor 2500 e conferir que ele aparece em Prospecção.
3. Avançar até Fechamento, voltar uma etapa e arrastar outro cartão; usar "Desfazer".
4. Entrar como secretária e conferir que Pipeline não aparece no menu e /pipeline dá 404.

## Adendo (22/11/2026): contato e origem do lead
Decisão do dono: o formulário Novo lead passa a ter contato e origem.
- **Telefone / WhatsApp:** obrigatório. Guardado só com dígitos e DDI 55 (ex.: 5527999998888), como o restante do ERP.
- **E-mail, origem e cidade:** opcionais. Origem é uma lista: Indicação, Portal, WhatsApp, Site, Redes sociais, Outro.
- O painel de detalhes mostra telefone, e-mail, origem e cidade.
- Migração aditiva `20261122160000_pipeline_contato_origem.sql`: cria as quatro colunas, todas opcionais no banco. Telefone é exigido pela tela, não pelo banco.

Critérios:
- Dado um lead sem telefone, então o formulário não salva e mostra o erro abaixo do campo.
- Dado telefone "(27) 99999-8888", então é salvo como 5527999998888.
- Dado e-mail inválido ou origem fora da lista, então não salva.
- Dado lead sem e-mail, origem ou cidade, então salva normalmente.

## Adendo (22/11/2026): editar um negócio

- Botão "Editar dados" no painel lateral abre o formulário com os dados atuais preenchidos.
- Campos editáveis: cliente, tipo, valor (aluguel ou valor do imóvel), imóvel, telefone, e-mail, origem, cidade, próximo passo e urgente.
- A etapa não muda pela edição; continua sendo alterada pelas setas e pelo seletor de etapa.
- Mesmas regras do cadastro: telefone obrigatório e normalizado; e-mail, origem e cidade opcionais; próximo passo com até 160 caracteres.
- Nada é apagado. Cada edição grava quem alterou e registra "pipeline.editado" na auditoria.
- Não exige migração: os campos já existem no banco.
