const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

const UNIDADES = [
  "",
  "hum",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
]

const DEZENA_ESPECIAL = [
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
]

const DEZENAS = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
]

const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
]

const VALIDADE =
  "Para que este recibo tenha plena validade, firmo o presente digitalmente na cidade de Miracatu/SP, na data de assinatura digital abaixo."

function sanitizarTexto(valor, limite = 1500) {
  return String(valor ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limite)
}

function mesReferencia(dataIso) {
  const correspondencia = /^(\d{4})-(\d{2})/.exec(String(dataIso || ""))

  if (!correspondencia) {
    return "Não informado"
  }

  const indice = Number(correspondencia[2]) - 1
  const nome = MESES[indice]

  if (!nome) {
    return "Não informado"
  }

  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${correspondencia[1]}`
}

function grupoPorExtenso(numero) {
  if (numero === 0) {
    return ""
  }

  if (numero === 100) {
    return "cem"
  }

  const centena = Math.floor(numero / 100)
  const resto = numero % 100
  const partes = []

  if (centena) {
    partes.push(CENTENAS[centena])
  }

  if (resto >= 10 && resto <= 19) {
    partes.push(DEZENA_ESPECIAL[resto - 10])
  } else {
    const dezena = Math.floor(resto / 10)
    const unidade = resto % 10

    if (dezena) {
      partes.push(DEZENAS[dezena])
    }

    if (unidade) {
      partes.push(UNIDADES[unidade])
    }
  }

  return partes.join(" e ")
}

function inteiroPorExtenso(numero) {
  if (numero === 0) {
    return "zero"
  }

  const milhoes = Math.floor(numero / 1000000)
  const milhares = Math.floor((numero % 1000000) / 1000)
  const resto = numero % 1000
  const partes = []

  if (milhoes === 1) {
    partes.push("hum milhão")
  } else if (milhoes > 1) {
    partes.push(`${grupoPorExtenso(milhoes)} milhões`)
  }

  if (milhares === 1) {
    partes.push("hum mil")
  } else if (milhares > 1) {
    partes.push(`${grupoPorExtenso(milhares)} mil`)
  }

  if (resto) {
    partes.push(grupoPorExtenso(resto))
  }

  return partes.join(" e ")
}

function valorPorExtenso(valor) {
  const numero = Number(valor)

  if (!Number.isFinite(numero) || numero < 0) {
    return "ZERO REAIS"
  }

  const centavosTotais = Math.round(numero * 100)
  const reais = Math.floor(centavosTotais / 100)
  const centavos = centavosTotais % 100
  const partes = []

  if (reais > 0 || centavos === 0) {
    partes.push(
      `${inteiroPorExtenso(reais).toLocaleUpperCase("pt-BR")} ${
        reais === 1 ? "REAL" : "REAIS"
      }`
    )
  }

  if (centavos > 0) {
    partes.push(
      `${inteiroPorExtenso(centavos).toLocaleUpperCase("pt-BR")} ${
        centavos === 1 ? "CENTAVO" : "CENTAVOS"
      }`
    )
  }

  return partes.join(" E ")
}

function formatarReais(valor) {
  const numero = Number(valor)
  const seguro = Number.isFinite(numero) ? numero : 0
  const [inteiro, centavos] = seguro.toFixed(2).split(".")
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `R$ ${comMilhar},${centavos}`
}

function competenciaRecibo(dataIso) {
  const correspondencia = /^(\d{4})-(\d{2})/.exec(String(dataIso || ""))

  if (!correspondencia) {
    return "MÊS NÃO INFORMADO"
  }

  const nome = MESES[Number(correspondencia[2]) - 1]

  if (!nome) {
    return "MÊS NÃO INFORMADO"
  }

  const ano = `${correspondencia[1].slice(0, 1)}.${correspondencia[1].slice(1)}`

  return `${nome.toLocaleUpperCase("pt-BR")} DE ${ano}`
}

function meioPagamento(forma) {
  return sanitizarTexto(forma, 80) || "não informada"
}

function assuntoRecibo(tipo, competencia) {
  const texto = sanitizarTexto(tipo, 80).toLocaleLowerCase("pt-BR")
  const assunto =
    !texto || texto.includes("aluguel")
      ? "ALUGUEL"
      : texto.toLocaleUpperCase("pt-BR")

  return `${assunto} DO MÊS DE ${competencia}`
}

function montarTextoRecibo({
  nomeCliente,
  valor,
  dataReferencia,
  formaPagamento,
  tipoRecebimento,
  nomeProprietario,
}) {
  const nome = sanitizarTexto(nomeCliente, 180).toLocaleUpperCase("pt-BR") || "CLIENTE NÃO INFORMADO"
  const proprietario =
    sanitizarTexto(nomeProprietario, 180) || "Proprietário não informado"
  const corpo =
    `Recebi do ${nome} a quantia de ${formatarReais(valor)} ` +
    `(${valorPorExtenso(valor)}), correspondente ao ` +
    `${assuntoRecibo(tipoRecebimento, competenciaRecibo(dataReferencia))}, ` +
    `o pagamento foi realizado por meio de ${meioPagamento(formaPagamento)}.`

  return {
    titulo: "RECIBO",
    corpo,
    validade: VALIDADE,
    assinatura: proprietario,
  }
}

function escaparPdf(valor) {
  let saida = ""

  for (const caractere of sanitizarTexto(valor, 500).normalize("NFC")) {
    const codigo = caractere.codePointAt(0)

    if (caractere === "\\") {
      saida += "\\\\"
    } else if (caractere === "(") {
      saida += "\\("
    } else if (caractere === ")") {
      saida += "\\)"
    } else if (codigo < 32 || codigo > 255) {
      saida += "?"
    } else if (codigo > 126) {
      saida += `\\${codigo.toString(8).padStart(3, "0")}`
    } else {
      saida += caractere
    }
  }

  return saida
}

function quebrarLinha(valor, limite = 78) {
  const texto = sanitizarTexto(valor, 2000)
  const partes = []
  let restante = texto

  while (restante.length > limite) {
    let corte = restante.lastIndexOf(" ", limite)
    if (corte < 12) {
      corte = limite
    }
    partes.push(restante.slice(0, corte))
    restante = restante.slice(corte).trim()
  }

  if (restante) {
    partes.push(restante)
  }

  return partes
}

function comandoTexto(x, y, tamanho, texto) {
  return [
    "BT",
    `/F1 ${tamanho} Tf`,
    `${x} ${y} Td`,
    `(${escaparPdf(texto)}) Tj`,
    "ET",
  ].join("\n")
}

function escreverParagrafo(comandos, texto, y, tamanho) {
  for (const linha of quebrarLinha(texto)) {
    comandos.push(comandoTexto(56, y, tamanho, linha))
    y -= 16
  }

  return y
}

function gerarReciboPdf(dados) {
  const texto = montarTextoRecibo(dados)
  const comandos = [
    "0.15 w",
    "40 40 515 762 re",
    "S",
    comandoTexto(56, 760, 18, texto.titulo),
  ]

  let y = escreverParagrafo(comandos, texto.corpo, 710, 11)
  y -= 10
  y = escreverParagrafo(comandos, texto.validade, y, 11)
  y -= 28
  comandos.push("56 " + y + " m")
  comandos.push("280 " + y + " l")
  comandos.push("S")
  y -= 18
  comandos.push(comandoTexto(56, y, 11, "Assinatura"))
  y -= 16
  comandos.push(comandoTexto(56, y, 11, texto.assinatura))

  const fluxo = comandos.join("\n")
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${fluxo.length} >>\nstream\n${fluxo}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ]

  let pdf = "%PDF-1.4\n"
  const offsets = [0]

  objetos.forEach((objeto, indice) => {
    offsets.push(pdf.length)
    pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`
  })

  const inicioXref = pdf.length
  pdf += `xref\n0 ${objetos.length + 1}\n`
  pdf += "0000000000 65535 f \n"

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\n`
  pdf += `startxref\n${inicioXref}\n%%EOF`

  return new TextEncoder().encode(pdf)
}

function baixarPdf(bytes, nomeArquivo) {
  const blob = new Blob([bytes], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = nomeArquivo
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function nomeArquivoRecibo(numeroContrato, dataReferencia) {
  const contrato = String(numeroContrato || "sem-contrato")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "sem-contrato"

  const referencia = /^(\d{4}-\d{2})/.exec(String(dataReferencia || ""))

  return `recibo-${contrato}-${referencia?.[1] || "sem-referencia"}.pdf`
}

module.exports = {
  mesReferencia,
  valorPorExtenso,
  montarTextoRecibo,
  gerarReciboPdf,
  baixarPdf,
  nomeArquivoRecibo,
  escaparPdf,
}
