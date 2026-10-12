"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import {
  obterCamposObrigatoriosPendentes,
  mensagemCamposObrigatorios,
} from "../../lib/validacao"
export default function Contratos() {
  // ========================================
  // DADOS
  // ========================================

  const [contratos, setContratos] = useState([])
  const [clientes, setClientes] = useState([])
  const [imoveis, setImoveis] = useState([])

  // ========================================
  // CONTROLE
  // ========================================

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  // ========================================
  // BUSCA E FILTROS
  // ========================================

  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("todos")

  // ========================================
  // MODAL
  // ========================================

  const [modalAberto, setModalAberto] = useState(false)

  const [modoEdicao, setModoEdicao] = useState(false)

  const [contratoSelecionado, setContratoSelecionado] =
    useState(null)
  const [contratoVisualizando, setContratoVisualizando] =
    useState(null)
  const [camposInvalidos, setCamposInvalidos] = useState([])

  // ========================================
  // FORMULÁRIO
  // ========================================

  const formularioInicial = {
    cliente: "",
    imovel: "",
    tipo: "",
    status: "ativo",
    data_inicio: "",
    data_fim: "",
    valor: "",
  }

  const [formulario, setFormulario] =
    useState(formularioInicial)

  // ========================================
  // CARREGAR DADOS
  // ========================================

  async function carregarDados() {
    try {
      setLoading(true)
      setErro("")

      const [
        contratosResult,
        clientesResult,
        imoveisResult,
      ] = await Promise.all([
        supabase
          .from("contratos")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("clientes")
          .select("*")
          .order("nome", {
            ascending: true,
          }),

        supabase
          .from("imoveis")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),
      ])

      if (contratosResult.error) {
        throw contratosResult.error
      }

      if (clientesResult.error) {
        throw clientesResult.error
      }

      if (imoveisResult.error) {
        throw imoveisResult.error
      }

      setContratos(
        contratosResult.data || []
      )

      setClientes(
        clientesResult.data || []
      )

      setImoveis(
        imoveisResult.data || []
      )
    } catch (error) {
      console.error(
        "Erro ao carregar contratos:",
        error
      )

      setErro(
        error?.message ||
          "Não foi possível carregar os contratos."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // ========================================
  // MENSAGENS
  // ========================================

  function limparMensagens() {
    setErro("")
    setSucesso("")
  }

  // ========================================
  // FORMATAÇÃO
  // ========================================

  function formatarMoeda(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return "R$ 0,00"
    }

    return Number(valor).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    )
  }

  function formatarData(data) {
    if (!data) {
      return "-"
    }

    const partes = String(data).split("-")

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }

    return data
  }

  // ========================================
  // NOMES RELACIONADOS
  // ========================================

  function obterNomeCliente(clienteId) {
    const cliente = clientes.find(
      (item) =>
        String(item.id) === String(clienteId)
    )

    return (
      cliente?.nome ||
      "Cliente não encontrado"
    )
  }

  function obterNomeImovel(imovelId) {
    const imovel = imoveis.find(
      (item) =>
        String(item.id) === String(imovelId)
    )

    return (
      imovel?.titulo ||
      imovel?.nome ||
      "Imóvel não encontrado"
    )
  }

  // ========================================
  // ALTERAR FORMULÁRIO
  // ========================================

  function alterarFormulario(
    campo,
    valor
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }))
    setCamposInvalidos((anteriores) =>
      anteriores.filter((id) => id !== campo)
    )
    setErro("")
  }

  // ========================================
  // ABRIR NOVO CONTRATO
  // ========================================

  function abrirNovoContrato() {
    limparMensagens()

    setModoEdicao(false)

    setContratoSelecionado(null)

    setFormulario(
      formularioInicial
    )
    setCamposInvalidos([])

    setModalAberto(true)
  }

  // ========================================
  // ABRIR EDIÇÃO
  // ========================================

  function abrirEdicao(contrato) {
    limparMensagens()

    setModoEdicao(true)

    setContratoSelecionado(
      contrato
    )

    setFormulario({
      cliente:
        contrato.cliente || "",

      imovel:
        contrato.imovel || "",

      tipo:
        contrato.tipo || "Aluguel",

      status:
        contrato.status || "ativo",

      data_inicio:
        contrato.data_inicio || "",

      data_fim:
        contrato.data_fim || "",

      valor:
        contrato.valor ?? "",
    })

    setCamposInvalidos([])
    setModalAberto(true)
  }

  // ========================================
  // FECHAR MODAL
  // ========================================

  function fecharModal() {
    if (salvando) {
      return
    }

    setModalAberto(false)

    setModoEdicao(false)

    setContratoSelecionado(null)
    setCamposInvalidos([])

    setFormulario(
      formularioInicial
    )
  }

  // ========================================
  // SALVAR CONTRATO
  // ========================================

  async function salvarContrato(event) {
    event.preventDefault()

    try {
      limparMensagens()

      const camposPendentes = obterCamposObrigatoriosPendentes(
        event.currentTarget
      )
      setCamposInvalidos(camposPendentes.map((campo) => campo.id))

      if (camposPendentes.length > 0) {
        setErro(mensagemCamposObrigatorios(camposPendentes))
        return
      }

      if (
        formulario.data_fim &&
        formulario.data_fim < formulario.data_inicio
      ) {
        setCamposInvalidos(["data_fim"])
        setErro("A data de fim não pode ser anterior à data de início.")
        return
      }

      const imovelSelecionado = imoveis.find(
        (imovel) => String(imovel.id) === String(formulario.imovel)
      )
      const mesmoContratoAtivo =
        modoEdicao &&
        contratoSelecionado?.status === "ativo" &&
        String(
          contratoSelecionado.imovel_id ?? contratoSelecionado.imovel
        ) === String(formulario.imovel)

      if (
        formulario.status === "ativo" &&
        imovelSelecionado?.em_manutencao &&
        !mesmoContratoAtivo
      ) {
        setErro("Não é possível cadastrar contrato ativo para imóvel em manutenção.")
        return
      }

      const inicioNovo = formulario.data_inicio || "0000-01-01"
      const fimNovo = formulario.data_fim || "9999-12-31"
      const conflito = contratos.some((contrato) => {
        const imovelId = contrato.imovel_id ?? contrato.imovel
        const inicioExistente = contrato.data_inicio || "0000-01-01"
        const fimExistente = contrato.data_fim || "9999-12-31"

        return (
          contrato.status === "ativo" &&
          String(contrato.id) !== String(contratoSelecionado?.id || "") &&
          String(imovelId) === String(formulario.imovel) &&
          inicioExistente <= fimNovo &&
          inicioNovo <= fimExistente
        )
      })

      if (formulario.status === "ativo" && conflito) {
        setErro("Já existe um contrato ativo para esse imóvel no período informado.")
        return
      }

      setSalvando(true)

      const dados = {
        cliente: formulario.cliente,
        imovel: formulario.imovel,
        tipo: formulario.tipo,
        status: formulario.status,
        data_inicio:
          formulario.data_inicio,
        data_fim:
          formulario.data_fim || null,
        valor:
          Number(formulario.valor),
      }

      let resultado

      if (
        modoEdicao &&
        contratoSelecionado
      ) {
        resultado = await supabase
          .from("contratos")
          .update(dados)
          .eq(
            "id",
            contratoSelecionado.id
          )
      } else {
        resultado = await supabase
          .from("contratos")
          .insert([dados])
      }

      if (resultado.error) {
        throw resultado.error
      }

      setSucesso(
        modoEdicao
          ? "Contrato atualizado com sucesso."
          : "Contrato cadastrado com sucesso."
      )

      fecharModal()

      await carregarDados()
    } catch (error) {
      console.error(
        "Erro ao salvar contrato:",
        error
      )

      setErro(
        error?.message ||
          "Não foi possível salvar o contrato."
      )
    } finally {
      setSalvando(false)
    }
  }
  // ========================================
  // EXCLUIR CONTRATO
  // ========================================

  async function excluirContrato(contrato) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o contrato ${contrato.numero || ""}?`
    )

    if (!confirmar) {
      return
    }

    try {
      limparMensagens()

      const { error } = await supabase
        .from("contratos")
        .delete()
        .eq("id", contrato.id)

      if (error) {
        throw error
      }

      setSucesso(
        "Contrato excluído com sucesso."
      )

      await carregarDados()
    } catch (error) {
      console.error(
        "Erro ao excluir contrato:",
        error
      )

      setErro(
        error?.message ||
          "Não foi possível excluir o contrato."
      )
    }
  }

  // ========================================
  // STATUS
  // ========================================

  function obterTextoStatus(status) {
    switch (status) {
      case "ativo":
        return "Ativo"

      case "encerrado":
        return "Encerrado"

      case "vencido":
        return "Vencido"

      case "cancelado":
        return "Cancelado"

      default:
        return status || "-"
    }
  }

  function obterClasseStatus(status) {
    switch (status) {
      case "ativo":
        return "bg-success"

      case "encerrado":
        return "bg-secondary"

      case "vencido":
        return "bg-warning text-dark"

      case "cancelado":
        return "bg-danger"

      default:
        return "bg-secondary"
    }
  }

  // ========================================
  // VERIFICAR VENCIMENTO
  // ========================================

  function contratoEstaVencendo(contrato) {
    if (!contrato.data_fim) {
      return false
    }

    if (
      contrato.status !== "ativo"
    ) {
      return false
    }

    const hoje = new Date()

    hoje.setHours(
      0,
      0,
      0,
      0
    )

    const fim = new Date(
      `${contrato.data_fim}T00:00:00`
    )

    const diferenca =
      fim.getTime() -
      hoje.getTime()

    const dias =
      diferenca /
      (1000 * 60 * 60 * 24)

    return (
      dias >= 0 &&
      dias <= 30
    )
  }

  // ========================================
  // INDICADORES
  // ========================================

  const totalContratos =
    contratos.length

  const contratosAtivos =
    contratos.filter(
      (contrato) =>
        contrato.status === "ativo"
    ).length

  const contratosEncerrados =
    contratos.filter(
      (contrato) =>
        contrato.status === "encerrado"
    ).length

  const contratosVencendo =
    contratos.filter(
      (contrato) =>
        contratoEstaVencendo(
          contrato
        )
    ).length

  // ========================================
  // FILTRAGEM
  // ========================================

  const contratosFiltrados =
    useMemo(() => {
      const texto =
        busca
          .trim()
          .toLowerCase()

      return contratos.filter(
        (contrato) => {
          const nomeCliente =
            obterNomeCliente(
              contrato.cliente
            )

          const nomeImovel =
            obterNomeImovel(
              contrato.imovel
            )

          const correspondeBusca =
            !texto ||
            String(
              contrato.numero || ""
            )
              .toLowerCase()
              .includes(texto) ||
            String(
              nomeCliente || ""
            )
              .toLowerCase()
              .includes(texto) ||
            String(
              nomeImovel || ""
            )
              .toLowerCase()
              .includes(texto)

          const correspondeStatus =
            filtroStatus === "todos" ||
            contrato.status ===
              filtroStatus

          return (
            correspondeBusca &&
            correspondeStatus
          )
        }
      )
    }, [
      contratos,
      busca,
      filtroStatus,
      clientes,
      imoveis,
    ])

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  return (
    <div className="container-fluid py-4">
          
      {/* ==================================
          CABEÇALHO
      ================================== */}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">
            Contratos
          </h1>

          <p className="text-muted mb-0">
            Gerencie os contratos da imobiliária
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={carregarDados}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>

            Atualizar
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={abrirNovoContrato}
          >
            <i className="bi bi-plus-lg me-2"></i>

            Novo contrato
          </button>
        </div>
      </div>

      {/* ==================================
          ALERTA DE ERRO
      ================================== */}

      {erro && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>

          {erro}

          <button
            type="button"
            className="btn-close"
            onClick={() => setErro("")}
            aria-label="Fechar"
          ></button>
        </div>
      )}

      {/* ==================================
          ALERTA DE SUCESSO
      ================================== */}

      {sucesso && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle-fill me-2"></i>

          {sucesso}

          <button
            type="button"
            className="btn-close"
            onClick={() => setSucesso("")}
            aria-label="Fechar"
          ></button>
        </div>
      )}

      
      {/* ==================================
          CARDS DE RESUMO
      ================================== */}

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1">
                    Total
                  </p>

                  <h3 className="fw-bold mb-0">
                    {totalContratos}
                  </h3>
                </div>

                <div className="text-primary fs-3">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1">
                    Ativos
                  </p>

                  <h3 className="fw-bold mb-0">
                    {contratosAtivos}
                  </h3>
                </div>

                <div className="text-success fs-3">
                  <i className="bi bi-check-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1">
                    Encerrados
                  </p>

                  <h3 className="fw-bold mb-0">
                    {contratosEncerrados}
                  </h3>
                </div>

                <div className="text-secondary fs-3">
                  <i className="bi bi-archive"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1">
                    Vencendo
                  </p>

                  <h3 className="fw-bold mb-0">
                    {contratosVencendo}
                  </h3>
                </div>

                <div className="text-warning fs-3">
                  <i className="bi bi-calendar-event"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ==================================
          FILTROS
      ================================== */}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h5 className="fw-bold mb-0">
              <i className="bi bi-funnel me-2"></i>
              Filtros
            </h5>

            {(busca || filtroStatus !== "todos") && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setBusca("")
                  setFiltroStatus("todos")
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Limpar filtros
              </button>
            )}
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-8">
              <label
                htmlFor="buscaContrato"
                className="form-label fw-semibold"
              >
                Buscar
              </label>

              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>

                <input
                  id="buscaContrato"
                  type="text"
                  className="form-control"
                  placeholder="Número, cliente ou imóvel..."
                  value={busca}
                  onChange={(e) =>
                    setBusca(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <label
                htmlFor="filtroStatus"
                className="form-label fw-semibold"
              >
                Status
              </label>

              <select
                id="filtroStatus"
                className="form-select"
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(e.target.value)
                }
              >
                <option value="todos">
                  Todos
                </option>

                <option value="ativo">
                  Ativos
                </option>

                <option value="encerrado">
                  Encerrados
                </option>

                <option value="vencido">
                  Vencidos
                </option>

                <option value="cancelado">
                  Cancelados
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================
          TABELA
      ================================== */}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h5 className="fw-bold mb-1">
                  Contratos cadastrados
                </h5>

                <p className="text-muted mb-0 small">
                  {contratosFiltrados.length}{" "}
                  contrato
                  {contratosFiltrados.length !== 1
                    ? "s"
                    : ""}{" "}
                  encontrado
                  {contratosFiltrados.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={abrirNovoContrato}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Novo contrato
              </button>
            </div>
          </div>

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
                Carregando contratos...
              </p>
            </div>
          ) : contratosFiltrados.length === 0 ? (
            <div className="text-center py-5 px-3">
              <div className="fs-1 text-muted mb-3">
                <i className="bi bi-file-earmark-x"></i>
              </div>

              <h5 className="fw-bold">
                Nenhum contrato encontrado
              </h5>

              <p className="text-muted mb-3">
                {busca || filtroStatus !== "todos"
                  ? "Tente alterar os filtros utilizados."
                  : "Cadastre o primeiro contrato para começar."}
              </p>

              {!busca &&
                filtroStatus === "todos" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={abrirNovoContrato}
                  >
                    <i className="bi bi-plus-lg me-2"></i>
                    Novo contrato
                  </button>
                )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">
                      Nº contrato
                    </th>

                    <th>
                      Cliente
                    </th>

                    <th>
                      Imóvel
                    </th>

                    <th>
                      Tipo
                    </th>

                    <th>
                      Período
                    </th>

                    <th>
                      Valor
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="text-end px-3">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {contratosFiltrados.map(
                    (contrato) => (
                      <tr key={contrato.id}>
                        <td className="px-3">
                          <span className="fw-semibold">
                            {contrato.numero || "-"}
                          </span>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                              style={{
                                width: "36px",
                                height: "36px",
                                minWidth: "36px",
                              }}
                            >
                              <i className="bi bi-person"></i>
                            </div>

                            <span>
                              {obterNomeCliente(
                                contrato.cliente
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-house text-primary"></i>

                            <span>
                              {obterNomeImovel(
                                contrato.imovel
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          {contrato.tipo || "-"}
                        </td>

                        <td>
                          <div className="small">
                            <div>
                              <span className="text-muted">
                                Início:
                              </span>{" "}
                              {formatarData(
                                contrato.data_inicio
                              )}
                            </div>

                            <div>
                              <span className="text-muted">
                                Fim:
                              </span>{" "}
                              {formatarData(
                                contrato.data_fim
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="fw-semibold">
                            {formatarMoeda(
                              contrato.valor
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`badge ${obterClasseStatus(
                              contrato.status
                            )}`}
                          >
                            {obterTextoStatus(
                              contrato.status
                            )}
                          </span>

                          {contratoEstaVencendo(
                            contrato
                          ) && (
                            <div className="small text-warning mt-1">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              Vence em breve
                            </div>
                          )}
                        </td>

                        <td className="text-end px-3">
                          <div className="d-flex justify-content-end gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              title="Ver contrato"
                              onClick={() => setContratoVisualizando(contrato)}
                            >
                              <i className="bi bi-eye"></i>
                              Ver
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="Editar contrato"
                              onClick={() =>
                                abrirEdicao(
                                  contrato
                                )
                              }
                            >
                              <i className="bi bi-pencil"></i>
                                Editar
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              title="Excluir contrato"
                              onClick={() =>
                                excluirContrato(
                                  contrato
                                )
                              }
                            >
                              <i className="bi bi-trash"></i>
                                Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ==================================
          MODAL DE CONTRATO
      ================================== */}

      {modalAberto && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{
            backgroundColor:
              "rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-file-earmark-text me-2"></i>

                  {modoEdicao
                    ? "Editar contrato"
                    : "Novo contrato"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={fecharModal}
                  disabled={salvando}
                  aria-label="Fechar"
                ></button>
              </div>

              <form id="form-contrato" onSubmit={salvarContrato} noValidate>
              <div className="modal-body">
                {erro && (
                  <div
                    className="alert alert-danger"
                    role="alert"
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {erro}
                  </div>
                )}

                <div className="row g-3">
                  {/* CÓDIGO */}

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="codigo-contrato"
                      className="form-label fw-semibold"
                    >
                      Código do contrato
                    </label>

                    <input
                      id="codigo-contrato"
                      type="text"
                      className="form-control bg-light"
                      value={modoEdicao ? contratoSelecionado?.numero || "" : ""}
                      placeholder="Gerado automaticamente ao salvar"
                      readOnly
                    />
                  </div>

                  {/* TIPO */}

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="tipo"
                      className="form-label fw-semibold"
                    >
                      Tipo <span className="text-danger" aria-hidden="true">*</span>
                    </label>

                    <select
                      id="tipo"
                      className={`form-select ${camposInvalidos.includes("tipo") ? "is-invalid" : ""}`}
                      required
                      value={formulario.tipo}
                      onChange={(e) =>
                        alterarFormulario(
                          "tipo",
                          e.target.value
                        )
                      }
                      disabled={salvando}
                    >
                      <option value="">
                        Selecione o tipo
                      </option>

                      <option value="Aluguel">
                        Aluguel
                      </option>

                      <option value="Venda">
                        Venda
                      </option>

                      <option value="Temporada">
                        Temporada
                      </option>
                    </select>
                    {camposInvalidos.includes("tipo") && (
                      <div className="invalid-feedback d-block">
                        Selecione o tipo de contrato.
                      </div>
                    )}
                  </div>

                  {/* CLIENTE */}

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="cliente"
                      className="form-label fw-semibold"
                    >
                      Cliente <span className="text-danger" aria-hidden="true">*</span>
                    </label>

                    <select
                      id="cliente"
                      className={`form-select ${camposInvalidos.includes("cliente") ? "is-invalid" : ""}`}
                      required
                      value={formulario.cliente}
                      onChange={(e) =>
                        alterarFormulario(
                          "cliente",
                          e.target.value
                        )
                      }
                      disabled={salvando}
                    >
                      <option value="">
                        Selecione o cliente
                      </option>

                      {clientes.map(
                        (cliente) => (
                          <option
                            key={cliente.id}
                            value={cliente.id}
                          >
                            {cliente.nome}
                          </option>
                        )
                      )}
                    </select>
                    {camposInvalidos.includes("cliente") && (
                      <div className="invalid-feedback d-block">
                        Selecione um cliente.
                      </div>
                    )}
                  </div>

                  {/* IMÓVEL */}

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="imovel"
                      className="form-label fw-semibold"
                    >
                      Imóvel <span className="text-danger" aria-hidden="true">*</span>
                    </label>

                    <select
                      id="imovel"
                      className={`form-select ${camposInvalidos.includes("imovel") ? "is-invalid" : ""}`}
                      required
                      value={formulario.imovel}
                      onChange={(e) =>
                        alterarFormulario(
                          "imovel",
                          e.target.value
                        )
                      }
                      disabled={salvando}
                    >
                      <option value="">
                        Selecione o imóvel
                      </option>

                      {imoveis.map(
                        (imovel) => (
                          <option
                            key={imovel.id}
                            value={imovel.id}
                          >
                            {imovel.titulo ||
                              imovel.nome ||
                              `Imóvel ${imovel.id}`}
                          </option>
                        )
                      )}
                    </select>
                    {camposInvalidos.includes("imovel") && (
                      <div className="invalid-feedback d-block">
                        Selecione um imóvel.
                      </div>
                    )}
                  </div>
                  {/* STATUS */}

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="status"
                      className="form-label fw-semibold"
                    >
                      Status <span className="text-danger" aria-hidden="true">*</span>
                    </label>

                    <select
                      id="status"
                      className={`form-select ${camposInvalidos.includes("status") ? "is-invalid" : ""}`}
                      required
                      value={formulario.status}
                      onChange={(e) =>
                        alterarFormulario(
                          "status",
                          e.target.value
                        )
                      }
                      disabled={salvando}
                    >
                      <option value="ativo">
                        Ativo
                      </option>

                      <option value="encerrado">
                        Encerrado
                      </option>

                      <option value="vencido">
                        Vencido
                      </option>

                      <option value="cancelado">
                        Cancelado
                      </option>
                    </select>
                  </div>

                  {/* DATA DE INÍCIO */}

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="data_inicio"
                      className="form-label fw-semibold"
                    >
                      Data de início <span className="text-danger" aria-hidden="true">*</span>
                    </label>

                    <input
                      id="data_inicio"
                      type="date"
                      className={`form-control ${camposInvalidos.includes("data_inicio") ? "is-invalid" : ""}`}
                      value={
                        formulario.data_inicio
                      }
                      onChange={(e) =>
                        alterarFormulario(
                          "data_inicio",
                          e.target.value
                        )
                      }
                      disabled={salvando}
                      required
                    />
                    {camposInvalidos.includes("data_inicio") && (
                      <div className="invalid-feedback d-block">
                        Informe a data de início.
                      </div>
                    )}
                  </div>

                  {/* DATA DE FIM */}

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="data_fim"
                      className="form-label fw-semibold"
                    >
                      Data de fim
                    </label>

                    <input
                      id="data_fim"
                      type="date"
                      className={`form-control ${camposInvalidos.includes("data_fim") ? "is-invalid" : ""}`}
                      value={
                        formulario.data_fim
                      }
                      onChange={(e) =>
                        alterarFormulario(
                          "data_fim",
                          e.target.value
                        )
                      }
                      disabled={salvando}
                      min={formulario.data_inicio || undefined}
                    />
                    {camposInvalidos.includes("data_fim") && (
                      <div className="invalid-feedback d-block">
                        A data de fim deve ser igual ou posterior à data de início.
                      </div>
                    )}

                    <div className="form-text">
                      Deixe em branco caso não tenha
                      data de encerramento definida.
                    </div>
                  </div>

                  {/* VALOR */}

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="valor"
                      className="form-label fw-semibold"
                    >
                      Valor <span className="text-danger" aria-hidden="true">*</span>
                    </label>

                    <div className="input-group">
                      <span className="input-group-text">
                        R$
                      </span>

                      <input
                        id="valor"
                        type="number"
                        step="0.01"
                        min="0.01"
                        className={`form-control ${camposInvalidos.includes("valor") ? "is-invalid" : ""}`}
                        value={
                          formulario.valor
                        }
                        onChange={(e) =>
                          alterarFormulario(
                            "valor",
                            e.target.value
                          )
                        }
                        placeholder="0,00"
                        disabled={salvando}
                        required
                      />
                    </div>
                    {camposInvalidos.includes("valor") && (
                      <div className="invalid-feedback d-block">
                        Informe um valor maior que zero.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </form>

              {/* ==================================
                  RODAPÉ DO MODAL
              ================================== */}

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
                  form="form-contrato"
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

                      {modoEdicao
                        ? "Salvar alterações"
                        : "Cadastrar contrato"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {contratoVisualizando && (
        <div
          className="modal fade show d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-detalhe-contrato"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h2 id="titulo-detalhe-contrato" className="h5 modal-title fw-bold mb-1">
                    Contrato {contratoVisualizando.numero}
                  </h2>
                  <p className="text-muted small mb-0">
                    {obterNomeCliente(contratoVisualizando.cliente)} · {obterNomeImovel(contratoVisualizando.imovel)}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar detalhes do contrato"
                  onClick={() => setContratoVisualizando(null)}
                />
              </div>
              <div className="modal-body">
                <dl className="row mb-0">
                  <dt className="col-sm-4">Código</dt>
                  <dd className="col-sm-8">{contratoVisualizando.numero}</dd>
                  <dt className="col-sm-4">Cliente</dt>
                  <dd className="col-sm-8">{obterNomeCliente(contratoVisualizando.cliente)}</dd>
                  <dt className="col-sm-4">Imóvel</dt>
                  <dd className="col-sm-8">{obterNomeImovel(contratoVisualizando.imovel)}</dd>
                  <dt className="col-sm-4">Tipo e status</dt>
                  <dd className="col-sm-8">
                    {contratoVisualizando.tipo} · {obterTextoStatus(contratoVisualizando.status)}
                  </dd>
                  <dt className="col-sm-4">Período</dt>
                  <dd className="col-sm-8">
                    {formatarData(contratoVisualizando.data_inicio)} a {formatarData(contratoVisualizando.data_fim)}
                  </dd>
                  <dt className="col-sm-4">Valor</dt>
                  <dd className="col-sm-8">{formatarMoeda(contratoVisualizando.valor)}</dd>
                </dl>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setContratoVisualizando(null)}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const contrato = contratoVisualizando
                    setContratoVisualizando(null)
                    abrirEdicao(contrato)
                  }}
                >
                  <i className="bi bi-pencil me-2" aria-hidden="true"></i>
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
