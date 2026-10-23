const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("fs")
const path = require("path")

function arquivosJs(diretorio, acumulado = []) {
  for (const item of fs.readdirSync(diretorio, { withFileTypes: true })) {
    const caminho = path.join(diretorio, item.name)
    if (item.isDirectory()) {
      arquivosJs(caminho, acumulado)
    } else if (item.name.endsWith(".js")) {
      acumulado.push(caminho)
    }
  }
  return acumulado
}

test("a migration cobre as tabelas que as telas consultam", () => {
  const usadas = new Set()

  for (const arquivo of arquivosJs(path.join(__dirname, "..", "app"))) {
    const texto = fs.readFileSync(arquivo, "utf8")
    for (const encontrado of texto.matchAll(/\.from\(\s*["']([a-z_]+)["']\s*\)/g)) {
      usadas.add(encontrado[1])
    }
  }

  const migration = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20261005180000_imobgest_inicial.sql"
    ),
    "utf8"
  )

  assert.ok(usadas.size > 0)

  for (const tabela of usadas) {
    assert.match(
      migration,
      new RegExp(`create table public\\.${tabela}\\b`),
      `a tabela ${tabela} é usada na aplicação e não está na migration`
    )
  }
})

test("a migration torna opcionais os campos fora das planilhas", () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20261011120000_ajusta_campos_cadastro.sql"
    ),
    "utf8"
  )

  assert.match(migration, /imoveis[\s\S]*drop column if exists codigo/i)
  assert.match(migration, /contratos[\s\S]*alter column numero drop not null/i)
  assert.match(migration, /despesas[\s\S]*alter column categoria drop not null/i)
})

test("a migration automatiza códigos e sincroniza contratos e recebimentos", () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20261011160000_codigos_contratos_e_recebimentos.sql"
    ),
    "utf8"
  )

  assert.match(migration, /gerar_numero_contrato/i)
  assert.match(migration, /create unique index[\s\S]*contratos_numero_key/i)
  assert.match(migration, /sync_recebimento_contrato/i)
})

test("a migration inclui cônjuge e telefone secundário do cliente", () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20261014200000_clientes_conjuge_telefone.sql"
    ),
    "utf8"
  )

  assert.match(migration, /alter table public\.clientes/i)
  assert.match(migration, /add column if not exists conjuge text/i)
  assert.match(migration, /add column if not exists telefone_secundario text/i)
})

test("a migration restringe RLS ao admin ativo e o lookup de login", () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20261019220000_restringe_rls_e_login.sql"
    ),
    "utf8"
  )

  assert.match(migration, /eh_admin_ativo/)
  assert.match(migration, /resolver_email_admin/)
  assert.match(migration, /drop policy if exists "login le profiles"/)
  assert.match(migration, /revoke select on table public\.profiles from anon/)
  assert.match(migration, /admin ativo gerencia clientes/)
})

test("o login no browser não consulta profiles nem distingue erros", () => {
  const loginPage = fs.readFileSync(
    path.join(__dirname, "..", "app", "page.js"),
    "utf8"
  )
  const loginApi = fs.readFileSync(
    path.join(__dirname, "..", "app", "api", "login", "route.js"),
    "utf8"
  )

  assert.doesNotMatch(loginPage, /\.from\(\s*["']profiles["']\s*\)/)
  assert.match(loginPage, /fetch\("\/api\/login"/)
  assert.match(loginApi, /MENSAGEM_LOGIN_GENERICA/)
  assert.match(loginApi, /origemDoPedidoEhValida/)
})

test("a rota de teste não permanece no deploy", () => {
  const paginaTeste = path.join(__dirname, "..", "app", "teste", "page.js")

  assert.equal(fs.existsSync(paginaTeste), false)
})

test("a borda envia headers de segurança", () => {
  const config = fs.readFileSync(
    path.join(__dirname, "..", "next.config.js"),
    "utf8"
  )

  assert.match(config, /Content-Security-Policy/)
  assert.match(config, /X-Frame-Options/)
  assert.match(config, /X-Content-Type-Options/)
  assert.match(config, /poweredByHeader: false/)
})

test("a migration separada rege manutenção e sobreposição de contratos", () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20261011170000_status_imoveis_e_contratos.sql"
    ),
    "utf8"
  )

  assert.match(migration, /validar_disponibilidade_contrato/i)
  assert.match(migration, /add column if not exists em_manutencao/i)
  assert.match(migration, /add column if not exists tipo_outro/i)
})
