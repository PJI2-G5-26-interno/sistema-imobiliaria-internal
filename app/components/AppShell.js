"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "./LogoutButton";

const ITENS = [
  { href: "/dashboard", rotulo: "Dashboard", icone: "bi-speedometer2" },
  { href: "/clientes", rotulo: "Clientes", icone: "bi-people" },
  { href: "/imoveis", rotulo: "Imóveis", icone: "bi-house-door" },
  { href: "/contratos", rotulo: "Contratos", icone: "bi-file-earmark-text" },
  { href: "/recebimentos", rotulo: "Recebimentos", icone: "bi-cash-coin" },
  { href: "/despesas", rotulo: "Despesas", icone: "bi-wallet2" },
  { href: "/financeiro", rotulo: "Financeiro", icone: "bi-bar-chart-line" },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>

      {menuAberto && (
        <button
          type="button"
          className="app-backdrop"
          aria-label="Fechar menu"
          onClick={fecharMenu}
        />
      )}

      <aside
        className={`app-sidebar${menuAberto ? " is-open" : ""}`}
        id="menu-principal"
      >
        <div className="app-brand">
          <div className="app-brand-mark" aria-hidden="true">
            I
          </div>
          <div>
            <strong>ImobGest</strong>
            <span>Gestão imobiliária</span>
          </div>
        </div>

        <nav className="app-nav" aria-label="Principal">
          {ITENS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={fecharMenu}
            >
              <i className={`bi ${item.icone}`} aria-hidden="true" />
              {item.rotulo}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon app-menu-btn"
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            aria-controls="menu-principal"
            onClick={() => setMenuAberto(true)}
          >
            <i className="bi bi-list" aria-hidden="true" />
          </button>

          <span className="app-topbar-title">ImobGest</span>
          <LogoutButton />
        </header>

        <main id="conteudo" className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
