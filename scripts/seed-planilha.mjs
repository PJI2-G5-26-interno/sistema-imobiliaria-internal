import { randomUUID } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..")
const docs = join(raiz, "docs")
const anoCompetencia = 2026

const arquivos = {
  cadastro:
    "Planilha-Controle-Alugueis-j2n6DW9TVAM.xlsx - CADASTRO.csv",
  alugueis:
    "Planilha-Controle-Alugueis-j2n6DW9TVAM.xlsx - ALUGUEIS (ENTRADAS).csv",
  despesas:
    "Planilha-Controle-Alugueis-j2n6DW9TVAM.xlsx - DESPESAS MANUTENÇÃO GASTOS.csv",
}

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

function parseCsv(texto) {
  const linhas = []
  let linha = []
  let celula = ""
  let aspas = false

  for (let i = 0; i < texto.length; i += 1) {
    const caractere = texto[i]

    if (aspas) {
      if (caractere === '"') {
        if (texto[i + 1] === '"') {
          celula += '"'
          i += 1
        } else {
          aspas = false
        }
      } else {
        celula += caractere
      }
      continue
    }

    if (caractere === '"') {
      aspas = true
    } else if (caractere === ",") {
      linha.push(celula)
      celula = ""
    } else if (caractere === "\n") {
      linha.push(celula)
      linhas.push(linha)
      linha = []
      celula = ""
    } else if (caractere !== "\r") {
      celula += caractere
    }
  }

  if (celula.length > 0 || linha.length > 0) {
    linha.push(celula)
    linhas.push(linha)
  }

  return linhas
}

function ler(nome) {
  return parseCsv(readFileSync(join(docs, nome), "utf8"))
}

function limpar(valor) {
  const texto = String(valor || "").replace(/\s+/g, " ").trim()

  if (!texto || texto.includes("#REF") || texto === "#VALUE!") {
    return ""
  }

  return texto
}

function chave(valor) {
  return limpar(valor)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[–—]/g, "-")
    .toLowerCase()
}

function sqlTexto(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "null"
  }

  return `'${String(valor).replace(/'/g, "''")}'`
}

function sqlNumero(valor) {
  if (valor === null || valor === undefined) {
    return "null"
  }

  return String(valor)
}

function parseData(valor) {
  const texto = limpar(valor)
  const partes = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)

  if (!partes) {
    return null
  }

  let ano = Number(partes[3])

  if (ano < 100) {
    ano += 2000
  }

  const mes = String(partes[2]).padStart(2, "0")
  const dia = String(partes[1]).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

function parseDinheiro(valor) {
  const texto = limpar(valor).replace(/R\$/gi, "").trim()

  if (!texto || /[a-zA-ZÀ-ÿ]/.test(texto)) {
    return null
  }

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto

  const numero = Number(normalizado)

  return Number.isFinite(numero) ? numero : null
}

function parseDia(valor) {
  const numero = Number(limpar(valor))

  if (!Number.isInteger(numero) || numero < 1 || numero > 31) {
    return null
  }

  return numero
}

function depoisDoCabecalho(linhas, rotulo) {
  const indice = linhas.findIndex((linha) =>
    linha.some((celula) => chave(celula) === chave(rotulo))
  )

  return indice === -1 ? [] : linhas.slice(indice + 1)
}

function tipoImovel(titulo) {
  const nome = chave(titulo)

  if (nome.includes("apartamento")) {
    return "Apartamento"
  }

  if (nome.includes("loja") || nome.includes("sala")) {
    return "Sala comercial"
  }

  if (nome.includes("galpao")) {
    return "Comercial"
  }

  return "Casa"
}

function vencimento(ano, mes, dia) {
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const diaUtil = Math.min(dia || 1, ultimoDia)

  return `${ano}-${String(mes).padStart(2, "0")}-${String(diaUtil).padStart(2, "0")}`
}

function classificarMes(valor) {
  const texto = limpar(valor)

  if (!texto) {
    return null
  }

  const dinheiro = parseDinheiro(texto)

  if (dinheiro !== null) {
    return {
      valor: dinheiro,
      status: "Recebido",
      observacoes: null,
    }
  }

  return {
    valor: null,
    status: "Pendente",
    observacoes: texto,
  }
}

const cadastro = ler(arquivos.cadastro)
const alugueis = ler(arquivos.alugueis)
const despesas = ler(arquivos.despesas)

const proprietarios = new Map()
const clientes = new Map()
const imoveis = new Map()
const contratos = []

function obterProprietario(nome, pix) {
  const nomeLimpo = limpar(nome)

  if (!nomeLimpo) {
    return null
  }

  const idExistente = proprietarios.get(chave(nomeLimpo))

  if (idExistente) {
    if (pix && !idExistente.pix_chave) {
      idExistente.pix_chave = pix
    }

    return idExistente
  }

  const registro = {
    id: randomUUID(),
    nome: nomeLimpo,
    pix_chave: pix || null,
  }

  proprietarios.set(chave(nomeLimpo), registro)
  return registro
}

