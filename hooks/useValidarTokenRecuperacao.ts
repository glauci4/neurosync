import { useQuery } from "@tanstack/react-query";

async function validarToken(token: string) {
  const response = await fetch(
    `/api/recuperacao-senha/validar?token=${encodeURIComponent(token)}`,
  );
  const resultado = await response.json();

  if (!response.ok) {
    throw new Error(resultado.error || "Token inválido");
  }

  return resultado as { success: boolean; valid: boolean };
}

export function useValidarTokenRecuperacao(token?: string | null) {
  return useQuery({
    queryKey: ["recuperacao-senha-validar", token || ""],
    queryFn: () => validarToken(String(token || "")),
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
  });
}
