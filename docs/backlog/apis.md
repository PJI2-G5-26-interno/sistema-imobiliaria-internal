# Backlog

## Cadastro e edição de cliente

Validar o CPF na Receita Federal ao cadastrar ou editar um cliente.

- Serviço: [entrar.api.br](https://entrar.api.br/)
- Tela: `app/clientes/page.js`
- Plano gratuito: 10 consultas por mês
- Situação: o CPF só é digitado, formatado e gravado. Não há consulta externa.

O fluxo é um redirecionamento, no estilo de um login externo. O titular informa CPF e data de nascimento, resolve o captcha e a consulta ocorre na Receita Federal. O sistema recebe a session no callback e consulta os dados confirmados.

1. Redirecionar para `https://cpf.entrar.api.br/?appId=...`
2. No callback, ler o parâmetro `session`
3. Consultar `GET https://cpf.entrar.api.br/api/session/{sessionId}`

Dados retornados quando a validação conclui: nome, CPF, data de nascimento e situação cadastral.

A consulta depende do próprio titular. Não dá para validar o CPF de um cliente apenas com o número digitado no formulário. A credencial do aplicativo fica no servidor. A consulta da session não deve ir direto do browser.

## Cadastro e edição de imóvel

Completar o endereço do imóvel com CEP e mapa.

- Tela: `app/imoveis/page.js`
- Campos: `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado`

### ViaCEP

- Serviço: [viacep.com.br](https://viacep.com.br/)
- Situação: já integrado em `buscarCEP`
- Uso: ao informar um CEP de 8 dígitos, preencher logradouro, bairro, cidade e UF com `https://viacep.com.br/ws/{cep}/json/`

### OpenStreetMap

- Serviço: [openstreetmap.org](https://www.openstreetmap.org/)
- Situação: não integrado
- Uso: mostrar o imóvel no mapa a partir do endereço preenchido pelo CEP e pelo número

## GitHub Actions

Rodar lint e testes em todo pull request.

- Arquivo: `.github/workflows/ci.yml`
- Situação: não existe workflow, nem scripts `lint` e `test` no `package.json`

Um job só, no `pull_request`:

1. `npm install`
2. `npm run lint`
3. `npm run test`

Node 20. Sem matriz de versões, cache, cobertura ou deploy. O lint entra com `next lint`. A suíte cobre o que o pull request alterar, sem ferramenta extra além do necessário para o `npm run test` existir.
