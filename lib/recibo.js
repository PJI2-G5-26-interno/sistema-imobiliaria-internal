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

function textoRecibo(valor) {
  const texto = String(valor ?? "").replace(/\s+/g, " ").trim()
  return texto.slice(0, 180) || "Não informado"
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

function escaparPdf(valor) {
  let saida = ""

  for (const caractere of textoRecibo(valor).normalize("NFC")) {
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

function quebrarLinha(valor, limite = 72) {
  const texto = textoRecibo(valor)
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

  partes.push(restante)
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

function gerarReciboPdf({
  nomeCliente,
  numeroContrato,
  valorRecebido,
  mesReferencia: referencia,
}) {
  const campos = [
    ["Cliente", nomeCliente],
    ["Contrato", numeroContrato],
    ["Valor recebido", valorRecebido],
    ["Mês de referência", referencia],
  ]

  const comandos = [
    "0.15 w",
    "40 40 515 762 re",
    "S",
    comandoTexto(56, 760, 18, "Recibo de pagamento"),
    comandoTexto(56, 732, 11, "ImobGest"),
  ]

  let y = 690

  for (const [rotulo, valor] of campos) {
    const linhas = quebrarLinha(`${rotulo}: ${textoRecibo(valor)}`)

    for (const linha of linhas) {
      comandos.push(comandoTexto(56, y, 12, linha))
      y -= 20
    }

    y -= 8
  }

  comandos.push("50 180 m")
  comandos.push("280 180 l")
  comandos.push("S")
  comandos.push(comandoTexto(56, 160, 11, "Assinatura"))

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
  gerarReciboPdf,
  baixarPdf,
  nomeArquivoRecibo,
  escaparPdf,
}
