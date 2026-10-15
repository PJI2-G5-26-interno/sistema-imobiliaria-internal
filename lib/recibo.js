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

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function mesmoId(esquerda, direita) {
  const a = String(esquerda ?? "").trim()
  const b = String(direita ?? "").trim()
  return a !== "" && a === b
}

function resolverImovelDoRecebimento(recebimento, contratos, imoveis) {
  const listaContratos = Array.isArray(contratos) ? contratos : []
  const listaImoveis = Array.isArray(imoveis) ? imoveis : []
  let contrato = listaContratos.find((item) =>
    mesmoId(item.id, recebimento?.contrato_id)
  )

  if (!contrato && recebimento?.numero_contrato) {
    contrato = listaContratos.find((item) =>
      mesmoId(item.numero, recebimento.numero_contrato)
    )
  }

  if (!contrato && recebimento?.cliente_id) {
    const doCliente = listaContratos.filter((item) =>
      mesmoId(item.cliente_id ?? item.cliente, recebimento.cliente_id)
    )

    if (doCliente.length === 1) {
      contrato = doCliente[0]
    }
  }

  const referencias = [
    recebimento?.imovel_id,
    contrato?.imovel_id,
    contrato?.imovel,
  ]
    .map((valor) => String(valor ?? "").trim())
    .filter(Boolean)

  for (const referencia of referencias) {
    const porId = listaImoveis.find((imovel) => mesmoId(imovel.id, referencia))
    if (porId) {
      return porId
    }

    const nome = normalizarBusca(referencia)
    const porTitulo = listaImoveis.find(
      (imovel) => normalizarBusca(imovel.titulo) === nome
    )
    if (porTitulo) {
      return porTitulo
    }
  }

  return null
}

function localidadeDoImovel(imovel) {
  const cidade = sanitizarTexto(imovel?.cidade, 80)
  const estado = sanitizarTexto(imovel?.estado, 8).toLocaleUpperCase("pt-BR")
  const uf = /^[A-Z]{2}$/.test(estado) ? estado : ""

  if (cidade) {
    return { cidade, estado: uf }
  }

  const endereco = [imovel?.endereco, imovel?.bairro]
    .map((parte) => sanitizarTexto(parte, 160))
    .filter(Boolean)
    .join(", ")
  const comUf = endereco.match(
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{1,40}?)\s*(?:\/|-)\s*([A-Za-z]{2})\s*$/
  )

  if (comUf) {
    return {
      cidade: comUf[1].trim(),
      estado: comUf[2].toLocaleUpperCase("pt-BR"),
    }
  }

  const partes = endereco.split(",").map((parte) => parte.trim()).filter(Boolean)
  const ultima = partes[partes.length - 1] || ""

  if (partes.length > 1 && ultima && !/\d/.test(ultima)) {
    return { cidade: ultima, estado: "" }
  }

  return { cidade: "", estado: "" }
}

function localRecibo(cidade, estado) {
  const nomeCidade = sanitizarTexto(cidade, 80)
  const uf = sanitizarTexto(estado, 2).toLocaleUpperCase("pt-BR")

  if (nomeCidade && uf && !nomeCidade.includes("/")) {
    return `${nomeCidade}/${uf}`
  }

  return nomeCidade || "cidade não informada"
}

