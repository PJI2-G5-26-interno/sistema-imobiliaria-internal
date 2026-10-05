const test = require("node:test")
const assert = require("node:assert/strict")
const {
  formatarCpf,
  formatarTelefone,
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
