// app/inicio/page.tsx
// Tela inicial acolhedora com consultas do dia e filtros leves.

"use client";

import { AlertTriangle, ArrowRight, BrushCleaning, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAgenda, useFiltrosAgenda } from "@/app/agenda/hooks/useAgenda";
import { useSidebar } from "@/app/context/SidebarContext";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import AgendaHoje from "./components/AgendaHoje";
import FiltrosInicio, {
  type EstadoFiltrosInicio,
} from "./components/FiltrosInicio";
import Sidebar from "./components/Sidebar";
import type { StatusConsultaInicio } from "./types";

interface ConsultaAgendaAPI {
  id: number;
  paciente_nome: string;
  psicologo_id: number;
  psicologo_nome: string;
  sala_nome: string;
  status: "agendado" | "remarcado" | "cancelado" | "falta" | "concluido";
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
  tipo_atendimento: string;
  tipo_outro?: string | null;
}

interface ConsultaPainel {
  id: number;
  horario: string;
  paciente: string;
  psicologo?: string | null;
  sala: string;
  tipoAtendimento: string;
  statusOriginal: ConsultaAgendaAPI["status"];
  status: StatusConsultaInicio;
  dataConsulta: string;
  horarioInicio: string;
  horarioFim: string;
  psicologoId: number;
}

