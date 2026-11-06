"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import {
  formatarCpf,
  formatarTelefone,
  mascararCpf,
  mascararTelefone,
  primeiroNome,
  somenteDigitos,
} from "../../lib/formatacao"
import {
  obterCamposObrigatoriosPendentes,
  mensagemCamposObrigatorios,
} from "../../lib/validacao"

function prepararValorMascarado(valor, mascara, caracteresAceitos) {
  const texto = String(valor || "")
  return caracteresAceitos.test(texto) ? mascara(texto) : texto
}

function normalizarValorMascarado(valor, original) {
  const texto = String(valor ?? "")
  const textoOriginal = String(original ?? "")

  if (texto === textoOriginal) {
    return textoOriginal
  }

  return /^[\d\s()+.-]*$/.test(texto)
    ? somenteDigitos(texto)
    : texto.trim()
}
export default function Clientes() {
  const [clientes, setClientes] = useState([])

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [busca, setBusca] = useState("")
  const [modalAberto, setModalAberto] = useState(false)
  const [visualizando, setVisualizando] = useState(null)
  const [editando, setEditando] = useState(null)
  const [camposInvalidos, setCamposInvalidos] = useState([])

  const hoje = new Date()

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    rg: "",
    telefone: "",
    telefone_secundario: "",
    conjuge: "",
    email: "",
  })

  async function carregarClientes() {
    setLoading(true)
    setErro("")

    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome", { ascending: true })

      if (error) {
        throw error
      }

      setClientes(data || [])
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)

      setErro(
        error?.message ||
          "Não foi possível carregar os clientes."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarClientes()
  }, [])

  function limparMensagens() {
    setErro("")
    setSucesso("")
  }

  function abrirNovoCliente() {
    limparMensagens()

    setEditando(null)

    setForm({
      nome: "",
      cpf: "",
      rg: "",
      telefone: "",
      telefone_secundario: "",
      conjuge: "",
      email: "",
    })
    setCamposInvalidos([])

    setModalAberto(true)
  }

  function abrirEditarCliente(cliente) {
    limparMensagens()

    setEditando(cliente)

    setForm({
      nome: cliente.nome || "",
      cpf: prepararValorMascarado(
        cliente.cpf,
        mascararCpf,
        /^[\d\s.-]*$/
      ),
      rg: cliente.rg || "",
      telefone: prepararValorMascarado(
        cliente.telefone,
        mascararTelefone,
        /^[\d\s()+.-]*$/
      ),
      telefone_secundario: prepararValorMascarado(
        cliente.telefone_secundario,
        mascararTelefone,
        /^[\d\s()+.-]*$/
      ),
      conjuge: cliente.conjuge || "",
      email: cliente.email || "",
    })

    setCamposInvalidos([])
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) return

    setModalAberto(false)
    setEditando(null)
    setCamposInvalidos([])
  }

  function alterarCampo(campo, valor) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }))
    setCamposInvalidos((anteriores) =>
      anteriores.filter((id) => id !== campo)
    )
    setErro("")
  }

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) {
      return clientes
    }

    return clientes.filter((cliente) => {
      const nome = String(
        cliente.nome || ""
      ).toLowerCase()

      const cpf = String(
        cliente.cpf || ""
      ).toLowerCase()

      const telefone = String(
        cliente.telefone || ""
      ).toLowerCase()

      const email = String(
        cliente.email || ""
      ).toLowerCase()

      const conjuge = String(
        cliente.conjuge || ""
      ).toLowerCase()

      const telefoneSecundario = String(
        cliente.telefone_secundario || ""
      ).toLowerCase()

      return (
        nome.includes(termo) ||
        cpf.includes(termo) ||
        telefone.includes(termo) ||
        telefoneSecundario.includes(termo) ||
        conjuge.includes(termo) ||
        email.includes(termo)
      )
    })
  }, [clientes, busca])

  async function salvarCliente(e) {
    e.preventDefault()

    limparMensagens()

    const camposPendentes = obterCamposObrigatoriosPendentes(
      e.currentTarget
    )
    setCamposInvalidos(camposPendentes.map((campo) => campo.id))

    if (camposPendentes.length > 0) {
      setErro(mensagemCamposObrigatorios(camposPendentes))
      return
    }

    setSalvando(true)

    try {
      const dados = {
        nome: form.nome.trim(),
        cpf: normalizarValorMascarado(form.cpf, editando?.cpf),
        rg: form.rg.trim(),
        telefone: normalizarValorMascarado(
          form.telefone,
          editando?.telefone
        ),
        telefone_secundario: normalizarValorMascarado(
          form.telefone_secundario,
          editando?.telefone_secundario
        ),
        conjuge: form.conjuge.trim(),
        email: form.email.trim(),
      }

      if (editando?.id) {
        const { error } = await supabase
          .from("clientes")
          .update(dados)
          .eq("id", editando.id)

        if (error) {
          throw error
        }

        setSucesso(
          "Cliente atualizado com sucesso."
        )
      } else {
        const { error } = await supabase
          .from("clientes")
          .insert([dados])

        if (error) {
          throw error
        }

        setSucesso(
          "Cliente cadastrado com sucesso."
        )
      }

      await carregarClientes()

      setModalAberto(false)
      setEditando(null)

      setForm({
        nome: "",
        cpf: "",
        rg: "",
        telefone: "",
        telefone_secundario: "",
        conjuge: "",
        email: "",
      })
    } catch (error) {
      console.error(
        "Erro ao salvar cliente:",
        error
      )

      setErro(
        error?.message ||
          "Não foi possível salvar o cliente."
      )
    } finally {
      setSalvando(false)
    }
  }

  async function excluirCliente(cliente) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o cliente "${cliente.nome}"?`
    )

    if (!confirmar) {
      return
    }

    limparMensagens()

    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", cliente.id)

      if (error) {
        throw error
      }

      setSucesso(
        "Cliente excluído com sucesso."
      )

      await carregarClientes()
    } catch (error) {
      console.error(
        "Erro ao excluir cliente:",
        error
      )

      setErro(
        error?.message ||
          "Não foi possível excluir o cliente."
      )
    }
  }

  function fecharMensagemSucesso() {
    setSucesso("")
  }

  return (
    <div className="container-fluid py-4">

      

      {/* CABEÇALHO */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">

        <div className="page-heading page-heading--clientes">
          <h2 className="fw-bold mb-1">
            Clientes
          </h2>
          <p className="text-muted mb-0">
            Gerencie os clientes cadastrados no sistema.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={carregarClientes}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
            Atualizar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={abrirNovoCliente}
          >
            <i className="bi bi-plus-lg" aria-hidden="true"></i>
            Novo cliente
          </button>
        </div>

      </div>

      {/* MENSAGEM DE ERRO */}
      {erro && !modalAberto && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2"></i>

          {erro}

          <button
            type="button"
            className="btn-close"
            onClick={() => setErro("")}
          ></button>
        </div>
      )}

      {/* MENSAGEM DE SUCESSO */}
      {sucesso && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle me-2"></i>

          {sucesso}

          <button
            type="button"
            className="btn-close"
            onClick={fecharMensagemSucesso}
          ></button>
        </div>
      )}

      {/* RESUMO DOS CLIENTES */}
      <div className="row g-3 mb-4">

        <div className="col-12 col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">

              <div className="d-flex justify-content-between align-items-start">

                <div>
                  <p className="text-muted mb-1">
                    Total de clientes
                  </p>

                  <h3 className="fw-bold mb-0">
                    {clientes.length}
                  </h3>
                </div>

                <div
                  className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                  }}
                >
                  <i className="bi bi-people text-primary fs-4"></i>
                </div>

              </div>

            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">

              <div className="d-flex justify-content-between align-items-start">

                <div>
                  <p className="text-muted mb-1">
                    Resultados
                  </p>

                  <h3 className="fw-bold mb-0">
                    {clientesFiltrados.length}
                  </h3>
                </div>

                <div
                  className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                  }}
                >
                  <i className="bi bi-search text-info fs-4"></i>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>

{/* LISTA DE CLIENTES */}
      <div className="card shadow-sm border-0">

        <div className="card-body">

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

            <div>
              <h5 className="fw-bold mb-1">
                Clientes cadastrados
              </h5>
            </div>

          </div>

          {/* FILTRO */}
          <div className="card border-0 bg-light mb-4">
            <div className="card-body">

              <div className="row g-3 align-items-end">

                <div className="col-12">

                  <label
                    htmlFor="buscaCliente"
                    className="form-label fw-semibold"
                  >
                    Pesquisar cliente
                  </label>

                  <div className="input-group">

                    <span className="input-group-text bg-white">
                      <i className="bi bi-search"></i>
                    </span>

                    <input
                      id="buscaCliente"
                      type="text"
                      className="form-control"
                      placeholder="Nome, telefone ou cônjuge"
                      value={busca}
                      onChange={(e) =>
                        setBusca(e.target.value)
                      }
                    />

                    {busca && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setBusca("")}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}

                  </div>

                </div>

              </div>

            </div>
          </div>

          {/* TABELA */}
          {loading ? (
            <div className="text-center py-5">

              <div
                className="spinner-border text-primary"
                role="status"
              >
                <span className="visually-hidden">
                  Carregando...
                </span>
              </div>

              <p className="text-muted mt-3 mb-0">
                Carregando clientes...
              </p>

            </div>
          ) : clientesFiltrados.length === 0 ? (

            <div className="text-center py-5">

              <div
                className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "72px",
                  height: "72px",
                }}
              >
                <i className="bi bi-people text-muted fs-2"></i>
              </div>

              <h5 className="fw-bold">
                Nenhum cliente encontrado
              </h5>

              <p className="text-muted mb-0">
                {busca
                  ? "Não encontramos clientes para a pesquisa informada."
                  : "Ainda não existem clientes cadastrados."}
              </p>

            </div>

          ) : (

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0">

                <thead className="table-light">

                  <tr>

                    <th>
                      Cliente
                    </th>

                    <th>
                      Telefone principal
                    </th>

                    <th>
                      Cônjuge
                    </th>

                    <th>
                      Telefone secundário
                    </th>

                    <th className="text-end">
                      Ações
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {clientesFiltrados.map((cliente) => (

                    <tr key={cliente.id}>

                      <td>

                        <div className="d-flex align-items-center">

                          <div
                            className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{
                              width: "42px",
                              height: "42px",
                              minWidth: "42px",
                            }}
                          >
                            <i className="bi bi-person text-primary"></i>
                          </div>

                          <div>
                            <div className="fw-semibold">
                              {cliente.nome || "-"}
                            </div>
                          </div>

                        </div>

                      </td>

                      <td>
                        {formatarTelefone(
                          cliente.telefone
                        )}
                      </td>

                      <td>
                        {primeiroNome(cliente.conjuge)}
                      </td>

                      <td>
                        {formatarTelefone(
                          cliente.telefone_secundario
                        )}
                      </td>

                      <td>

                        <div className="d-flex justify-content-end gap-2">

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            title="Ver cliente"
                            onClick={() =>
                              setVisualizando(cliente)
                            }
                          >
                            <i className="bi bi-eye" aria-hidden="true"></i>
                            Ver
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            title="Editar cliente"
                            onClick={() =>
                              abrirEditarCliente(cliente)
                            }
                          >
                            <i className="bi bi-pencil"></i>
                          Editar
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            title="Excluir cliente"
                            onClick={() =>
                              excluirCliente(cliente)
                            }
                          >
                            <i className="bi bi-trash"></i>
                          Excluir
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {visualizando && (
        <div
          className="modal fade show d-block app-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-detalhe-cliente"
          tabIndex={-1}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h2
                    id="titulo-detalhe-cliente"
                    className="h5 modal-title fw-bold mb-1"
                  >
                    {visualizando.nome || "Cliente"}
                  </h2>
                  <p className="text-muted small mb-0">
                    Dados cadastrados do cliente
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={() => setVisualizando(null)}
                />
              </div>

              <div className="modal-body">
                <div className="detalhe-grade">
                  <div>
                    <span>Nome completo</span>
                    <strong>{visualizando.nome || "—"}</strong>
                  </div>
                  <div>
                    <span>CPF</span>
                    <strong>{formatarCpf(visualizando.cpf)}</strong>
                  </div>
                  <div>
                    <span>RG</span>
                    <strong>{visualizando.rg || "—"}</strong>
                  </div>
                  <div>
                    <span>E-mail</span>
                    <strong>{visualizando.email || "—"}</strong>
                  </div>
                  <div>
                    <span>Telefone principal</span>
                    <strong>{formatarTelefone(visualizando.telefone)}</strong>
                  </div>
                  <div>
                    <span>Telefone secundário</span>
                    <strong>{formatarTelefone(visualizando.telefone_secundario)}</strong>
                  </div>
                  <div>
                    <span>Cônjuge</span>
                    <strong>{visualizando.conjuge || "—"}</strong>
                  </div>
                  {visualizando.documento && (
                    <div>
                      <span>Documento</span>
                      <strong>{visualizando.documento}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setVisualizando(null)}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const cliente = visualizando
                    setVisualizando(null)
                    abrirEditarCliente(cliente)
                  }}
                >
                  <i className="bi bi-pencil" aria-hidden="true"></i>
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* MODAL - NOVO / EDITAR CLIENTE */}
      {modalAberto && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            role="document"
          >
            <div className="modal-content border-0 shadow">

              {/* CABEÇALHO DO MODAL */}
              <div className="modal-header">

                <div>
                  <h5 className="modal-title fw-bold mb-1">
                    {editando
                      ? "Editar cliente"
                      : "Novo cliente"}
                  </h5>

                  <p className="text-muted mb-0 small">
                    {editando
                      ? "Atualize os dados do cliente."
                      : "Preencha os dados para cadastrar um novo cliente."}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={fecharModal}
                  disabled={salvando}
                ></button>

              </div>

              {/* FORMULÁRIO */}
              <form onSubmit={salvarCliente} noValidate>

                <div className="modal-body">

                  {erro && (
                    <div className="alert alert-danger" role="alert" aria-live="assertive">
                      {erro}
                    </div>
                  )}

                  <div className="row g-3">

                    {/* NOME */}
                    <div className="col-12">

                      <label
                        htmlFor="nome"
                        className="form-label fw-semibold"
                      >
                        Nome completo <span className="text-danger" aria-hidden="true">*</span>
                      </label>

                      <input
                        id="nome"
                        type="text"
                        className={`form-control ${camposInvalidos.includes("nome") ? "is-invalid" : ""}`}
                        value={form.nome}
                        onChange={(e) =>
                          alterarCampo(
                            "nome",
                            e.target.value
                          )
                        }
                        placeholder="Digite o nome completo"
                        required
                      />
                      {camposInvalidos.includes("nome") && (
                        <div className="invalid-feedback d-block">
                          Informe o nome completo.
                        </div>
                      )}

                    </div>

                    {/* CPF */}
                    <div className="col-12 col-md-6">

                      <label
                        htmlFor="cpf"
                        className="form-label fw-semibold"
                      >
                        CPF
                      </label>

                      <input
                        id="cpf"
                        type="text"
                        className="form-control"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={14}
                        value={form.cpf}
                        onChange={(e) =>
                          alterarCampo(
                            "cpf",
                            mascararCpf(e.target.value)
                          )
                        }
                        placeholder="Digite o CPF"
                      />

                    </div>

                    {/* RG */}
                    <div className="col-12 col-md-6">

                      <label
                        htmlFor="rg"
                        className="form-label fw-semibold"
                      >
                        RG
                      </label>

                      <input
                        id="rg"
                        type="text"
                        className="form-control"
                        value={form.rg}
                        onChange={(e) =>
                          alterarCampo(
                            "rg",
                            e.target.value
                          )
                        }
                        placeholder="Digite o RG"
                      />

                    </div>

                    {/* CÔNJUGE */}
                    <div className="col-12 col-md-6">

                      <label
                        htmlFor="conjuge"
                        className="form-label fw-semibold"
                      >
                        Cônjuge
                      </label>

                      <input
                        id="conjuge"
                        type="text"
                        className="form-control"
                        value={form.conjuge}
                        onChange={(e) =>
                          alterarCampo(
                            "conjuge",
                            e.target.value
                          )
                        }
                        placeholder="Nome do cônjuge"
                        maxLength={120}
                      />

                    </div>

                    {/* TELEFONE */}
                    <div className="col-12 col-md-6">

                      <label
                        htmlFor="telefone"
                        className="form-label fw-semibold"
                      >
                        Telefone principal <span className="text-danger" aria-hidden="true">*</span>
                      </label>

                      <input
                        id="telefone"
                        type="tel"
                        className={`form-control ${camposInvalidos.includes("telefone") ? "is-invalid" : ""}`}
                        inputMode="tel"
                        autoComplete="tel-national"
                        maxLength={15}
                        value={form.telefone}
                        onChange={(e) =>
                          alterarCampo(
                            "telefone",
                            mascararTelefone(e.target.value)
                          )
                        }
                        placeholder="Digite o telefone"
                        required
                      />
                      {camposInvalidos.includes("telefone") && (
                        <div className="invalid-feedback d-block">
                          Informe o telefone.
                        </div>
                      )}

                    </div>

                    {/* TELEFONE SECUNDÁRIO */}
                    <div className="col-12 col-md-6">

                      <label
                        htmlFor="telefone_secundario"
                        className="form-label fw-semibold"
                      >
                        Telefone secundário
                      </label>

                      <input
                        id="telefone_secundario"
                        type="tel"
                        className="form-control"
                        inputMode="tel"
                        autoComplete="off"
                        maxLength={15}
                        value={form.telefone_secundario}
                        onChange={(e) =>
                          alterarCampo(
                            "telefone_secundario",
                            mascararTelefone(e.target.value)
                          )
                        }
                        placeholder="Telefone do cônjuge ou outro contato"
                      />

                    </div>

                    {/* E-MAIL */}
                    <div className="col-12 col-md-6">

                      <label
                        htmlFor="email"
                        className="form-label fw-semibold"
                      >
                        E-mail
                      </label>

                      <input
                        id="email"
                        type="email"
                        className={`form-control ${camposInvalidos.includes("email") ? "is-invalid" : ""}`}
                        value={form.email}
                        onChange={(e) =>
                          alterarCampo(
                            "email",
                            e.target.value
                          )
                        }
                        placeholder="Digite o e-mail"
                      />
                      {camposInvalidos.includes("email") && (
                        <div className="invalid-feedback d-block">
                          Informe um e-mail válido.
                        </div>
                      )}

                    </div>

                  </div>

                </div>

                {/* RODAPÉ DO MODAL */}
                <div className="modal-footer">

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={fecharModal}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={salvando}
                  >

                    {salvando ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>

                        Salvando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>

                        {editando
                          ? "Salvar alterações"
                          : "Cadastrar cliente"}
                      </>
                    )}

                  </button>

                </div>

              </form>

            </div>
          </div>
                </div>
      )}

      {/* RODAPÉ */}
      <div className="text-center text-muted py-3">

        <small>
          ImobGest
        </small>

        <br />

        <small>
          Dashboard atualizado em{" "}
          {hoje.toLocaleDateString("pt-BR")}
        </small>

      </div>

    </div>
  )
}

