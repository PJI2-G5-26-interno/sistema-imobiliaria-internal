const test = require("node:test")
const assert = require("node:assert/strict")
const {
  mesReferencia,
  gerarReciboPdf,
  nomeArquivoRecibo,
} = require("../lib/recibo")

test("formata o mês de referência do pagamento", () => {
  assert.equal(mesReferencia("2026-10-10"), "Outubro de 2026")
  assert.equal(mesReferencia("2026-02-01"), "Fevereiro de 2026")
  assert.equal(mesReferencia(""), "Não informado")
  assert.equal(mesReferencia("10/10/2026"), "Não informado")
})

test("gera um PDF de recibo com os dados do pagamento", () => {
  const pdf = new TextDecoder().decode(
    gerarReciboPdf({
      nomeCliente: "Ana Conceição",
      numeroContrato: "CT-15",
      valorRecebido: "R$ 1.250,00",
      mesReferencia: "Outubro de 2026",
    })
  )

  assert.match(pdf, /^%PDF-1\.4/)
  assert.match(pdf, /Recibo de pagamento/)
  assert.match(pdf, /CT-15/)
  assert.match(pdf, /R\$ 1\.250,00/)
  assert.match(pdf, /Outubro de 2026/)
  assert.match(pdf, /Assinatura/)
  assert.match(pdf, /\\347/)
  assert.match(pdf, /\\343/)
})

test("impede que o texto do cliente quebre a estrutura do PDF", () => {
  const pdf = new TextDecoder().decode(
    gerarReciboPdf({
      nomeCliente: "Ana) Tj\n(injecao",
      numeroContrato: "CT-1",
      valorRecebido: "R$ 10,00",
      mesReferencia: "Maio de 2026",
    })
  )

  assert.match(pdf, /Ana\\\) Tj \\\(injecao/)
  assert.doesNotMatch(pdf, /Ana\) Tj \(injecao/)
})

test("monta um nome de arquivo seguro para o recibo", () => {
  assert.equal(
    nomeArquivoRecibo("CT 15/2026", "2026-10-10"),
    "recibo-CT-15-2026-2026-10.pdf"
  )
  assert.equal(
    nomeArquivoRecibo("../../etc", ""),
    "recibo-etc-sem-referencia.pdf"
  )
})
