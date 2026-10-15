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
