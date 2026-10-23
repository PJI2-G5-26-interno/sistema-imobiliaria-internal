"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { MENSAGEM_LOGIN_GENERICA } from "../lib/login";

export default function HomePage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      }

      setVerificando(false);
    }

    verificarSessao();
  }, [router, supabase]);

  async function handleLogin(event) {
    event.preventDefault();

    setErro("");

    const nomeInformado = nome.trim();

    if (!nomeInformado || !senha) {
      setErro(MENSAGEM_LOGIN_GENERICA);
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeInformado,
          senha,
        }),
      });

      if (!resposta.ok) {
        setErro(MENSAGEM_LOGIN_GENERICA);
        setCarregando(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Erro inesperado no login:", error);

      setErro(MENSAGEM_LOGIN_GENERICA);
      setCarregando(false);
    }
  }

  if (verificando) {
    return (
      <main className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            aria-hidden="true"
          ></div>

          <div className="text-muted">
            Verificando acesso...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-4 px-3">
      <div
        className="card border-0 shadow"
        style={{
          width: "100%",
          maxWidth: "430px",
          borderRadius: "16px",
        }}
      >
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div
              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{
                width: "64px",
                height: "64px",
                fontSize: "28px",
                fontWeight: "700",
              }}
            >
              I
            </div>

            <h1 className="h3 fw-bold mb-1">
              ImobGest
            </h1>

            <p className="text-muted mb-0">
              Gestão imobiliária
            </p>
          </div>

          <div className="mb-4">
            <h2 className="h5 fw-bold mb-1">
              Acesso ao sistema
            </h2>

            <p className="text-muted small mb-0">
              Entre com seu nome de administrador e senha.
            </p>
          </div>

          {erro && (
            <div
              className="alert alert-danger"
              role="alert"
            >
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label
                htmlFor="nome"
                className="form-label fw-semibold"
              >
                Administrador
              </label>

              <input
                id="nome"
                type="text"
                className="form-control form-control-lg"
                placeholder="Digite seu nome"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                autoComplete="username"
                disabled={carregando}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="senha"
                className="form-label fw-semibold"
              >
                Senha
              </label>

              <input
                id="senha"
                type="password"
                className="form-control form-control-lg"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                autoComplete="current-password"
                disabled={carregando}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>

                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <small className="text-muted">
              ImobGest • Sistema de gestão imobiliária
            </small>
          </div>
        </div>
      </div>
    </main>
  );
}
