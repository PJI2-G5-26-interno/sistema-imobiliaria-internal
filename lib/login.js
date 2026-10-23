const MENSAGEM_LOGIN_GENERICA = "Nome ou senha inválidos."

function credenciaisLogin(nome, senha) {
  const nomeInformado = typeof nome === "string" ? nome.trim() : ""
  const senhaInformada = typeof senha === "string" ? senha : ""

  if (!nomeInformado || !senhaInformada) {
    return { ok: false }
  }

  if (nomeInformado.length > 120 || senhaInformada.length > 256) {
    return { ok: false }
  }

  return {
    ok: true,
    nome: nomeInformado,
    senha: senhaInformada,
  }
}

function origemDoPedidoEhValida(request) {
  const origin = request.headers.get("origin")

  if (!origin) {
    return false
  }

  try {
    return new URL(origin).host === request.headers.get("host")
  } catch {
    return false
  }
}

module.exports = {
  MENSAGEM_LOGIN_GENERICA,
  credenciaisLogin,
  origemDoPedidoEhValida,
}
