// proxy.ts
// Arquivo de proxy do Next.js, protege rotas que exigem autenticação

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Rotas que não precisam de autenticação (públicas)
const rotasPublicas = ["/", "/recuperar-senha", "/redefinir-senha"];

// Rotas que exigem autenticação (protegidas)
const rotasProtegidas = [
  "/inicio",
  "/pacientes",
  "/agenda",
  "/relatorios",
  "/prontuario",
  "/configuracoes",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Se for rota pública, permite acesso
  if (rotasPublicas.includes(pathname)) {
    return NextResponse.next();
  }

  // Verifica se a rota atual é protegida
  const rotaProtegida = rotasProtegidas.some((rota) =>
    pathname.startsWith(rota),
  );

  if (rotaProtegida) {
    // Verifica se o usuário está logado (via cookie)
    const usuarioCookie = request.cookies.get("usuario_neurosync");

    if (!usuarioCookie) {
      // Redireciona para a página de login
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// Configura quais rotas o proxy vai processar
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\..*).*)",
  ],
};
