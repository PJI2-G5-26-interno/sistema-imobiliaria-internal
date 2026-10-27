const test = require("node:test")
const assert = require("node:assert/strict")
const {
  formatarCpf,
  mascararCpf,
  formatarTelefone,
  mascararTelefone,
  somenteDigitos,
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
  assert.equal(formatarCpf("1234"), "123.4")
})

test("mascara CPF durante a digitação e limita a 11 dígitos", () => {
  assert.equal(mascararCpf("12345678901"), "123.456.789-01")
  assert.equal(mascararCpf("123456789012"), "123.456.789-01")
})

test("extrai somente os dígitos de CPF e telefone mascarados", () => {
  assert.equal(somenteDigitos("123.456.789-01"), "12345678901")
  assert.equal(somenteDigitos("(11) 98765-4321"), "11987654321")
})

test("formata telefone fixo e celular", () => {
  assert.equal(formatarTelefone("11987654321"), "(11) 98765-4321")
  assert.equal(formatarTelefone("1133334444"), "(11) 3333-4444")
})

test("mantém telefone fora do padrão e vazio", () => {
  assert.equal(formatarTelefone(""), "-")
  assert.equal(formatarTelefone("123"), "123")
})

test("mascara celular parcial e completo durante a digitação", () => {
  assert.equal(mascararTelefone("11"), "(11)")
  assert.equal(mascararTelefone("119"), "(11) 9")
  assert.equal(mascararTelefone("11987654321"), "(11) 98765-4321")
  assert.equal(mascararTelefone("119876543219"), "(11) 98765-4321")
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
