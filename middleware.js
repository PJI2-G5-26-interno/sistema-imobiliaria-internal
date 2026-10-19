import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function aplicarCookies(destino, origem) {
  origem.cookies.getAll().forEach((cookie) => {
    destino.cookies.set({
      name: cookie.name,
      value: cookie.value,
      path: cookie.path,
      domain: cookie.domain,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      maxAge: cookie.maxAge,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
    });
  });

  return destino;
}

async function ehAdminAtivo(supabase, user) {
  if (!user) {
    return false;
  }

  const { data } = await supabase
    .from("profiles")
    .select("ativo")
    .eq("id", user.id)
    .maybeSingle();

  return data?.ativo === true;
}

export async function middleware(request) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const adminAtivo = await ehAdminAtivo(supabase, user);

  if (pathname === "/api/login") {
    return response;
  }

  if (pathname === "/") {
    if (user && adminAtivo) {
      return aplicarCookies(
        NextResponse.redirect(new URL("/dashboard", request.url)),
        response
      );
    }

    if (user && !adminAtivo) {
      await supabase.auth.signOut();
    }

    return response;
  }

  if (!user || !adminAtivo) {
    if (user) {
      await supabase.auth.signOut();
    }

    return aplicarCookies(
      NextResponse.redirect(new URL("/", request.url)),
      response
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
