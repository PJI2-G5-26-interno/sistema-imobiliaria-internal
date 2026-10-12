function dataLocalISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

function obterSituacaoImovel(imovel, contratos, hoje = new Date()) {
  const hojeISO = dataLocalISO(hoje)
  const alugado = contratos.some((contrato) => {
    const imovelId = contrato.imovel_id ?? contrato.imovel
    const inicio = contrato.data_inicio
      ? String(contrato.data_inicio).slice(0, 10)
      : null
    const fim = contrato.data_fim
      ? String(contrato.data_fim).slice(0, 10)
      : null

    return (
      String(imovelId) === String(imovel.id) &&
      contrato.status === "ativo" &&
      (!inicio || inicio <= hojeISO) &&
      (!fim || fim >= hojeISO)
    )
  })

  return {
    ocupacao: alugado ? "alugado" : "disponivel",
    emManutencao: Boolean(imovel.em_manutencao),
  }
}

module.exports = {
  obterSituacaoImovel,
}