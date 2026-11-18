# Fatia 6 — Migração e publicação

**Objetivo:** o ERP novo assume o dia a dia sobre o mesmo banco; o sistema antigo é desligado.
**Pronto quando:** dono e secretária fecham um mês inteiro só no ERP novo.
Não há migração de dados: o ERP já usa as tabelas reais (ver `docs/05-Backend-Schema.md`).

## US-6.1 Limpeza de dados
**Como** dono **quero** corrigir inconsistências **para** o ERP mostrar números certos.
- Relatório no ERP: duplicados por CPF/CNPJ, contratos sem tipo, aluguel zero, locador sem inquilino, telefones fora do padrão.
- Correções feitas pela tela, com auditoria.
- ⚠️ Decisões do dono: Lorraine, Elecnor/Elecno, e-bike, Loja do Helinho (PRD §5).

Tamanho: M · Depende de: US-3.8

## US-6.2 Conferência paralela
**Como** dono **quero** comparar o ERP novo com o antigo **para** confiar antes de desligar.
- Relatórios 09, 10 e 11/2026 do ERP novo batem com os do sistema antigo (tolerância zero).
- Divergências listadas e explicadas.

Tamanho: M · Depende de: US-5.1

## US-6.3 Publicação
**Como** dono **quero** acessar o ERP pela internet **para** usar no dia a dia.
- App publicado no VPS (docs/08-Deploy-VPS.md), front-end no domínio com HTTPS, variáveis de ambiente configuradas.
- Backup do banco antes da publicação.

Tamanho: M · Depende de: US-2.4 · Pré-requisito: hospedagem definida

## US-6.4 Desligar o sistema antigo
**Como** dono **quero** usar só o ERP novo **para** evitar dois sistemas gravando os mesmos dados.
- Data combinada; sistema antigo sai do ar ou fica só leitura.
- A partir daí, a regra do mês inteiro vale para todas as alterações de aluguel.

Tamanho: P · Depende de: US-6.2, US-6.3