function obterCliente(nome, telefone) {
  const nomeLimpo = limpar(nome)

  if (!nomeLimpo) {
    return null
  }

  const existente = clientes.get(chave(nomeLimpo))

  if (existente) {
    if (telefone && !existente.telefone) {
      existente.telefone = telefone
    }

    return existente
  }

  const registro = {
    id: randomUUID(),
    nome: nomeLimpo,
    telefone: telefone || null,
  }

  clientes.set(chave(nomeLimpo), registro)
  return registro
}

function obterImovel(dados) {
  const titulo = limpar(dados.titulo)

  if (!titulo) {
    return null
  }

  const existente = imoveis.get(chave(titulo))

  if (existente) {
    return existente
  }

  const registro = {
    id: randomUUID(),
    titulo,
    tipo: tipoImovel(titulo),
    status: dados.status || "disponivel",
    valor: dados.valor ?? null,
    endereco: dados.endereco || null,
    cidade: dados.cidade || null,
    estado: dados.cidade ? "SP" : null,
    proprietario_id: dados.proprietario_id || null,
    elektro_codigo: dados.elektro_codigo || null,
    elektro_medidor: dados.elektro_medidor || null,
    sabesp_fornecimento: dados.sabesp_fornecimento || null,
    rgi_sabesp: dados.rgi_sabesp || null,
    hidrometro_sabesp: dados.hidrometro_sabesp || null,
    iptu: dados.iptu || null,
  }

  imoveis.set(chave(titulo), registro)
  return registro
}

for (const linha of depoisDoCabecalho(cadastro, "NOME DO IMÓVEL")) {
  const cidade = limpar(linha[1])
  const endereco = limpar(linha[2])
  const titulo = limpar(linha[14])
  const inquilino = limpar(linha[16])

  if (!titulo && !inquilino && !endereco) {
    continue
  }

  const recebe = limpar(linha[20])
  const pix = limpar(linha[21])
  const dono = obterProprietario(linha[3])

  if (recebe) {
    obterProprietario(recebe, pix)
  }

  const cliente = obterCliente(inquilino, limpar(linha[17]))
  const imovel = obterImovel({
    titulo: titulo || endereco,
    status: chave(linha[15]) === "alugado" ? "alugado" : "disponivel",
    valor: parseDinheiro(linha[19]),
    endereco,
    cidade,
    proprietario_id: dono?.id || null,
    elektro_codigo: limpar(linha[4]),
    elektro_medidor: limpar(linha[5]),
    sabesp_fornecimento: limpar(linha[6]),
    rgi_sabesp: limpar(linha[7]),
    hidrometro_sabesp: limpar(linha[8]),
    iptu: limpar(linha[9]),
  })

  if (!imovel) {
    continue
  }

  contratos.push({
    id: randomUUID(),
    numero: String(contratos.length + 1).padStart(3, "0"),
    cliente_id: cliente?.id || null,
    imovel_id: imovel.id,
    status: imovel.status === "alugado" ? "ativo" : "encerrado",
    data_inicio: parseData(linha[10]),
    data_fim: parseData(linha[11]),
    valor: parseDinheiro(linha[18]),
    dia_pagamento: parseDia(linha[12]),
    informacao: limpar(linha[13]) || null,
    recebe_na_conta: recebe || null,
    valorTexto: limpar(linha[18]),
  })
}

const recebimentos = []
let valoresAltos = 0

for (const linha of depoisDoCabecalho(alugueis, "NOME IMÓVEL")) {
  const titulo = limpar(linha[7])
  const imovel = titulo ? imoveis.get(chave(titulo)) : null
  const contrato = contratos.find((item) => item.imovel_id === imovel?.id)

  if (!imovel || !contrato) {
    continue
  }

  linha.slice(8, 20).forEach((celula, indice) => {
    const mes = classificarMes(celula)

    if (!mes) {
      return
    }

    if (mes.valor !== null && mes.valor >= 10000) {
      valoresAltos += 1
    }

    const data = vencimento(
      anoCompetencia,
      indice + 1,
      contrato.dia_pagamento
    )

    recebimentos.push({
      id: randomUUID(),
      cliente_id: contrato.cliente_id,
      contrato_id: contrato.id,
      numero_contrato: contrato.numero,
      descricao: meses[indice],
      valor: mes.valor,
      data_vencimento: data,
      data_pagamento: mes.status === "Recebido" ? data : null,
      status: mes.status,
      observacoes: mes.observacoes,
    })
  })
}

const despesasSql = []