function dataHojeISO(dataReferencia = new Date()) {
  const ano = dataReferencia.getFullYear();
  const mes = String(dataReferencia.getMonth() + 1).padStart(2, "0");
  const dia = String(dataReferencia.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function horaCurta(hora: string) {
  return hora?.slice(0, 5) || "";
}

function criarDataHoraLocal(data: string, hora: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [horas, minutos] = horaCurta(hora).split(":").map(Number);
  return new Date(ano, mes - 1, dia, horas || 0, minutos || 0);
}

function capitalizarTexto(texto: string) {
  const valor = texto.trim();
  if (!valor) return "";
  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function formatarTipoAtendimento(tipo: string, tipoOutro?: string | null) {
  const mapa: Record<string, string> = {
    triagem: "Triagem",
    psicoterapia: "Psicoterapia",
    devolutiva: "Devolutiva",
    avaliacao: "Avaliação",
    orientacao: "Orientação",
    retorno: "Retorno",
    alta: "Alta",
    outro: tipoOutro?.trim() || "Outro",
  };

  return mapa[tipo] || capitalizarTexto(tipo);
}

function obterStatusPainel(
  consulta: ConsultaAgendaAPI,
  agora: Date,
): StatusConsultaInicio {
  if (consulta.status !== "agendado") return consulta.status;

  const inicio = criarDataHoraLocal(
    consulta.data_consulta,
    consulta.horario_inicio,
  );
  const fim = criarDataHoraLocal(consulta.data_consulta, consulta.horario_fim);

  if (agora >= fim) {
    return "pendente";
  }

  if (agora >= inicio && agora < fim) {
    return "em_andamento";
  }

  return "agendado";
}

function converterConsulta(
  consulta: ConsultaAgendaAPI,
  agora: Date,
): ConsultaPainel {
  return {
    id: consulta.id,
    horario: horaCurta(consulta.horario_inicio),
    paciente: consulta.paciente_nome,
    psicologo: consulta.psicologo_nome,
    sala: consulta.sala_nome,
    tipoAtendimento: formatarTipoAtendimento(
      consulta.tipo_atendimento,
      consulta.tipo_outro,
    ),
    statusOriginal: consulta.status,
    status: obterStatusPainel(consulta, agora),
    dataConsulta: consulta.data_consulta,
    horarioInicio: consulta.horario_inicio,
    horarioFim: consulta.horario_fim,
    psicologoId: consulta.psicologo_id,
  };
}

function filtrarConsultas(
  consultas: ConsultaPainel[],
  filtros: EstadoFiltrosInicio,
  busca: string,
) {
  const termo = busca.trim().toLowerCase();

  return consultas.filter((consulta) => {
    if (
      filtros.status === "em_andamento" &&
      consulta.status !== "em_andamento"
    ) {
      return false;
    }

    if (filtros.status === "agendadas") {
      if (!["agendado", "remarcado"].includes(consulta.statusOriginal)) {
        return false;
      }
    }

    if (filtros.status === "concluidas" && consulta.status !== "concluido") {
      return false;
    }

    if (filtros.status === "pendentes") {
      const pendente = ["agendado", "remarcado", "falta"].includes(
        consulta.statusOriginal,
      );
      if (!pendente || consulta.status === "em_andamento") return false;
    }

    if (filtros.psicologo_id && consulta.psicologoId !== filtros.psicologo_id) {
      return false;
    }

    if (filtros.sala) {
      const salaNormalizada = consulta.sala.toLowerCase();
      if (!salaNormalizada.includes(filtros.sala.toLowerCase())) {
        return false;
      }
    }

    if (!termo) return true;

    const textoBusca = [
      consulta.paciente,
      consulta.psicologo || "",
      consulta.sala,
      consulta.tipoAtendimento,
      consulta.status,
    ]
      .join(" ")
      .toLowerCase();

    return textoBusca.includes(termo);
  });
}

function ordenarConsultas(consultas: ConsultaPainel[]) {
  return [...consultas].sort(
    (a, b) =>
      criarDataHoraLocal(a.dataConsulta, a.horarioInicio).getTime() -
      criarDataHoraLocal(b.dataConsulta, b.horarioInicio).getTime(),
  );
}

function saudacaoAtual(data: Date) {
  const hora = data.getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Inicio() {
  const { usuario, carregando, estaAutenticado, fazerLogout } =
    useAutenticacao();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [agora, setAgora] = useState(() => new Date());
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<EstadoFiltrosInicio>({
    status: "todos",
    psicologo_id: undefined,
    sala: undefined,
  });

  const perfilId =
    usuario?.perfil_id || (usuario?.perfil === "psicologo" ? 2 : 1);
  const ePsicologo = usuario?.perfil === "psicologo";

  const hojeISO = dataHojeISO();
  const filtrosAgenda = useMemo(
    () => ({
      data_inicio: hojeISO,
      data_fim: hojeISO,
      ...(ePsicologo ? { psicologo_id: usuario.id } : {}),
    }),
    [ePsicologo, hojeISO, usuario?.id],
  );

  const {
    data: agendaData,
    isLoading: carregandoConsultas,
    error: erroConsultas,
  } = useAgenda(filtrosAgenda);
  const { data: filtrosAgendaData } = useFiltrosAgenda();

  const consultasBase = useMemo(() => {
    const dados = ((agendaData?.data || []) as ConsultaAgendaAPI[]) || [];
    return ordenarConsultas(
      dados.map((consulta) => converterConsulta(consulta, agora)),
    );
  }, [agendaData, agora]);

  const opcoesPsicologos = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const consulta of consultasBase) {
      if (consulta.psicologoId && consulta.psicologo) {
        mapa.set(consulta.psicologoId, consulta.psicologo);
      }
    }
    return Array.from(mapa.entries()).map(([valor, label]) => ({
      valor: String(valor),
      label,
    }));
  }, [consultasBase]);

  const opcoesSalas = useMemo(() => {
    return (filtrosAgendaData?.data?.salas || []).map((sala) => ({
      valor: String(sala.id),
      label: sala.tipo ? `${sala.nome} (${sala.tipo})` : sala.nome,
    }));
  }, [filtrosAgendaData?.data?.salas]);

  const consultasVisiveis = useMemo(
    () => filtrarConsultas(consultasBase, filtros, busca),
    [consultasBase, busca, filtros],
  );

  const consultasHojeTotal = consultasBase.length;
  const saudacao = saudacaoAtual(agora);
  const primeiroNome =
    usuario?.nome?.split(" ")[0] || usuario?.nome || "usuário";
  const textoResumo = consultasHojeTotal
    ? ePsicologo
      ? `Veja seus atendimentos programados para hoje.`
      : `Confira os atendimentos programados para hoje.`
    : "Nenhuma consulta programada para hoje.";
  const mensagemVaziaConsultas = busca.trim()
    ? "Nenhuma consulta encontrada para a busca."
    : consultasVisiveis.length === 0 && consultasHojeTotal > 0
      ? "Nenhum atendimento encontrado com esse filtro."
      : "Nenhuma consulta agendada para hoje.";

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAgora(new Date());
    }, 60 * 1000);

    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!carregando && !estaAutenticado) {
      router.push("/");
    }
  }, [carregando, estaAutenticado, router]);

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
          <p className="text-sm text-gray-500">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!estaAutenticado || !usuario) {
    return null;
  }

  const contentMargin = isCollapsed ? "ml-20" : "ml-64";
  const placeholderBusca =
    usuario.perfil === "psicologo"
      ? "Buscar paciente ou sala"
      : "Buscar paciente, psicólogo ou sala";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0]">
      <Sidebar perfilId={perfilId} onLogout={fazerLogout} usuario={usuario} />

      <div className={contentMargin}>
        <div className="px-8 pt-8 pb-2">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-800">
                {saudacao},{" "}
                <span className="inline-flex items-center gap-2">
                  {primeiroNome}
                </span>
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {textoResumo}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/agenda")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9F64AF] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B]"
            >
              <ArrowRight size={16} />
              Ver agenda
            </button>
          </header>
        </div>

        <main className="px-8 pb-8">
          <div className="mx-auto max-w-5xl space-y-4 pt-2">
            <section className="relative z-[9999] rounded-2xl border border-[#9F64AF]/15 bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="search"
                    value={busca}
                    onChange={(evento) => setBusca(evento.target.value)}
                    placeholder={placeholderBusca}
                    className="w-full rounded-xl border border-gray-200 bg-white/90 py-2.5 pl-9 pr-3 text-sm text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#9F64AF]/50 focus:ring-2 focus:ring-[#9F64AF]/10"
                  />
                  {busca.trim() && (
                    <button
                      type="button"
                      onClick={() => setBusca("")}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                      aria-label="Limpar busca"
                      title="Limpar busca"
                    >
                      <BrushCleaning size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <FiltrosInicio
                    filtros={filtros}
                    psicologos={opcoesPsicologos}
                    salas={opcoesSalas}
                    mostrarPsicologos={!ePsicologo}
                    onChange={setFiltros}
                  />
                </div>
              </div>
            </section>

            {carregandoConsultas ? (
              <section className="rounded-2xl border border-[#E1D4F0] bg-white/90 p-6 shadow-sm backdrop-blur-sm">
                <div className="flex justify-center py-10">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
                </div>
              </section>
            ) : erroConsultas ? (
              <section className="rounded-2xl border border-red-200 bg-white/90 p-6 shadow-sm">
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <AlertTriangle size={22} />
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    Não foi possível carregar as consultas do dia.
                  </p>
                  <p className="text-sm text-gray-500">
                    Tente novamente em instantes.
                  </p>
                </div>
              </section>
            ) : (
              <AgendaHoje
                consultas={consultasVisiveis.map((consulta) => ({
                  id: consulta.id,
                  horario: consulta.horario,
                  horarioFim: consulta.horarioFim,
                  paciente: consulta.paciente,
                  psicologo: consulta.psicologo,
                  sala: consulta.sala,
                  tipoAtendimento: consulta.tipoAtendimento,
                  status: consulta.status,
                }))}
                mostrarPsicologo={!ePsicologo}
                mensagemVazia={mensagemVaziaConsultas}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
