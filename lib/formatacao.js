function apenasDigitos(valor) {
  return String(valor).replace(/\D/g, "")
}

function formatarCpf(valor) {
  if (!valor) {
    return "-"
  }

  const digitos = apenasDigitos(valor)

  if (!digitos || digitos.length > 11) {
    return String(valor)
  }

  return mascararCpf(digitos)
}

function mascararCpf(valor) {
  const digitos = apenasDigitos(valor).slice(0, 11)
  let mascara = digitos.slice(0, 3)

  if (digitos.length > 3) {
    mascara += `.${digitos.slice(3, 6)}`
  }

  if (digitos.length > 6) {
    mascara += `.${digitos.slice(6, 9)}`
  }

  if (digitos.length > 9) {
    mascara += `-${digitos.slice(9, 11)}`
  }

  return mascara
}

function primeiroNome(nome) {
  const texto = String(nome || "").trim()

  if (!texto) {
    return "-"
  }

  return texto.split(/\s+/)[0]
}

function textoVencimentoMensal(dia) {
  const numero = Number(dia)

  if (!Number.isInteger(numero) || numero < 1 || numero > 31) {
    return "Não informado"
  }

  return `Dia ${numero} de cada mês`
}

function formatarTelefone(valor) {
  if (!valor) {
    return "-"
  }

  const digitos = apenasDigitos(valor)

  if (
    (digitos.length === 10 || digitos.length === 11) &&
    /^[\d\s()+.-]+$/.test(String(valor))
  ) {
    return mascararTelefone(digitos)
  }

  return String(valor)
}

function mascararTelefone(valor) {
  const digitos = apenasDigitos(valor).slice(0, 11)

  if (!digitos) {
    return ""
  }

  if (digitos.length === 1) {
    return `(${digitos}`
  }

  if (digitos.length === 2) {
    return `(${digitos})`
  }

  const ddd = digitos.slice(0, 2)
  const numero = digitos.slice(2)
  const tamanhoPrimeiroGrupo = numero.startsWith("9") ? 5 : 4

  if (numero.length <= tamanhoPrimeiroGrupo) {
    return `(${ddd}) ${numero}`
  }

  return `(${ddd}) ${numero.slice(0, tamanhoPrimeiroGrupo)}-${numero.slice(tamanhoPrimeiroGrupo)}`
}

module.exports = {
  formatarCpf,
  mascararCpf,
  formatarTelefone,
  mascararTelefone,
  somenteDigitos: apenasDigitos,
  primeiroNome,
  textoVencimentoMensal,
}
