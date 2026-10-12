function obterCamposObrigatoriosPendentes(formulario) {
  return Array.from(
    formulario.querySelectorAll(":invalid")
  )
    .filter((campo) => !campo.checkValidity())
    .map((campo) => ({
      id: campo.id,
      nome: String(
        campo.labels?.[0]?.textContent ||
          campo.getAttribute("aria-label") ||
          campo.name ||
          "Campo obrigatório"
      )
        .replace(/\*/g, "")
        .trim(),
    }))
}

function mensagemCamposObrigatorios(campos) {
  return `Revise os campos destacados: ${campos
    .map((campo) => campo.nome)
    .join(", ")}.`
}

module.exports = {
  obterCamposObrigatoriosPendentes,
  mensagemCamposObrigatorios,
}