function textoValidade(cidade, estado) {
  return `Para que este recibo tenha plena validade, firmo o presente digitalmente na cidade de ${localRecibo(cidade, estado)}, na data de assinatura digital abaixo.`
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
  cidade,
  estado,
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
    validade: textoValidade(cidade, estado),
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

const LARGURA_HELVETICA = {
  " ": 278,
  ".": 278,
  ",": 278,
  ":": 278,
  ";": 278,
  "/": 278,
  "-": 333,
  "(": 333,
  ")": 333,
  $: 556,
  "0": 556,
  "1": 556,
  "2": 556,
  "3": 556,
  "4": 556,
  "5": 556,
  "6": 556,
  "7": 556,
  "8": 556,
  "9": 556,
  A: 667,
  B: 667,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 500,
  K: 667,
  L: 556,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
  a: 556,
  b: 556,
  c: 500,
  d: 556,
  e: 556,
  f: 278,
  g: 556,
  h: 556,
  i: 222,
  j: 222,
  k: 500,
  l: 222,
  m: 833,
  n: 556,
  o: 556,
  p: 556,
  q: 556,
  r: 333,
  s: 500,
  t: 278,
  u: 556,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 500,
}

function larguraTexto(texto, tamanho) {
  let unidades = 0

  for (const caractere of String(texto)) {
    const base = caractere.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    unidades += LARGURA_HELVETICA[base] || LARGURA_HELVETICA[caractere] || 556
  }

  return (unidades / 1000) * tamanho
}

function xCentralizado(texto, tamanho) {
  return (595 - larguraTexto(texto, tamanho)) / 2
}

function quebrarPorLargura(texto, tamanho, larguraMax) {
  const palavras = sanitizarTexto(texto, 2000).split(" ").filter(Boolean)
  const linhas = []
  let atual = ""

  for (const palavra of palavras) {
    const candidata = atual ? `${atual} ${palavra}` : palavra

    if (!atual || larguraTexto(candidata, tamanho) <= larguraMax) {
      atual = candidata
    } else {
      linhas.push(atual)
      atual = palavra
    }
  }

  if (atual) {
    linhas.push(atual)
  }

  return linhas
}

function comandoTexto(fonte, x, y, tamanho, texto) {
  return [
    "BT",
    `/${fonte} ${tamanho} Tf`,
    `${x.toFixed(1)} ${y.toFixed(1)} Td`,
    `(${escaparPdf(texto)}) Tj`,
    "ET",
  ].join("\n")
}

function escreverParagrafo(comandos, texto, y, tamanho, x, larguraMax) {
  const linhas = quebrarPorLargura(texto, tamanho, larguraMax)

  linhas.forEach((linha, indice) => {
    const ultima = indice === linhas.length - 1
    const espacos = (linha.match(/ /g) || []).length
    let espacamento = 0

    if (!ultima && espacos > 0) {
      const folga = larguraMax - larguraTexto(linha, tamanho)
      espacamento = Math.max(0, folga / espacos)
    }

    comandos.push(`${espacamento.toFixed(2)} Tw`)
    comandos.push(comandoTexto("F1", x, y, tamanho, linha))
    y -= 17
  })

  comandos.push("0 Tw")
  return y
}

function desenharAssinatura(comandos, nome) {
  const linhas = quebrarPorLargura(nome, 12, 320)
  const yNome = 62 + (linhas.length - 1) * 15
  const yRotulo = yNome + 20
  const yLinha = yRotulo + 16
  const x1 = 168
  const x2 = 427

  comandos.push("0.35 0.42 0.45 RG")
  comandos.push("0.9 w")
  comandos.push(`${x1} ${yLinha} m`)
  comandos.push(`${x2} ${yLinha} l`)
  comandos.push("S")
  comandos.push("0 0 0 RG")
  comandos.push("0.35 0.42 0.45 rg")
  comandos.push(comandoTexto("F1", xCentralizado("Assinatura", 9), yRotulo, 9, "Assinatura"))
  comandos.push("0 0 0 rg")

  linhas.forEach((linha, indice) => {
    comandos.push(
      comandoTexto("F2", xCentralizado(linha, 12), yNome - indice * 15, 12, linha)
    )
  })
}

function gerarReciboPdf(dados) {
  const texto = montarTextoRecibo(dados)
  const xTexto = 56
  const larguraTextoUtil = 483
  const comandos = [
    "0.059 0.361 0.431 rg",
    "36.4 768.4 522.2 37.2 re",
    "f",
    "0 0 0 RG",
    "0.7 w",
    "36 36 523 770 re",
    "S",
    "1 1 1 rg",
    comandoTexto("F2", xCentralizado(texto.titulo, 16), 781, 16, texto.titulo),
    "0 0 0 rg",
  ]

  let y = escreverParagrafo(comandos, texto.corpo, 734, 11, xTexto, larguraTextoUtil)
  y -= 14
  escreverParagrafo(comandos, texto.validade, y, 11, xTexto, larguraTextoUtil)
  desenharAssinatura(comandos, texto.assinatura)

  const fluxo = comandos.join("\n")
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    `<< /Length ${fluxo.length} >>\nstream\n${fluxo}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
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
  resolverImovelDoRecebimento,
  localidadeDoImovel,
  gerarReciboPdf,
  baixarPdf,
  nomeArquivoRecibo,
  escaparPdf,
}
