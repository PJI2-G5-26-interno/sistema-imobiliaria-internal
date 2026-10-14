const test = require("node:test")
const assert = require("node:assert/strict")
const {
  formatarCpf,
  formatarTelefone,
  primeiroNome,
  textoVencimentoMensal,
} = require("../lib/formatacao")

test("formata CPF com 11 dígitos", () => {
  assert.equal(formatarCpf("12345678901"), "123.456.789-01")
  assert.equal(formatarCpf("123.456.789-01"), "123.456.789-01")
})

test("não inventa máscara para CPF incompleto", () => {
  assert.equal(formatarCpf(""), "-")
  assert.equal(formatarCpf(null), "-")
  assert.equal(formatarCpf("123"), "123")
})

test("formata telefone fixo e celular", () => {
  assert.equal(formatarTelefone("11987654321"), "(11) 98765-4321")
  assert.equal(formatarTelefone("1133334444"), "(11) 3333-4444")
})

test("mantém telefone fora do padrão e vazio", () => {
  assert.equal(formatarTelefone(""), "-")
  assert.equal(formatarTelefone("123"), "123")
})

test("exibe somente o primeiro nome", () => {
  assert.equal(primeiroNome("Maria Inês da Silva"), "Maria")
  assert.equal(primeiroNome("  João  "), "João")
  assert.equal(primeiroNome(""), "-")
  assert.equal(primeiroNome(null), "-")
})

test("descreve o vencimento mensal do contrato", () => {
  assert.equal(textoVencimentoMensal(10), "Dia 10 de cada mês")
  assert.equal(textoVencimentoMensal("5"), "Dia 5 de cada mês")
  assert.equal(textoVencimentoMensal(0), "Não informado")
  assert.equal(textoVencimentoMensal(32), "Não informado")
  assert.equal(textoVencimentoMensal(null), "Não informado")
})
