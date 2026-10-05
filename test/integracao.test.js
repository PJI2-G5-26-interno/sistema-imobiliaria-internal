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
