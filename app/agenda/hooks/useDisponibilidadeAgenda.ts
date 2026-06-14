import { useQuery } from "@tanstack/react-query";
import { buscarHorariosDisponiveisAgenda } from "../services/agendaDisponibilidadeService";

export const CHAVE_DISPONIBILIDADE_AGENDA = ["agenda-disponibilidade"] as const;

interface UseDisponibilidadeAgendaParams {
  psicologoId?: string | number | null;
  salaId?: string | number | null;
  data?: string | null;
  consultaId?: string | number | null;
}

function dataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dataValida(data?: string | null) {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const [ano, mes, dia] = data.split("-").map(Number);
  const parsed = new Date(ano, mes - 1, dia);
  const dataISO = `${ano}-${String(mes).padStart(2, "0")}-${String(
    dia,
  ).padStart(2, "0")}`;

  return (
    parsed.getFullYear() === ano &&
    parsed.getMonth() === mes - 1 &&
    parsed.getDate() === dia &&
    dataISO >= dataHojeISO()
  );
}

export function dataDisponivelParaAgenda(data?: string | null) {
  return dataValida(data);
}

export function useDisponibilidadeAgenda({
  psicologoId,
  salaId,
  data,
  consultaId,
}: UseDisponibilidadeAgendaParams) {
  const habilitado = Boolean(psicologoId && salaId && dataValida(data));

  return useQuery({
    queryKey: [
      ...CHAVE_DISPONIBILIDADE_AGENDA,
      psicologoId ?? null,
      salaId ?? null,
      data ?? null,
      consultaId ?? null,
    ],
    queryFn: () =>
      buscarHorariosDisponiveisAgenda({
        psicologoId,
        salaId,
        data,
        consultaId,
      }),
    enabled: habilitado,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}
