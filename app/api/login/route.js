import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  MENSAGEM_LOGIN_GENERICA,
  credenciaisLogin,
  origemDoPedidoEhValida,
} from "../../../lib/login";
import { createClient as createServerClient } from "../../../lib/supabase/server";

function respostaNaoAutorizado() {
  return NextResponse.json(
    { ok: false, erro: MENSAGEM_LOGIN_GENERICA },
    { status: 401 }
  );
}

async function obterEmailAdmin(nome) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (serviceRole) {
    const admin = createClient(supabaseUrl, serviceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await admin
      .from("profiles")
      .select("email")
      .eq("nome", nome)
      .eq("ativo", true)
      .maybeSingle();

    if (error || !data?.email) {
      return null;
    }

    return data.email;
  }

  const anon = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await anon.rpc("resolver_email_admin", {
    p_nome: nome,
  });

  if (error || !data) {
    return null;
  }

  return data;
}

export async function POST(request) {
  if (!origemDoPedidoEhValida(request)) {
    return respostaNaoAutorizado();
  }

  let corpo;

  try {
    corpo = await request.json();
  } catch {
    return respostaNaoAutorizado();
  }

  const credenciais = credenciaisLogin(corpo?.nome, corpo?.senha);

  if (!credenciais.ok) {
    return respostaNaoAutorizado();
  }

  const email = await obterEmailAdmin(credenciais.nome);

  if (!email) {
    return respostaNaoAutorizado();
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: credenciais.senha,
  });

  if (error || !data?.user) {
    return respostaNaoAutorizado();
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("ativo")
    .eq("id", data.user.id)
    .maybeSingle();

  if (perfil?.ativo !== true) {
    await supabase.auth.signOut();
    return respostaNaoAutorizado();
  }

  return NextResponse.json({ ok: true });
}
