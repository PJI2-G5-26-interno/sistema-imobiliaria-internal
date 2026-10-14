"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import {
  baixarPdf,
  gerarReciboPdf,
  nomeArquivoRecibo,
} from "../../lib/recibo"
export default function Recebimentos() {
  const hoje = new Date()
  const dataHoje = hoje.toISOString().split("T")[0]

  const [recebimentos, setRecebimentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [contratos, setContratos] = useState([])
  const [imoveis, setImoveis] = useState([])

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const [mes, setMes] = useState(
    hoje.getMonth() + 1
  )

  const [ano, setAno] = useState(
    hoje.getFullYear()
  )

  const [busca, setBusca] = useState("")

  const [novoAberto, setNovoAberto] =
    useState(false)

  const [confirmacaoAberta, setConfirmacaoAberta] =
    useState(false)

  const [selecionado, setSelecionado] =
    useState(null)

  const [recebimentoEditando, setRecebimentoEditando] =
    useState(null)

  const [formaPagamento, setFormaPagamento] =
    useState("")

  const [dataPagamento, setDataPagamento] =
    useState(dataHoje)

  const [formulario, setFormulario] = useState({
    cliente_id: "",
    contrato_id: "",
    tipo_recebimento: "Aluguel mensal",
    numero_contrato: "",
    descricao: "",
    valor: "",
    data_vencimento: "",
    forma_pagamento: "Pix",
    status: "Pendente",
    observacoes: "",
  })

  const contratosDoCliente = useMemo(() => {
    if (!formulario.cliente_id) {
      return contratos
    }

    return contratos.filter(
      (contrato) =>
        String(contrato.cliente_id) ===
        String(formulario.cliente_id)
    )
  }, [contratos, formulario.cliente_id])

  async function carregarDados() {
    try {
      setLoading(true)
      setErro("")

      const [
        recebimentosResult,
        clientesResult,
        contratosResult,
        imoveisResult,
      ] = await Promise.all([
        supabase
          .from("recebimentos")
          .select("*")
          .order("data_vencimento", {
            ascending: true,
          }),

        supabase
          .from("clientes")
          .select("*")
          .order("id", {
            ascending: false,
          }),

        supabase
          .from("contratos")
          .select("*")
          .order("id", {
            ascending: false,
          }),

        supabase
          .from("imoveis")
          .select("id, informacoes_adicionais_imoveis(nome_proprietario)"),
      ])

      if (recebimentosResult.error) {
        throw recebimentosResult.error
      }

      if (clientesResult.error) {
        throw clientesResult.error
      }

      if (contratosResult.error) {
        throw contratosResult.error
      }

      if (imoveisResult.error) {
        throw imoveisResult.error
      }

      setRecebimentos(
        recebimentosResult.data || []
      )

      setClientes(
        clientesResult.data || []
      )

      setContratos(
        contratosResult.data || []
      )

      setImoveis(
        imoveisResult.data || []
      )
    } catch (error) {
      console.error(
        "Erro ao carregar dados:",
        error
      )

      setErro(
        error?.message ||
          "Não foi possível carregar os dados."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  function limparMensagens() {
    setErro("")
    setSucesso("")
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    )
  }

  function formatarData(data) {
    if (!data) return "-"

    const partes = String(data).split("-")

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }

    return data
  }

  function nomeCliente(clienteId) {
    const cliente = clientes.find(
      (item) =>
        String(item.id) ===
        String(clienteId)
    )

    return cliente?.nome || "-"
  }

  function numeroContrato(contratoId) {
    const contrato = contratos.find(
      (item) =>
        String(item.id) ===
        String(contratoId)
    )

    return contrato?.numero || "-"
  }

  function alterarFormulario(
    campo,
    valor
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }))
  }

  function formularioVazio() {
    return {
      cliente_id: "",
      contrato_id: "",
      tipo_recebimento: "Aluguel mensal",
      numero_contrato: "",
      descricao: "",
      valor: "",
      data_vencimento: "",
      forma_pagamento: "Pix",
      status: "Pendente",
      observacoes: "",
    }
  }

  const periodo = useMemo(() => {
    return recebimentos.filter(
      (item) => {
        if (!item.data_vencimento) {
          return false
        }

        const partes =
          String(
            item.data_vencimento
          ).split("-")

        if (partes.length !== 3) {
          return false
        }

        return (
          Number(partes[0]) ===
            Number(ano) &&
          Number(partes[1]) ===
            Number(mes)
        )
      }
    )
  }, [recebimentos, mes, ano])

  const filtrados = useMemo(() => {
    const termo =
      busca.trim().toLowerCase()

    if (!termo) {
      return periodo
    }

    return periodo.filter((item) => {
      const cliente =
        nomeCliente(item.cliente_id)

      const contrato =
        item.numero_contrato ||
        numeroContrato(
          item.contrato_id
        )

      const tipo =
        item.tipo_recebimento || ""

      const descricao =
        item.descricao || ""

      return (
        String(cliente)
          .toLowerCase()
          .includes(termo) ||
        String(contrato)
          .toLowerCase()
          .includes(termo) ||
        String(tipo)
          .toLowerCase()
          .includes(termo) ||
        String(descricao)
          .toLowerCase()
          .includes(termo)
      )
    })
  }, [
    periodo,
    busca,
    clientes,
    contratos,
  ])

  const recebidos = periodo.filter(
    (item) =>
      String(item.status || "")
        .toLowerCase() ===
      "recebido"
  )

  const pendentes = periodo.filter(
    (item) =>
      String(item.status || "")
        .toLowerCase() ===
      "pendente"
  )

  const valorRecebido =
    recebidos.reduce(
      (total, item) =>
        total +
        Number(item.valor || 0),
      0
    )

  const valorPendente =
    pendentes.reduce(
      (total, item) =>
        total +
        Number(item.valor || 0),
      0
    )

  function classeStatus(status) {
    const valor =
      String(status || "")
        .toLowerCase()

    if (valor === "recebido") {
      return "bg-success"
    }

    if (valor === "pendente") {
      return "bg-warning text-dark"
    }

    if (valor === "cancelado") {
      return "bg-danger"
    }

    return "bg-secondary"
  }

  function abrirNovo() {
    limparMensagens()
    setRecebimentoEditando(null)

    setFormulario(
      formularioVazio()
    )

    setNovoAberto(true)
  }

  function abrirEdicao(item) {
    limparMensagens()
    setRecebimentoEditando(item)
    setFormulario({
      cliente_id: item.cliente_id ? String(item.cliente_id) : "",
      contrato_id: item.contrato_id ? String(item.contrato_id) : "",
      tipo_recebimento: item.tipo_recebimento || "Aluguel mensal",
      numero_contrato: item.numero_contrato || "",
      descricao: item.descricao || "",
      valor: item.valor ?? "",
      data_vencimento: item.data_vencimento || "",
      forma_pagamento: item.forma_pagamento || "Pix",
      status: item.status || "Pendente",
      observacoes: item.observacoes || "",
    })
    setNovoAberto(true)
  }

  function fecharNovo() {
    if (salvando) return

    setNovoAberto(false)
    setRecebimentoEditando(null)
    setFormulario(
      formularioVazio()
    )
  }

  function abrirConfirmacao(item) {
    limparMensagens()

    setSelecionado(item)

    setFormaPagamento(
      item.forma_pagamento ||
        "Pix"
    )

    setDataPagamento(
      item.data_pagamento ||
        dataHoje
    )

    setConfirmacaoAberta(true)
  }

  function fecharConfirmacao() {
    if (salvando) return

    setConfirmacaoAberta(false)
    setSelecionado(null)
    setFormaPagamento("")
    setDataPagamento(dataHoje)
  }
  async function salvarRecebimento() {
    try {
      setSalvando(true)
      limparMensagens()

      if (!formulario.cliente_id) {
        setErro("Selecione um cliente.")
        return
      }

      if (!formulario.contrato_id) {
        setErro("Selecione um contrato.")
        return
      }

      const contratoSelecionado = contratos.find(
        (contrato) =>
          String(contrato.id) ===
          String(formulario.contrato_id)
      )

      if (
        !contratoSelecionado ||
        String(contratoSelecionado.cliente_id) !==
          String(formulario.cliente_id)
      ) {
        setErro("Selecione um contrato pertencente ao cliente informado.")
        return
      }

      if (!formulario.valor) {
        setErro("Informe o valor do recebimento.")
        return
      }

      if (!formulario.data_vencimento) {
        setErro("Informe a data de vencimento.")
        return
      }

      const dados = {
        cliente_id: contratoSelecionado.cliente_id,
        contrato_id: contratoSelecionado.id,
        tipo_recebimento:
          formulario.tipo_recebimento,
        numero_contrato:
          contratoSelecionado.numero || null,
        descricao:
          formulario.descricao || null,
        valor: Number(formulario.valor),
        data_vencimento:
          formulario.data_vencimento,
        forma_pagamento:
          formulario.forma_pagamento || null,
        status: formulario.status,
        observacoes:
          formulario.observacoes || null,
      }

      const resultado = recebimentoEditando
        ? await supabase
            .from("recebimentos")
            .update(dados)
            .eq("id", recebimentoEditando.id)
        : await supabase
            .from("recebimentos")
            .insert([dados])

      if (resultado.error) {
        throw resultado.error
      }

      setSucesso(
        recebimentoEditando
          ? "Recebimento atualizado com sucesso."
          : "Recebimento cadastrado com sucesso."
      )

      setNovoAberto(false)
      setRecebimentoEditando(null)

      setFormulario(
        formularioVazio()
      )

      await carregarDados()
    } catch (error) {
      console.error(
        "Erro ao salvar recebimento:",
        error
      )

      setErro(
        error?.message ||
          "Não foi possível cadastrar o recebimento."
      )
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarPagamento() {
    if (!selecionado) {
      return
    }

    try {
      setSalvando(true)
      limparMensagens()

      if (!formaPagamento) {
        setErro(
          "Selecione a forma de pagamento."
        )
        return
      }

      if (!dataPagamento) {
        setErro(
          "Informe a data do pagamento."
        )
        return
      }

      const { error } = await supabase
        .from("recebimentos")
        .update({
          status: "Recebido",
          forma_pagamento:
            formaPagamento,
          data_pagamento:
            dataPagamento,
        })
        .eq("id", selecionado.id)

      if (error) {
        throw error
      }

      setSucesso(
        "Recebimento confirmado com sucesso."
      )

      fecharConfirmacao()

      await carregarDados()
    } catch (error) {
      console.error(
        "Erro ao confirmar pagamento:",
        error
      )

      setErro(
        error?.message ||
          "Não foi possível confirmar o pagamento."
      )
    } finally {
      setSalvando(false)
    }
  }

  function nomeProprietarioDoRecebimento(item) {
    const contrato = contratos.find(
      (atual) =>
        String(atual.id) === String(item.contrato_id)
    )
    const imovelId =
      item.imovel_id ||
      contrato?.imovel_id ||
      contrato?.imovel
    const imovel = imoveis.find(
      (atual) => String(atual.id) === String(imovelId)
    )
    const info = imovel?.informacoes_adicionais_imoveis
    const registro = Array.isArray(info) ? info[0] : info

    return registro?.nome_proprietario || ""
  }

  function baixarRecibo(item) {
    const numero =
      item.numero_contrato ||
      numeroContrato(item.contrato_id)

    const bytes = gerarReciboPdf({
      nomeCliente: nomeCliente(item.cliente_id),
      valor: item.valor,
      dataReferencia: item.data_vencimento,
      formaPagamento: item.forma_pagamento,
      tipoRecebimento: item.tipo_recebimento,
      nomeProprietario: nomeProprietarioDoRecebimento(item),
    })

    baixarPdf(
      bytes,
      nomeArquivoRecibo(numero, item.data_vencimento)
    )
  }

  async function excluirRecebimento(id) {
    const confirmar =
      window.confirm(
        "Tem certeza que deseja excluir este recebimento?"
      )

    if (!confirmar) {
      return
    }

    try {
      limparMensagens()

      const { error } = await supabase
        .from("recebimentos")
        .delete()
        .eq("id", id)

      if (error) {
        throw error
      }

      setSucesso(
        "Recebimento excluído com sucesso."
      )

      await carregarDados()
    } catch (error) {
      console.error(
        "Erro ao excluir recebimento:",
        error
      )

      setErro(
        error?.message ||
          "Não foi possível excluir o recebimento."
      )
    }
  }

  return (
    <div className="container-fluid py-4">

      {/* CABEÇALHO */}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

        <div>

          <h1 className="h3 fw-bold mb-1">
            Recebimentos
          </h1>

          <p className="text-muted mb-0">
            Controle dos recebimentos do sistema
          </p>

        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={abrirNovo}
        >
          <span className="me-2">
            +
          </span>

          Novo recebimento
        </button>

      </div>

      {/* MENSAGENS */}

      {erro && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <strong>Erro:</strong>{" "}
          {erro}

          <button
            type="button"
            className="btn-close"
            aria-label="Fechar"
            onClick={() =>
              setErro("")
            }
          />
        </div>
      )}

      {sucesso && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {sucesso}

          <button
            type="button"
            className="btn-close"
            aria-label="Fechar"
            onClick={() =>
              setSucesso("")
            }
          />
        </div>
      )}
      {/* FILTROS */}

      <div className="card bg-ligth border-0 shadow-sm rounded-4 mb-4">

        <div className="card-body">

          <div className="row g-3 align-items-end">

            <div className="col-12 col-md-4">

              <label
                htmlFor="mes"
                className="form-label fw-semibold"
              >
                Mês
              </label>

              <select
                id="mes"
                className="form-select"
                value={mes}
                onChange={(event) =>
                  setMes(
                    Number(
                      event.target.value
                    )
                  )
                }
              >
                <option value="1">
                  Janeiro
                </option>

                <option value="2">
                  Fevereiro
                </option>

                <option value="3">
                  Março
                </option>

                <option value="4">
                  Abril
                </option>

                <option value="5">
                  Maio
                </option>

                <option value="6">
                  Junho
                </option>

                <option value="7">
                  Julho
                </option>

                <option value="8">
                  Agosto
                </option>

                <option value="9">
                  Setembro
                </option>

                <option value="10">
                  Outubro
                </option>

                <option value="11">
                  Novembro
                </option>

                <option value="12">
                  Dezembro
                </option>

              </select>

            </div>

            <div className="col-12 col-md-3">

              <label
                htmlFor="ano"
                className="form-label fw-semibold"
              >
                Ano
              </label>

              <select
                id="ano"
                className="form-select"
                value={ano}
                onChange={(event) =>
                  setAno(
                    Number(
                      event.target.value
                    )
                  )
                }
              >

                <option value="2024">
                  2024
                </option>

                <option value="2025">
                  2025
                </option>

                <option value="2026">
                  2026
                </option>

                <option value="2027">
                  2027
                </option>

                <option value="2028">
                  2028
                </option>

              </select>

            </div>

            <div className="col-12 col-md-5">

              <label
                htmlFor="busca"
                className="form-label fw-semibold"
              >
                Buscar
              </label>

              <input
                id="busca"
                type="text"
                className="form-control"
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="Cliente, contrato ou descrição..."
              />

            </div>

          </div>

        </div>

      </div>

      {/* RESUMO */}

      <div className="row g-3 mb-4">

        <div className="col-12 col-md-4">

          <div className="card border-0 shadow-sm rounded-4 h-100">

            <div className="card-body">

              <p className="text-muted mb-2">
                Total de recebimentos
              </p>

              <h2 className="h4 fw-bold mb-0">
                {periodo.length}
              </h2>

            </div>

          </div>

        </div>

        <div className="col-12 col-md-4">

          <div className="card border-0 shadow-sm rounded-4 h-100">

            <div className="card-body">

              <p className="text-muted mb-2">
                Recebidos
              </p>

              <h2 className="h4 fw-bold text-success mb-1">
                {formatarMoeda(
                  valorRecebido
                )}
              </h2>

              <small className="text-muted">
                {recebidos.length} recebimento(s)
              </small>

            </div>

          </div>

        </div>

        <div className="col-12 col-md-4">

          <div className="card border-0 shadow-sm rounded-4 h-100">

            <div className="card-body">

              <p className="text-muted mb-2">
                Pendentes
              </p>

              <h2 className="h4 fw-bold text-warning mb-1">
                {formatarMoeda(
                  valorPendente
                )}
              </h2>

              <small className="text-muted">
                {pendentes.length} recebimento(s)
              </small>

            </div>

          </div>

        </div>

      </div>

      {/* LISTA DE RECEBIMENTOS */}

      <div className="card border-0 shadow-sm rounded-4 mb-4">

        <div className="card-body">

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">

            <div>

              <h2 className="h5 fw-bold mb-1">
                Lista de recebimentos
              </h2>

              <p className="text-muted small mb-0">
                Recebimentos do período selecionado.
              </p>

            </div>

            <span className="badge text-bg-light border">
              {filtrados.length} registro(s)
            </span>

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
                Carregando recebimentos...
              </p>

            </div>

          ) : filtrados.length === 0 ? (

            <div className="text-center py-5">

              <div className="fs-1 mb-3">
                💰
              </div>

              <h3 className="h6 fw-bold">
                Nenhum recebimento encontrado
              </h3>

              <p className="text-muted mb-3">
                Não existem recebimentos para os filtros selecionados.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={abrirNovo}
              >
                Novo recebimento
              </button>

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
                      Tipo
                    </th>

                    <th>
                      Contrato
                    </th>

                    <th>
                      Vencimento
                    </th>

                    <th>
                      Valor
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="text-end">
                      Ações
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filtrados.map(
                    (item) => (

                      <tr
                        key={item.id}
                      >

                        <td>

                          <div className="fw-semibold">
                            {nomeCliente(
                              item.cliente_id
                            )}
                          </div>

                          {item.descricao && (
                            <small className="text-muted">
                              {item.descricao}
                            </small>
                          )}

                        </td>

                        <td>
                          {item.tipo_recebimento ||
                            "-"}
                        </td>

                        <td>
                          {item.numero_contrato ||
                            numeroContrato(
                              item.contrato_id
                            )}
                        </td>

                        <td>
                          {formatarData(
                            item.data_vencimento
                          )}
                        </td>

                        <td className="fw-semibold">
                          {formatarMoeda(
                            item.valor
                          )}
                        </td>

                        <td>

                          <span
                            className={`badge ${classeStatus(
                              item.status
                            )}`}
                          >
                            {item.status ||
                              "-"}
                          </span>

                        </td>

                        <td>

                          <div className="d-flex justify-content-end gap-2">

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => baixarRecibo(item)}
                            >
                              <i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>
                              Recibo
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => abrirEdicao(item)}
                            >
                              Editar
                            </button>

                            {String(
                              item.status || ""
                            ).toLowerCase() ===
                              "pendente" && (

                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={() =>
                                  abrirConfirmacao(
                                    item
                                  )
                                }
                              >
                                Receber
                              </button>

                            )}

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                excluirRecebimento(
                                  item.id
                                )
                              }
                            >
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
      {/* MODAL - NOVO RECEBIMENTO */}

      {novoAberto && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            backgroundColor:
              "rgba(0, 0, 0, 0.5)",
          }}
        >

          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">

            <div className="modal-content border-0 rounded-4 shadow">

              <div className="modal-header">

                <div>

                  <h2 className="modal-title h5 fw-bold mb-1">
                    {recebimentoEditando
                      ? "Editar recebimento"
                      : "Novo recebimento"}
                  </h2>

                  <p className="text-muted small mb-0">
                    {recebimentoEditando
                      ? "Atualize os dados do recebimento."
                      : "Cadastre um novo recebimento."}
                  </p>

                </div>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={fecharNovo}
                  disabled={salvando}
                />

              </div>

              <div className="modal-body">

                {erro && (
                  <div className="alert alert-danger" role="alert">
                    {erro}
                  </div>
                )}

                <div className="row g-3">

                  <div className="col-12 col-md-6">

                    <label
                      htmlFor="cliente_id"
                      className="form-label fw-semibold"
                    >
                      Cliente
                    </label>

                    <select
                      id="cliente_id"
                      className="form-select"
                      value={
                        formulario.cliente_id
                      }
                      required
                      onChange={(event) => {
                        const clienteId = event.target.value
                        setFormulario((anterior) => {
                          const contratoAtual = contratos.find(
                            (contrato) =>
                              String(contrato.id) ===
                              String(anterior.contrato_id)
                          )
                          const contratoCompativel =
                            contratoAtual &&
                            String(contratoAtual.cliente_id) ===
                              String(clienteId)

                          return {
                            ...anterior,
                            cliente_id: clienteId,
                            contrato_id: contratoCompativel
                              ? anterior.contrato_id
                              : "",
                            numero_contrato: contratoCompativel
                              ? anterior.numero_contrato
                              : "",
                          }
                        })
                        setErro("")
                      }}
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

                  </div>

                  <div className="col-12 col-md-6">

                    <label
                      htmlFor="contrato_id"
                      className="form-label fw-semibold"
                    >
                      Contrato
                    </label>

                    <select
                      id="contrato_id"
                      className="form-select"
                      value={
                        formulario.contrato_id
                      }
                      required
                      onChange={(event) => {

                        const contratoId =
                          event.target.value

                        const contrato =
                          contratos.find(
                            (item) =>
                              String(
                                item.id
                              ) ===
                              String(
                                contratoId
                              )
                          )

                        setFormulario(
                          (anterior) => ({
                            ...anterior,
                            contrato_id:
                              contratoId,
                            cliente_id: contrato?.cliente_id
                              ? String(contrato.cliente_id)
                              : anterior.cliente_id,
                            numero_contrato:
                              contrato?.numero ||
                              "",
                          })
                        )
                        setErro("")
                      }}
                    >

                      <option value="">
                        Selecione o contrato
                      </option>

                      {contratosDoCliente.map(
                        (contrato) => (
                          <option
                            key={contrato.id}
                            value={contrato.id}
                          >
                            {contrato.numero ||
                              `Contrato #${contrato.id}`} - {nomeCliente(contrato.cliente_id)}
                          </option>
                        )
                      )}

                    </select>

                    {formulario.cliente_id &&
                      contratosDoCliente.length === 0 && (
                        <div className="form-text text-danger">
                          Este cliente ainda não possui contratos cadastrados.
                        </div>
                      )}

                  </div>

                  <div className="col-12 col-md-6">

                    <label
                      htmlFor="tipo_recebimento"
                      className="form-label fw-semibold"
                    >
                      Tipo de recebimento
                    </label>

                    <select
                      id="tipo_recebimento"
                      className="form-select"
                      value={
                        formulario.tipo_recebimento
                      }
                      onChange={(event) =>
                        alterarFormulario(
                          "tipo_recebimento",
                          event.target.value
                        )
                      }
                    >

                      <option value="Aluguel mensal">
                        Aluguel mensal
                      </option>

                      <option value="Diária">
                        Diária
                      </option>

                      <option value="Venda unitária">
                        Venda unitária
                      </option>

                      <option value="Venda parcelada">
                        Venda parcelada
                      </option>

                    </select>

                  </div>

                  <div className="col-12">

                    <label
                      htmlFor="descricao"
                      className="form-label fw-semibold"
                    >
                      Descrição
                    </label>

                    <input
                      id="descricao"
                      type="text"
                      className="form-control"
                      value={
                        formulario.descricao
                      }
                      onChange={(event) =>
                        alterarFormulario(
                          "descricao",
                          event.target.value
                        )
                      }
                      placeholder="Descrição do recebimento"
                    />

                  </div>

                  <div className="col-12 col-md-6">

                    <label
                      htmlFor="valor"
                      className="form-label fw-semibold"
                    >
                      Valor
                    </label>

                    <input
                      id="valor"
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      value={
                        formulario.valor
                      }
                      onChange={(event) =>
                        alterarFormulario(
                          "valor",
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                    />

                  </div>

                  <div className="col-12 col-md-6">

                    <label
                      htmlFor="data_vencimento"
                      className="form-label fw-semibold"
                    >
                      Data de vencimento
                    </label>

                    <input
                      id="data_vencimento"
                      type="date"
                      className="form-control"
                      value={
                        formulario.data_vencimento
                      }
                      onChange={(event) =>
                        alterarFormulario(
                          "data_vencimento",
                          event.target.value
                        )
                      }
                    />

                  </div>

                  <div className="col-12 col-md-6">

                    <label
                      htmlFor="forma_pagamento"
                      className="form-label fw-semibold"
                    >
                      Forma de pagamento
                    </label>

                    <select
                      id="forma_pagamento"
                      className="form-select"
                      value={
                        formulario.forma_pagamento
                      }
                      onChange={(event) =>
                        alterarFormulario(
                          "forma_pagamento",
                          event.target.value
                        )
                      }
                    >

                      <option value="Pix">
                        Pix
                      </option>

                      <option value="Dinheiro">
                        Dinheiro
                      </option>

                      <option value="Cartão">
                        Cartão
                      </option>

                      <option value="Depósito">
                        Depósito
                      </option>

                    </select>

                  </div>

                  <div className="col-12 col-md-6">

                    <label
                      htmlFor="status"
                      className="form-label fw-semibold"
                    >
                      Status
                    </label>

                    <select
                      id="status"
                      className="form-select"
                      value={
                        formulario.status
                      }
                      onChange={(event) =>
                        alterarFormulario(
                          "status",
                          event.target.value
                        )
                      }
                    >

                      <option value="Pendente">
                        Pendente
                      </option>

                      <option value="Recebido">
                        Recebido
                      </option>

                    </select>

                  </div>

                  <div className="col-12">

                    <label
                      htmlFor="observacoes"
                      className="form-label fw-semibold"
                    >
                      Observações
                    </label>

                    <textarea
                      id="observacoes"
                      className="form-control"
                      rows="3"
                      value={
                        formulario.observacoes
                      }
                      onChange={(event) =>
                        alterarFormulario(
                          "observacoes",
                          event.target.value
                        )
                      }
                      placeholder="Observações"
                    />

                  </div>

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={fecharNovo}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    salvarRecebimento
                  }
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : recebimentoEditando
                      ? "Salvar alterações"
                      : "Salvar recebimento"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODAL - CONFIRMAR PAGAMENTO */}

      {confirmacaoAberta &&
        selecionado && (
          <div
            className="modal d-block"
            tabIndex="-1"
            role="dialog"
            style={{
              backgroundColor:
                "rgba(0, 0, 0, 0.5)",
            }}
          >

            <div className="modal-dialog modal-dialog-centered">

              <div className="modal-content border-0 rounded-4 shadow">

                <div className="modal-header">

                  <div>

                    <h2 className="modal-title h5 fw-bold mb-1">
                      Confirmar recebimento
                    </h2>

                    <p className="text-muted small mb-0">
                      Confirme os dados do pagamento.
                    </p>

                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Fechar"
                    onClick={
                      fecharConfirmacao
                    }
                    disabled={salvando}
                  />

                </div>

                <div className="modal-body">

                  <div className="bg-light rounded-3 p-3 mb-4">

                    <div className="d-flex justify-content-between mb-2">

                      <span className="text-muted">
                        Cliente
                      </span>

                      <strong>
                        {nomeCliente(
                          selecionado.cliente_id
                        )}
                      </strong>

                    </div>

                    <div className="d-flex justify-content-between">

                      <span className="text-muted">
                        Valor
                      </span>

                      <strong className="text-success">
                        {formatarMoeda(
                          selecionado.valor
                        )}
                      </strong>

                    </div>

                  </div>

                  <div className="mb-3">

                    <label
                      htmlFor="confirmar-forma"
                      className="form-label fw-semibold"
                    >
                      Forma de pagamento
                    </label>

                    <select
                      id="confirmar-forma"
                      className="form-select"
                      value={
                        formaPagamento
                      }
                      onChange={(event) =>
                        setFormaPagamento(
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        Selecione
                      </option>

                      <option value="Pix">
                        Pix
                      </option>

                      <option value="Dinheiro">
                        Dinheiro
                      </option>

                      <option value="Cartão">
                        Cartão
                      </option>

                      <option value="Depósito">
                        Depósito
                      </option>

                    </select>

                  </div>

                  <div className="mb-3">

                    <label
                      htmlFor="confirmar-data"
                      className="form-label fw-semibold"
                    >
                      Data do pagamento
                    </label>

                    <input
                      id="confirmar-data"
                      type="date"
                      className="form-control"
                      value={dataPagamento}
                      onChange={(event) =>
                        setDataPagamento(
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={
                      fecharConfirmacao
                    }
                    disabled={salvando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={
                      confirmarPagamento
                    }
                    disabled={salvando}
                  >
                    {salvando
                      ? "Confirmando..."
                      : "Confirmar pagamento"}
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

    </div>
  )
}