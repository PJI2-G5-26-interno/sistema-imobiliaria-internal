---
name: Vercel Supabase CI
overview: Criar o Supabase e a Vercel do zero a partir do que as telas realmente gravam, com migrations versionadas e um GitHub Actions de lint, auditoria de dependências e teste em todo pull request.
todos:
  - id: migration
    content: Substituir a migration incompatível por um baseline que as telas conseguem gravar, com RLS só para autenticado (exceto leitura de profiles) e ignorar o dump com senhas
    status: completed
  - id: financeiro-data
    content: Fazer o extrato usar data_pagamento quando data_recebimento estiver vazio
    status: completed
  - id: ci
    content: Adicionar ESLint, teste com node:test e workflow de PR com lint, npm audit e test
    status: completed
  - id: supabase-vercel
    content: Criar projeto Supabase, aplicar a migration, criar o admin e publicar na Vercel com as variáveis públicas
    status: completed
isProject: false
---

# Subir ImobGest na Vercel e no Supabase

A infraestrutura antiga não será reaproveitada. O banco novo sai de uma migration limpa, alinhada ao que o Next.js grava hoje. O arquivo [docs/imobgest.sql](docs/imobgest.sql) fica só como referência: é um dump completo (schema `auth`, storage, policies) e contém `COPY auth.users` com `encrypted_password`. Ele não será aplicado e entra no [.gitignore](.gitignore) para não ir ao GitHub.

A migration atual [supabase/migrations/20260929013000_modelo_planilha.sql](supabase/migrations/20260929013000_modelo_planilha.sql) também não serve como base. Ela usa UUID, tabela `proprietarios` (nenhuma tela usa) e um trigger que só reconhece UUID. As telas gravam ids numéricos em texto e colunas que esse arquivo não tem.

## Schema que o app exige

Uma migration nova, `supabase/migrations/20261005180000_imobgest_inicial.sql`, substitui a antiga. Projeto vazio: só essa migration roda no `db push`.

Tabelas, com as folgas que os formulários precisam:

- `profiles`: `id uuid` referencia `auth.users(id)`. O login em [app/page.js](app/page.js) busca `nome`, `email` e `ativo` antes da sessão.
- `clientes`: `nome`, `cpf`, `rg`, `telefone`, `email`.
- `imoveis`: campos do formulário, inclusive `codigo`, `cidade` e `valor` nulos. Status em minúsculas (`disponivel`, `alugado`, `manutencao`), como em [app/imoveis/page.js](app/imoveis/page.js).
- `contratos`: a tela grava o id em `cliente` e `imovel` (texto), não em `cliente_id` / `imovel_id`. Um trigger copia esses números para as FKs `bigint`. Status `ativo`, `encerrado`, `vencido`, `cancelado`. Datas em `data_inicio` e `data_fim`.
- `recebimentos`: colunas que [app/recebimentos/page.js](app/recebimentos/page.js) grava, incluindo `data_vencimento` e `data_pagamento`. Status `Pendente` e `Recebido`. Manter `data_recebimento` porque [app/financeiro/page.js](app/financeiro/page.js) lê essa coluna.
- `despesas`: inclui a coluna `"observações"` (com acento), que é o nome que a tela envia. Status `Pago`, `Pendente` e `Cancelado`. O dump só aceita os dois primeiros e quebraria o formulário.
- `informacoes_adicionais_imoveis`: tabela do relatório e do dump. Nenhuma tela usa ainda; fica criada, sem dados pessoais.

RLS ligado. `anon` só faz `SELECT` em `profiles` (o login precisa disso). O restante fica para `authenticated`. O dump libera `anon` em todas as tabelas; isso não será copiado.

Ajuste pequeno em [app/financeiro/page.js](app/financeiro/page.js): o extrato passa a usar `data_pagamento` quando `data_recebimento` estiver vazio. Sem isso, um pagamento confirmado na tela de recebimentos não aparece no financeiro.

Nenhum `COPY` de cliente, imóvel ou usuário entra no Git.

## CI no pull request

Workflow [.github/workflows/ci.yml](.github/workflows/ci.yml), um job, Node 20, só em `pull_request`:

1. `npm ci`
2. `npm run lint` — ESLint com `eslint-config-next` (devDependency). O Next 15 ainda usa `next lint` por baixo, ou o script chama `eslint` direto se o binário do Next não expuser o comando.
3. `npm run test` — `node --test` em um teste de formatação de CPF/telefone extraído de [app/clientes/page.js](app/clientes/page.js) para `lib/formatacao.js`. Sem banco e sem segredo.
4. `npm audit --audit-level=high` — scan de dependências, sem token de terceiros.

O workflow não faz deploy. Build de produção fica com a Vercel.

## Contas novas

Durante a execução, os CLIs abrem o login no navegador na sua conta. Nada de projeto antigo.

Supabase (região `sa-east-1`):

- `npx supabase login`
- `npx supabase projects create` e `link`
- `npx supabase db push`
- No painel Auth, criar o administrador e inserir a linha em `profiles` com o mesmo `id` de `auth.users`, mais `nome`, `email` e `ativo = true`. A senha não entra no repositório.

Vercel:

- `npx vercel login`, `link` e deploy de produção
- Variáveis já previstas em [.env.example](.env.example): `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (chave anon/publishable do projeto novo), no ambiente local e na Vercel
- Conectar o repositório Git para preview em pull request

O README de deploy será atualizado com esses passos e deixa de apontar para o clone da conta anterior.
