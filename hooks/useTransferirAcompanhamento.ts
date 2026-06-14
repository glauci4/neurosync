"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TransferirAcompanhamentoPayload {
  pacienteId: number;
  psicologo_destino_id: number;
  motivo: string;
  observacoes?: string | null;
}

async function transferirAcompanhamento({
  pacienteId,
  psicologo_destino_id,
  motivo,
  observacoes,
}: TransferirAcompanhamentoPayload) {
  const resposta = await fetch(
    `/api/pacientes/${pacienteId}/acompanhamento/transferir`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        psicologo_destino_id,
        motivo,
        observacoes,
      }),
    },
  );

  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(
      data.error || "Não foi possível transferir o acompanhamento",
    );
  }

  return data;
}

export function useTransferirAcompanhamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transferirAcompanhamento,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["paciente", variables.pacienteId],
      });
      queryClient.invalidateQueries({
        queryKey: ["pacientes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["prontuarios"],
      });
    },
  });
}
