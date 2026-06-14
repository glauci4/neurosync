import type {
  ImportarPacientesPayload,
  ImportarPacientesResponse,
} from "../types/importacaoPacientes.types";

export async function importarPacientes(
  payload: ImportarPacientesPayload,
): Promise<ImportarPacientesResponse> {
  const response = await fetch("/api/pacientes/importar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const resultado = await response.json();
  if (!response.ok) {
    throw new Error(resultado.error || "Erro ao importar pacientes");
  }

  return resultado;
}
