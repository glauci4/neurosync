import { useMutation } from "@tanstack/react-query";

async function solicitarRecuperacao(email: string) {
  const response = await fetch("/api/recuperacao-senha/solicitar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const resultado = await response.json();

  if (!response.ok) {
    throw new Error(resultado.error || "Erro ao solicitar recuperação");
  }

  return resultado as { success: boolean; message: string };
}

export function useSolicitarRecuperacao() {
  return useMutation({
    mutationFn: solicitarRecuperacao,
  });
}
