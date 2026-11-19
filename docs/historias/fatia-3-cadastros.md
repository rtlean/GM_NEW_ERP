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