for (const linha of depoisDoCabecalho(despesas, "NOME IMOVEL")) {
  const titulo = limpar(linha[1])
  const data = parseData(linha[0])
  const valor = parseDinheiro(linha[2])

  if (!titulo || !data || valor === null) {
    continue
  }

  const imovel = obterImovel({
    titulo,
    status: "disponivel",
  })

  despesasSql.push({
    id: randomUUID(),
    imovel_id: imovel.id,
    descricao: limpar(linha[3]) || "Manutenção",
    valor,
    data_despesa: data,
  })
}

const comandos = [
  "begin;",
  `do $$
begin
  if exists (select 1 from public.clientes limit 1) then
    raise exception 'A tabela clientes já tem dados. O seed só roda em banco vazio.';
  end if;
end $$;`,
]

for (const item of proprietarios.values()) {
  comandos.push(
    `insert into public.proprietarios (id, nome, pix_chave) values (${sqlTexto(item.id)}, ${sqlTexto(item.nome)}, ${sqlTexto(item.pix_chave)});`
  )
}

for (const item of clientes.values()) {
  comandos.push(
    `insert into public.clientes (id, nome, telefone) values (${sqlTexto(item.id)}, ${sqlTexto(item.nome)}, ${sqlTexto(item.telefone)});`
  )
}

for (const item of imoveis.values()) {
  comandos.push(
    `insert into public.imoveis (
      id, titulo, tipo, finalidade, status, valor, endereco, cidade, estado,
      proprietario_id, elektro_codigo, elektro_medidor, sabesp_fornecimento,
      rgi_sabesp, hidrometro_sabesp, iptu
    ) values (
      ${sqlTexto(item.id)}, ${sqlTexto(item.titulo)}, ${sqlTexto(item.tipo)}, 'Aluguel', ${sqlTexto(item.status)},
      ${sqlNumero(item.valor)}, ${sqlTexto(item.endereco)}, ${sqlTexto(item.cidade)}, ${sqlTexto(item.estado)},
      ${sqlTexto(item.proprietario_id)}, ${sqlTexto(item.elektro_codigo)}, ${sqlTexto(item.elektro_medidor)},
      ${sqlTexto(item.sabesp_fornecimento)}, ${sqlTexto(item.rgi_sabesp)}, ${sqlTexto(item.hidrometro_sabesp)},
      ${sqlTexto(item.iptu)}
    );`
  )
}

for (const item of contratos) {
  const informacao =
    item.valor === null && item.valorTexto
      ? [item.informacao, item.valorTexto].filter(Boolean).join(" | ")
      : item.informacao

  comandos.push(
    `insert into public.contratos (
      id, numero, cliente, imovel, tipo, status, data_inicio, data_fim, valor,
      dia_pagamento, informacao, recebe_na_conta
    ) values (
      ${sqlTexto(item.id)}, ${sqlTexto(item.numero)}, ${sqlTexto(item.cliente_id)}, ${sqlTexto(item.imovel_id)},
      'Aluguel', ${sqlTexto(item.status)}, ${sqlTexto(item.data_inicio)}, ${sqlTexto(item.data_fim)},
      ${sqlNumero(item.valor)}, ${sqlNumero(item.dia_pagamento)}, ${sqlTexto(informacao)},
      ${sqlTexto(item.recebe_na_conta)}
    );`
  )
}

for (const item of recebimentos) {
  comandos.push(
    `insert into public.recebimentos (
      id, cliente_id, contrato_id, tipo_recebimento, numero_contrato, descricao,
      valor, data_vencimento, data_pagamento, status, observacoes
    ) values (
      ${sqlTexto(item.id)}, ${sqlTexto(item.cliente_id)}, ${sqlTexto(item.contrato_id)},
      'Aluguel mensal', ${sqlTexto(item.numero_contrato)}, ${sqlTexto(item.descricao)},
      ${sqlNumero(item.valor)}, ${sqlTexto(item.data_vencimento)}, ${sqlTexto(item.data_pagamento)},
      ${sqlTexto(item.status)}, ${sqlTexto(item.observacoes)}
    );`
  )
}

for (const item of despesasSql) {
  comandos.push(
    `insert into public.despesas (
      id, imovel_id, categoria, descricao, valor, data_despesa, status
    ) values (
      ${sqlTexto(item.id)}, ${sqlTexto(item.imovel_id)}, 'Manutenção', ${sqlTexto(item.descricao)},
      ${sqlNumero(item.valor)}, ${sqlTexto(item.data_despesa)}, 'Pago'
    );`
  )
}

comandos.push("commit;")

const destino = join(raiz, "supabase", ".seed.local.sql")
writeFileSync(destino, `${comandos.join("\n")}\n`, "utf8")

console.log(
  JSON.stringify({
    proprietarios: proprietarios.size,
    clientes: clientes.size,
    imoveis: imoveis.size,
    contratos: contratos.length,
    recebimentos: recebimentos.length,
    despesas: despesasSql.length,
    recebimentosComValorAlto: valoresAltos,
    arquivo: "supabase/.seed.local.sql",
  })
)
