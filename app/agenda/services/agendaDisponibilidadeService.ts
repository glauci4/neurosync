export interface HorarioDisponivelAgenda {
  inicio: string;
  fim: string;
  label: string;
  disponivel: boolean;
}

export interface RespostaDisponibilidadeAgenda {
  success: boolean;
  duracaoMinutos: number;
  horarios: HorarioDisponivelAgenda[];
  motivo?: string;
}

interface ConsultaDisponibilidadeParams {
  psicologoId?: string | number | null;
  salaId?: string | number | null;
  data?: string | null;
  consultaId?: string | number | null;
}

function montarQueryString(params: ConsultaDisponibilidadeParams) {
  const query = new URLSearchParams();

  if (
    params.psicologoId !== null &&
    params.psicologoId !== undefined &&
    params.psicologoId !== ""
  ) {
    query.set("psicologoId", String(params.psicologoId));
    query.set("psicologo_id", String(params.psicologoId));
  }

  if (
    params.salaId !== null &&
    params.salaId !== undefined &&
    params.salaId !== ""
  ) {
    query.set("salaId", String(params.salaId));
    query.set("sala_id", String(params.salaId));
  }

  if (params.data) {
    query.set("data", params.data);
    query.set("data_consulta", params.data);
  }

  if (
    params.consultaId !== null &&
    params.consultaId !== undefined &&
    params.consultaId !== ""
  ) {
    query.set("consultaId", String(params.consultaId));
    query.set("consulta_id", String(params.consultaId));
  }

  return query.toString();
}

async function tratarResposta(
  resposta: Response,
): Promise<RespostaDisponibilidadeAgenda> {
  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok || data?.success === false) {
    throw new Error(
      data?.error ||
        data?.message ||
        "Não foi possível carregar os horários disponíveis.",
    );
  }

  return data as RespostaDisponibilidadeAgenda;
}

export async function buscarHorariosDisponiveisAgenda(
  params: ConsultaDisponibilidadeParams,
) {
  const query = montarQueryString(params);
  const resposta = await fetch(
    `/api/agenda/disponibilidade${query ? `?${query}` : ""}`,
    { method: "GET", cache: "no-store" },
  );
  return tratarResposta(resposta);
}

