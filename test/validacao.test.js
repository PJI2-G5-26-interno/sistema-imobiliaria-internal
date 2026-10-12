const test = require("node:test")
const assert = require("node:assert/strict")
const {
  obterCamposObrigatoriosPendentes,
  mensagemCamposObrigatorios,
} = require("../lib/validacao")

test("lista todos os campos obrigatórios inválidos", () => {
  const formulario = {
    querySelectorAll(seletor) {
      assert.equal(seletor, ":invalid")
      return [
        {
          id: "cep",
          labels: [{ textContent: "CEP *" }],
          checkValidity: () => false,
        },
        {
          id: "cidade",
          labels: [{ textContent: "Cidade *" }],
          checkValidity: () => true,
        },
        {
          id: "valor",
          labels: [{ textContent: "Valor *" }],
          checkValidity: () => false,
        },
      ]
    },
  }

  const campos = obterCamposObrigatoriosPendentes(formulario)

  assert.deepEqual(campos, [
    { id: "cep", nome: "CEP" },
    { id: "valor", nome: "Valor" },
  ])
  assert.equal(
    mensagemCamposObrigatorios(campos),
    "Revise os campos destacados: CEP, Valor."
  )
})