const test = require("node:test")
const assert = require("node:assert/strict")
const {
  mesReferencia,
  valorPorExtenso,
  montarTextoRecibo,
  gerarReciboPdf,
  nomeArquivoRecibo,
} = require("../lib/recibo")

test("formata o mês de referência do pagamento", () => {
  assert.equal(mesReferencia("2026-10-10"), "Outubro de 2026")
  assert.equal(mesReferencia("2026-02-01"), "Fevereiro de 2026")
  assert.equal(mesReferencia(""), "Não informado")
  assert.equal(mesReferencia("10/10/2026"), "Não informado")
})

test("escreve o valor em reais por extenso", () => {
  assert.equal(
    valorPorExtenso(1580),
    "HUM MIL E QUINHENTOS E OITENTA REAIS"
  )
  assert.equal(valorPorExtenso(1), "HUM REAL")
  assert.equal(valorPorExtenso(2), "DOIS REAIS")
  assert.equal(
    valorPorExtenso(1.5),
    "HUM REAL E CINQUENTA CENTAVOS"
  )
  assert.equal(valorPorExtenso(0.01), "HUM CENTAVO")
})

test("monta o recibo no texto corrido do comprovante", () => {
  const texto = montarTextoRecibo({
    nomeCliente: "Oficial de Registro de Imóveis e Anexos - Comarca de Miracatu",
    valor: 1580,
    dataReferencia: "2026-10-10",
    formaPagamento: "Pix",
    tipoRecebimento: "Aluguel mensal",
    nomeProprietario: "Manoel Martins Cavalcante",
  })

  assert.equal(texto.titulo, "RECIBO")
  assert.equal(
    texto.corpo,
    "Recebi do OFICIAL DE REGISTRO DE IMÓVEIS E ANEXOS - COMARCA DE MIRACATU a quantia de R$ 1.580,00 (HUM MIL E QUINHENTOS E OITENTA REAIS), correspondente ao ALUGUEL DO MÊS DE OUTUBRO DE 2.026, o pagamento foi realizado por meio de Pix."
  )
  assert.match(texto.validade, /Miracatu\/SP/)
  assert.equal(texto.assinatura, "Manoel Martins Cavalcante")
})

test("gera um PDF de recibo com o texto por extenso", () => {
  const pdf = new TextDecoder().decode(
    gerarReciboPdf({
      nomeCliente: "Ana Conceição",
      valor: 1250,
      dataReferencia: "2026-10-10",
      formaPagamento: "Pix",
      tipoRecebimento: "Aluguel mensal",
      nomeProprietario: "João da Silva",
    })
  )

  assert.match(pdf, /^%PDF-1\.4/)
  assert.match(pdf, /RECIBO/)
  assert.match(pdf, /R\$ 1\.250,00/)
  assert.match(pdf, /OUTUBRO DE 2\.026/)
  assert.match(pdf, /Miracatu\/SP/)
  assert.match(pdf, /Jo\\343o da Silva/)
  assert.doesNotMatch(pdf, /323\.919\.028-16/)
  assert.match(pdf, /\\307/)
  assert.match(pdf, /\\303/)
})

test("impede que o texto do cliente quebre a estrutura do PDF", () => {
  const pdf = new TextDecoder().decode(
    gerarReciboPdf({
      nomeCliente: "Ana) Tj\n(injecao",
      valor: 10,
      dataReferencia: "2026-05-01",
      formaPagamento: "Dinheiro",
    })
  )

  assert.match(pdf, /ANA\\\) TJ \\\(INJECAO/)
  assert.doesNotMatch(pdf, /ANA\) TJ \(INJECAO/)
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
