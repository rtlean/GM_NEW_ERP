# Integração WhatsApp (API oficial da Meta)

**Status:** tela e conexão de teste prontas (22/11/2026). Envio automático ainda não ligado.

## História
Como dono da imobiliária, quero conectar o WhatsApp oficial da Meta, conferir a conexão e enviar boletos, lembretes e avisos por modelos aprovados, sem expor credenciais na tela.

## Decisões
- Só a API oficial da Meta. A Evolution API (não oficial) foi removida por risco de bloqueio do número.
- Token e ID do número ficam em variáveis do servidor: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e, opcionalmente, `WHATSAPP_API_VERSION`. Não vão para o banco nem para a tela.
- A tela mostra só se cada variável está configurada, nunca o valor.
- Sicredi fica no módulo Conta digital, não em Integrações.

## Critérios de aceite (esta fatia)
- Tela `Integração WhatsApp` com abas Conexão, Modelos de mensagem e Automações, como no design `WhatsApp.dc.html`.
- Aba Conexão: mostra o estado das variáveis e o botão **Testar conexão**. O teste lê o nome e o número verificado da Meta; não envia mensagem.
- Modelos de mensagem em somente leitura, com status.
- Automações com caixas de marcar. Ainda não são salvas nem disparam envios.
- Acesso pela permissão `whatsapp`.

## Pendências
- Versão da API: `v21.0` é o padrão. Conferir a versão atual na documentação da Meta antes de produção.
- Conta da Meta verificada, token permanente e modelos aprovados: dependem do dono.
- Disparo dos envios automáticos (boleto, lembrete, atraso, nota, relatório, repasse) a partir dos módulos de origem.
- Salvar as escolhas de automação no banco (migração aditiva, com aprovação).
- Registro de autorização do cliente para receber mensagens (data e forma no cadastro).
