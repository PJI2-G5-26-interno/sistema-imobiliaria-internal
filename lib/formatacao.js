function apenasDigitos(valor) {
  return String(valor).replace(/\D/g, "")
}

function formatarCpf(valor) {
  if (!valor) {
    return "-"
  }

  const digitos = apenasDigitos(valor)

  if (digitos.length !== 11) {
    return String(valor)
  }

  return digitos.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4"
  )
}

function formatarTelefone(valor) {
  if (!valor) {
    return "-"
  }

  const digitos = apenasDigitos(valor)

  if (digitos.length === 11) {
    return digitos.replace(
      /(\d{2})(\d{5})(\d{4})/,
      "($1) $2-$3"
    )
  }

  if (digitos.length === 10) {
    return digitos.replace(
      /(\d{2})(\d{4})(\d{4})/,
      "($1) $2-$3"
    )
  }

  return String(valor)
}

module.exports = {
  formatarCpf,
  formatarTelefone,
}
