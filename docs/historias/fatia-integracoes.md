# Fatia: Integração WhatsApp (layout do design)

**Status:** primeira fatia (22/11/2026). Tela pronta; sem envio e sem armazenamento de credenciais.

## História
Como dono da imobiliária, quero ver e preencher a configuração do WhatsApp no mesmo layout do design, para decidir como conectar o número antes de qualquer envio automático.

## Critérios de aceite (desta fatia)
- Tela `Integração WhatsApp` com cabeçalho, status "Não conectado" e as abas Conexão, Modelos de mensagem e Automações, como no design `WhatsApp.dc.html`.
- Dois cartões de provedor. A API oficial da Meta vem marcada como recomendada. A Evolution API aparece com o aviso de risco.
- Formulário conforme o provedor: Meta pede ID do número e token; Evolution pede URL https e chave da API.
- Validação: número com DDD (10 a 13 dígitos); campos obrigatórios por provedor. O primeiro erro aparece na tela.
- Token não permanece no estado após enviar.
- Modelos de mensagem em somente leitura, com status (Aprovado, Em análise, Rascunho).
- Automações com caixas de marcar; não são salvas nesta versão.
- Acesso pela permissão `whatsapp` (grupo Integrações).

## Decisões
- O Sicredi sai do módulo Integrações e vai para Conta digital (pedido do dono, 22/11/2026).
- Integrações passa a ter só WhatsApp.
- Nesta fatia nada é enviado nem guardado, e nenhum token é armazenado.

## Fora desta fatia (depende de decisão)
- Onde e como guardar tokens (criptografia, cofre ou variável de ambiente no servidor).
- Ligação real com a Meta e envio das mensagens.
- Incluir ou remover a Evolution API (não oficial, com risco de bloqueio).
- Salvar modelos e automações no banco.
- Autorização do cliente para receber mensagens (data e forma de consentimento no cadastro).
