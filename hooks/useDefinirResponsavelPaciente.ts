"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DefinirResponsavelPayload {
  pacienteId: number;
  psicologo_id: number;
}

async function definirResponsavelPaciente({
  pacienteId,
  psicologo_id,
}: DefinirResponsavelPayload) {
  const resposta = await fetch(
    `/api/pacientes/${pacienteId}/acompanhamento/definir`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ psicologo_id }),
    },
  );

  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(data.error || "Não foi possível definir o responsável");
  }

  return data;
}

export function useDefinirResponsavelPaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: definirResponsavelPaciente,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["paciente", variables.pacienteId],
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["pacientes"],
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["prontuarios"],
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["notificacoes"],
        refetchType: "active",
      });
    },
  });
}
