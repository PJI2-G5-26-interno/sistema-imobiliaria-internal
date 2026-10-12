const test = require("node:test")
const assert = require("node:assert/strict")
const { obterSituacaoImovel } = require("../lib/imoveis")

test("deriva a ocupação de contratos vigentes e preserva manutenção", () => {
  const hoje = new Date(2026, 9, 11)
  const imovel = { id: 12, em_manutencao: true }
  const contratos = [
    {
      imovel_id: 12,
      status: "ativo",
      data_inicio: "2026-10-01",
      data_fim: "2026-12-01",
    },
  ]

  assert.deepEqual(
    obterSituacaoImovel(imovel, contratos, hoje),
    { ocupacao: "alugado", emManutencao: true }
  )
})

test("contratos encerrados e fora do período não ocupam o imóvel", () => {
  const hoje = new Date(2026, 9, 11)
  const imovel = { id: 12, em_manutencao: false }

  assert.deepEqual(
    obterSituacaoImovel(
      imovel,
      [
        {
          imovel_id: 12,
          status: "encerrado",
          data_inicio: "2026-01-01",
          data_fim: "2026-12-01",
        },
      ],
      hoje
    ),
    { ocupacao: "disponivel", emManutencao: false }
  )
})