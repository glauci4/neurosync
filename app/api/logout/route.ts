import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout realizado com sucesso",
  });

  response.cookies.set("usuario_neurosync", "", {
    path: "/",
    expires: new Date(0),
  });

  return response;
}
