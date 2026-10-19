const test = require("node:test")
const assert = require("node:assert/strict")
const {
  MENSAGEM_LOGIN_GENERICA,
  credenciaisLogin,
  origemDoPedidoEhValida,
} = require("../lib/login")

test("rejeita nome ou senha vazios sem distinguir o campo", () => {
  assert.deepEqual(credenciaisLogin("", "abc"), { ok: false })
  assert.deepEqual(credenciaisLogin("Admin", ""), { ok: false })
  assert.deepEqual(credenciaisLogin("  ", "abc"), { ok: false })
})

test("normaliza o nome e limita o tamanho das credenciais", () => {
  assert.deepEqual(credenciaisLogin("  Ana  ", "senha-ok"), {
    ok: true,
    nome: "Ana",
    senha: "senha-ok",
  })
  assert.equal(credenciaisLogin("a".repeat(121), "senha-ok").ok, false)
  assert.equal(credenciaisLogin("Ana", "s".repeat(257)).ok, false)
})

test("mantém uma mensagem única de falha de login", () => {
  assert.equal(MENSAGEM_LOGIN_GENERICA, "Nome ou senha inválidos.")
})

test("aceita apenas Origin da mesma origem", () => {
  const valida = origemDoPedidoEhValida({
    headers: {
      get(nome) {
        if (nome === "origin") return "https://imobgest-sand.vercel.app"
        if (nome === "host") return "imobgest-sand.vercel.app"
        return null
      },
    },
  })
  const cruzada = origemDoPedidoEhValida({
    headers: {
      get(nome) {
        if (nome === "origin") return "https://evil.example"
        if (nome === "host") return "imobgest-sand.vercel.app"
        return null
      },
    },
  })
  const semOrigin = origemDoPedidoEhValida({
    headers: {
      get() {
        return null
      },
    },
  })

  assert.equal(valida, true)
  assert.equal(cruzada, false)
  assert.equal(semOrigin, false)
})
