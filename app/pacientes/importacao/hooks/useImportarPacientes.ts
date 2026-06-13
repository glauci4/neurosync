"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { importarPacientes } from "../services/importacaoPacientesService";
import type { ImportarPacientesPayload } from "../types/importacaoPacientes.types";

export function useImportarPacientes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ImportarPacientesPayload) =>
      importarPacientes(payload),
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      toast.success(
        `${resultado.resumo.importados} paciente(s) importado(s). ${resultado.resumo.invalidos} inválido(s), ${resultado.resumo.ignorados} ignorado(s).`,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

