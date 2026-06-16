// app/configuracoes/components/Funcionamento.tsx
// Orquestrador do módulo de Funcionamento com glassmorphism, calendário, pendências e avisos.
// Agora com bloqueio apenas em aplicações mensais (handleAplicarMensal),
// toast de pendências (estilo amarelo com ícone FiAlertTriangle),
// validação de ações repetidas e comparação de pendências ignorando o campo 'ativo'.

"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CalendarRange,
  Loader2,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RxGear } from "react-icons/rx";
import { TbCalendarCancel } from "react-icons/tb";
import { toast } from "sonner";
import ConfirmarAcaoModal from "@/app/pacientes/components/ConfirmarAcaoModal";
import { useConsultaCnpj } from "@/hooks/useConsultaCnpj";
import CalendarioFuncionamento from "../funcionamento/components/CalendarioFuncionamento";
import ExcecoesFuncionamento from "../funcionamento/components/ExcecoesFuncionamento";
import FuncionamentoSemanal from "../funcionamento/components/FuncionamentoSemanal";
import ModalNovaExcecao from "../funcionamento/components/ModalNovaExcecao";
import { useExcecoes } from "../funcionamento/hooks/useExcecoes";
import { useFeriados } from "../funcionamento/hooks/useFeriados";
import { useFuncionamento } from "../funcionamento/hooks/useFuncionamento";
import type { CriarExcecaoPayload } from "../funcionamento/services";
import type {
  AlvoMassa,
  AplicacaoMensalFuncionamento,
  AplicacaoPontualFuncionamento,
  Excecao,
  Horario,
} from "../funcionamento/types";
import {
  calcularEstatisticasFuncionamento, calcularEstatisticasCombinadas,
  clonarHorarios,
  DIAS_CURTOS,
  DIAS_UTEIS,
  FINS_DE_SEMANA,
  horariosIguais,
  listasHorariosIguais,
  montarHorariosSemana,
  normalizarHorario,
  normalizarHorarioNullable,
  obterFeriasProgramadas,
  temExpedienteOuIntervalo,
  temHorarioPreenchido,
} from "../funcionamento/utils/operacional";
import {
  obterDatasDaAplicacaoPontual,
  validarIntervalo,
} from "../funcionamento/utils/validacoesHorario";

const TOAST_NEUROSYNC = {
  className: "border-[#9F64AF]/30 bg-[#F3EAF8] text-[#6F3A82]",
};

const TOAST_AVISO = {
  className: "border-amber-300 bg-amber-50 text-amber-800",
};

const TOAST_PENDENCIAS_ID = "funcionamento-pendencias";

interface FuncionamentoProps {
  podeEditar: boolean;
  cnpjClinica: string;
  cidadeClinica?: string;
  ufClinica?: string;
}

export default function Funcionamento({
  podeEditar,
  cnpjClinica,
  cidadeClinica = "",
  ufClinica = "",
}: FuncionamentoProps) {
  // =========================================================================
  // Hooks e consultas
  // =========================================================================
  const {
    query: querySemanal,
    mutation: mutationSemanal,
    mutationPontual: mutationPontualFuncionamento,
  } = useFuncionamento();
  const {
    query: queryExcecoes,
    criar: criarExcecaoMutation,
    excluir: excluirExcecaoMutation,
  } = useExcecoes();

  // Estados principais
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [horariosOriginais, setHorariosOriginais] = useState<Horario[]>([]);
  const [modalExcecao, setModalExcecao] = useState(false);
  const [dataSelecionadaModal, setDataSelecionadaModal] = useState<
    string | undefined
  >(undefined);
  const [abaPrincipal, setAbaPrincipal] = useState<
    "semanal" | "calendario" | "excecoes"
  >("semanal");

  // Mês/ano atualmente exibidos no calendário (usado para filtrar aplicações pontuais)
  const [mesExibido, setMesExibido] = useState<{ month: number; year: number }>(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);
  const [excecoesRascunho, setExcecoesRascunho] = useState<
    Array<Excecao & { rascunho: true }>
  >([]);
  const [idsExcecoesMarcadasRemocao, setIdsExcecoesMarcadasRemocao] = useState<
    number[]
  >([]);
  const [salvandoAlteracoes, setSalvandoAlteracoes] = useState(false);
  const [excecaoParaExcluir, setExcecaoParaExcluir] = useState<{
    id: number;
    titulo: string;
  } | null>(null);
  const primeiraCarga = useRef(true);
  const conteudoAba = useMemo(() => {
    switch (abaPrincipal) {
      case "calendario":
        return {
          titulo: "Calendário de funcionamento",
          descricao:
            "Acompanhe visualmente dias disponíveis, exceções e bloqueios.",
        };
      case "excecoes":
        return {
          titulo: "Exceções e bloqueios",
          descricao:
            "Gerencie férias, feriados, horários especiais e bloqueios da clínica.",
        };
      default:
        return {
          titulo: "Horários de funcionamento",
          descricao:
            "Configure o funcionamento da clínica e acompanhe os períodos disponíveis para atendimento.",
        };
    }
  }, [abaPrincipal]);

  // Regras de permissão centralizadas do módulo Funcionamento.
  // Psicólogos administram regras operacionais; secretárias consultam a disponibilidade clínica.
  const permissoesFuncionamento = useMemo(() => {
    const podeAdministrar = podeEditar;
    return {
      podeAdministrar,
      podeEditarHorarios: podeAdministrar,
      podeExecutarAcoesRapidas: podeAdministrar,
      podeAplicarMensal: podeAdministrar,
      podeSalvarAlteracoes: podeAdministrar,
      podeCriarExcecoes: podeAdministrar,
      podeRemoverExcecoes: podeAdministrar,
      modoConsultaOperacional: !podeAdministrar,
    };
  }, [podeEditar]);

  // Se usuário não pode administrar, forçar exibição do calendário
  useEffect(() => {
    if (!permissoesFuncionamento.podeAdministrar) {
      setAbaPrincipal("calendario");
    }
  }, [permissoesFuncionamento.podeAdministrar]);

  const {
    data: dataSemanal,
    isLoading: loadingSemanal,
    error: errorSemanal,
  } = querySemanal;
  const horariosPontuais = useMemo(
    () =>
      (dataSemanal || []).filter(
        (h) => h.tipo === "funcionamento" && Boolean(h.data_especifica),
      ),
    [dataSemanal],
  );
  const { data: excecoesPersistidas = [], isLoading: loadingExcecoes } =
    queryExcecoes;

  // Dados do CNPJ para buscar feriados regionais
  const { data: dadosCnpj } = useConsultaCnpj(cnpjClinica);
  const cidadeEfetiva = cidadeClinica || dadosCnpj?.cidade || "";
  const ufEfetiva = ufClinica || dadosCnpj?.estado || "";
  const anoAtual = new Date().getFullYear();
  const { nacionais } = useFeriados(
    anoAtual,
    cnpjClinica,
    cidadeEfetiva,
    ufEfetiva,
  );

  // =========================================================================
  // Inicialização dos horários (carrega da API ou cria defaults)
  // =========================================================================
  useEffect(() => {
    const defaults = montarHorariosSemana(
      (dataSemanal || []).filter(
        (h) => h.tipo === "funcionamento" && !h.data_especifica,
      ),
    );
    setHorarios(defaults);
    setHorariosOriginais(clonarHorarios(defaults));
    setAlteracoesPendentes(false);
    // Não forçar bloqueio aqui: bloqueio passa a ser controlado por aplicações pontuais
    primeiraCarga.current = false;
  }, [dataSemanal]);

  // Dias da semana (0=domingo..6=sábado) que possuem QUALQUER registro mensal/pontual,
  // independente de data. Usado apenas para exibir "Funcionamento definido mensalmente"
  // no CardHorarioDia quando o dia semanal está inativo, sem bloquear a edição.
  const diasComMensal = useMemo(() => {
    if (!horariosPontuais || horariosPontuais.length === 0) return [] as number[];
    const dias = new Set<number>();
    for (const h of horariosPontuais) {
      if (!h.data_especifica) continue;
      const dataISO = String(h.data_especifica || "").slice(0, 10);
      if (!dataISO) continue;
      const [ano, mes, dia] = dataISO.split("-").map(Number);
      if (!ano || !mes || !dia) continue;
      const diaSemana = new Date(ano, mes - 1, dia).getDay();
      if (diaSemana < 0 || diaSemana > 6) continue;
      dias.add(diaSemana);
    }
    return Array.from(dias);
  }, [horariosPontuais]);

  // Existe aplicação mensal com datas presentes ou futuras? (independe do mês exibido)
  // Usado exclusivamente para controlar o toast de aviso mensal x semanal.
  const temMensalConfigurado = useMemo(() => {
    const hoje = new Date();
    const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    return horariosPontuais.some(
      (h) => Boolean(h.data_especifica) && h.data_especifica! >= hojeISO,
    );
  }, [horariosPontuais]);

  const bloqueado = temMensalConfigurado;

  // =========================================================================
  // Detecção de pendências
  // =========================================================================
  useEffect(() => {
    if (!primeiraCarga.current) {
      const temMudancas = !listasHorariosIguais(horarios, horariosOriginais);
      setAlteracoesPendentes(temMudancas);
    }
  }, [horarios, horariosOriginais]);

  const excecoesVisiveis = useMemo(() => {
    const remocoes = new Set(idsExcecoesMarcadasRemocao);
    const base = excecoesPersistidas.filter(
      (excecao) => !remocoes.has(excecao.id),
    );
    const combinadas = [...base, ...excecoesRascunho].sort((a, b) => {
      const dataA = `${a.data_especifica || ""}${a.data_fim || ""}`;
      const dataB = `${b.data_especifica || ""}${b.data_fim || ""}`;
      if (dataA === dataB) return a.id - b.id;
      return dataA.localeCompare(dataB);
    });
    return combinadas;
  }, [excecoesPersistidas, excecoesRascunho, idsExcecoesMarcadasRemocao]);

  const temExcecoesPendentes =
    excecoesRascunho.length > 0 || idsExcecoesMarcadasRemocao.length > 0;
  const temAlteracoesPendentes = alteracoesPendentes || temExcecoesPendentes;

  // =========================================================================
  // Toast de pendências (estilo amarelo com ícone de alerta)
  // =========================================================================
  useEffect(() => {
    if (temAlteracoesPendentes && !salvandoAlteracoes) {
      toast.warning(
        "Você possui alterações não salvas. Clique em Salvar alterações para aplicar.",
        {
          id: TOAST_PENDENCIAS_ID,
          icon: <AlertCircle size={16} className="text-amber-600" />,
          ...TOAST_AVISO,
          duration: 10000,
        },
      );
    } else {
      toast.dismiss(TOAST_PENDENCIAS_ID);
    }
  }, [salvandoAlteracoes, temAlteracoesPendentes]);

  useEffect(() => {
    if (!temAlteracoesPendentes || salvandoAlteracoes) return;

    const avisarAntesDeSair = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", avisarAntesDeSair);
    return () => window.removeEventListener("beforeunload", avisarAntesDeSair);
  }, [salvandoAlteracoes, temAlteracoesPendentes]);

  // =========================================================================
  // Handlers de edição, ações em massa, validações, etc.
  // =========================================================================
  const handleChange = (
    index: number,
    field: keyof Horario,
    value: unknown,
  ) => {
    if (bloqueado) {
      toast.warning(
        "Existe funcionamento mensal configurado. Para alterar horários deste período, edite as datas específicas no calendário.",
        TOAST_AVISO,
      );
      return;
    }
    setHorarios((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as Horario;
      return updated;
    });
  };

  // Aplica um padrão de horário para um conjunto de dias (em massa)
  const aplicarEmMassa = (alvo: AlvoMassa) => {
    const diaReferencia = horarios.find(temHorarioPreenchido);
    if (!diaReferencia) {
      toast.error(
        "Preencha os horários de pelo menos um dia ativo para usar como referência",
      );
      return;
    }
    const { hora_inicio, hora_fim, intervalo_inicio, intervalo_fim } =
      diaReferencia;
    let alterou = false;
    const proximos = horarios.map((h) => {
      let deveAtualizar = false;
      if (alvo === "todos") deveAtualizar = h.ativo;
      else if (alvo === "uteis")
        deveAtualizar = h.ativo && DIAS_UTEIS.includes(h.dia_semana);
      else if (alvo === "finsDeSemana")
        deveAtualizar = h.ativo && FINS_DE_SEMANA.includes(h.dia_semana);
      else if (alvo === "sabados")
        deveAtualizar = h.ativo && h.dia_semana === 6;
      else if (alvo === "domingos")
        deveAtualizar = h.ativo && h.dia_semana === 0;
      if (!deveAtualizar) return h;

      const atualizado = {
        ...h,
        hora_inicio,
        hora_fim,
        intervalo_inicio,
        intervalo_fim,
      };
      if (!horariosIguais(h, atualizado)) alterou = true;
      return atualizado;
    });

    if (!alterou) {
      toast.info("Nenhum horário foi alterado.", TOAST_NEUROSYNC);
      return false;
    }
    setHorarios(proximos);
    return true;
  };

  // Botão "Aplicar dias úteis": ativa e preenche o horário de referência em
  // todos os dias úteis (Seg–Sex), inclusive nos que estiverem inativos.
  const aplicarDiasUteis = () => {
    if (bloqueado) {
      toast.warning(
        "Existe funcionamento mensal configurado. Para alterar horários deste período, edite as datas específicas no calendário.",
        TOAST_AVISO,
      );
      return;
    }
    const diaRef = horarios.find(temHorarioPreenchido);
    if (!diaRef) {
      toast.error(
        "Preencha os horários de pelo menos um dia ativo antes de aplicar.",
      );
      return;
    }

    const errosRef = validarIntervalo(
      normalizarHorario(diaRef.hora_inicio),
      normalizarHorario(diaRef.hora_fim),
      normalizarHorarioNullable(diaRef.intervalo_inicio),
      normalizarHorarioNullable(diaRef.intervalo_fim),
      diaRef.ativo,
    );
    if (Object.keys(errosRef).length > 0) {
      toast.error(
        "Corrija os erros no horário de referência antes de aplicar.",
      );
      return;
    }

    const { hora_inicio, hora_fim, intervalo_inicio, intervalo_fim } = diaRef;

    const diasUteis = horarios.filter((h) => DIAS_UTEIS.includes(h.dia_semana));
    const todosJaAplicados = diasUteis.every(
      (h) =>
        h.ativo &&
        normalizarHorario(h.hora_inicio) === normalizarHorario(hora_inicio) &&
        normalizarHorario(h.hora_fim) === normalizarHorario(hora_fim) &&
        normalizarHorarioNullable(h.intervalo_inicio) ===
          normalizarHorarioNullable(intervalo_inicio) &&
        normalizarHorarioNullable(h.intervalo_fim) ===
          normalizarHorarioNullable(intervalo_fim),
    );
    if (todosJaAplicados) {
      toast.info(
        "Os dias úteis já estão configurados com esses horários.",
        TOAST_NEUROSYNC,
      );
      return;
    }

    setHorarios((prev) =>
      prev.map((h) => {
        if (!DIAS_UTEIS.includes(h.dia_semana)) return h;
        return {
          ...h,
          ativo: true,
          hora_inicio,
          hora_fim,
          intervalo_inicio,
          intervalo_fim,
        };
      }),
    );
    toast.success(
      "Horário aplicado aos dias úteis com sucesso.",
      TOAST_NEUROSYNC,
    );
  };

  const fecharFinsDeSemana = () => {
    if (bloqueado) {
      toast.warning(
        "Existe funcionamento mensal configurado. Para alterar horários deste período, edite as datas específicas no calendário.",
        TOAST_AVISO,
      );
      return;
    }
    const jaFechados = horarios
      .filter((h) => FINS_DE_SEMANA.includes(h.dia_semana))
      .every((h) => !h.ativo && !temExpedienteOuIntervalo(h));
    if (jaFechados) {
      toast.info("Os fins de semana já estão fechados.", TOAST_NEUROSYNC);
      return;
    }
    setHorarios((prev) =>
      prev.map((h) =>
        FINS_DE_SEMANA.includes(h.dia_semana)
          ? {
              ...h,
              ativo: false,
              hora_inicio: "",
              hora_fim: "",
              intervalo_inicio: null,
              intervalo_fim: null,
            }
          : h,
      ),
    );
    toast.success("Fins de semana fechados", TOAST_NEUROSYNC);
  };

  const limparHorarios = () => {
    if (bloqueado) {
      toast.warning(
        "Existe funcionamento mensal configurado. Para alterar horários deste período, edite as datas específicas no calendário.",
        TOAST_AVISO,
      );
      return;
    }
    const temAlgumPreenchido = horarios.some(temExpedienteOuIntervalo);
    if (!temAlgumPreenchido) {
      toast.info("Nenhum horário configurado para limpar.", TOAST_NEUROSYNC);
      return;
    }
    setHorarios((prev) =>
      prev.map((h) =>
        temExpedienteOuIntervalo(h)
          ? {
              ...h,
              ativo: false,
              hora_inicio: "",
              hora_fim: "",
              intervalo_inicio: null,
              intervalo_fim: null,
            }
          : h,
      ),
    );
    toast.success("Horários limpos", TOAST_NEUROSYNC);
  };


  // Aplicação mensal: materializa a configuração semanal nas datas selecionadas
  // sem transformar a semana-modelo em recorrência infinita.
  const handleAplicarMensal = async (
    aplicacao: AplicacaoMensalFuncionamento,
  ) => {
    const datasAplicacao = obterDatasDaAplicacaoPontual(aplicacao);
    if (datasAplicacao.length === 0) {
      toast.info(
        "Nenhuma data futura será afetada por essa seleção.",
        TOAST_NEUROSYNC,
      );
      return;
    }

    const aplicacoesPontuais: AplicacaoPontualFuncionamento[] =
      datasAplicacao.map((dataISO) => {
        const [ano, mes, dia] = dataISO.split("-").map(Number);
        const dataLocal = new Date(ano, mes - 1, dia);
        return {
          dia_semana: dataLocal.getDay(),
          data_especifica: dataISO,
          hora_inicio: aplicacao.hora_inicio,
          hora_fim: aplicacao.hora_fim,
          intervalo_inicio: aplicacao.intervalo_inicio,
          intervalo_fim: aplicacao.intervalo_fim,
          ativo: true,
        };
      });

    try {
      await mutationPontualFuncionamento.mutateAsync(aplicacoesPontuais);
      toast.success(
        "Funcionamento aplicado apenas às datas selecionadas.",
        TOAST_NEUROSYNC,
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível aplicar o funcionamento pontual.";
      toast.error(mensagem);
    }
  };

  const handleSalvar = async () => {
    if (!temAlteracoesPendentes) {
      toast.info("Nenhuma alteração para salvar.", TOAST_NEUROSYNC);
      return;
    }

    if (alteracoesPendentes) {
      const temErro = horarios.some((h) => {
        const erros = validarIntervalo(
          normalizarHorario(h.hora_inicio),
          normalizarHorario(h.hora_fim),
          normalizarHorarioNullable(h.intervalo_inicio),
          normalizarHorarioNullable(h.intervalo_fim),
          h.ativo,
        );
        return Object.keys(erros).length > 0;
      });
      if (temErro) {
        toast.error("Corrija os erros antes de salvar");
        return;
      }
    }

    setSalvandoAlteracoes(true);
    try {
      if (alteracoesPendentes && !bloqueado) {
        await mutationSemanal.mutateAsync(horarios);
        setHorariosOriginais(clonarHorarios(horarios));
        setAlteracoesPendentes(false);
      }

      if (idsExcecoesMarcadasRemocao.length > 0) {
        for (const id of idsExcecoesMarcadasRemocao) {
          await excluirExcecaoMutation.mutateAsync(id);
        }
      }

      if (excecoesRascunho.length > 0) {
        for (const excecao of excecoesRascunho) {
          const payload: CriarExcecaoPayload = {
            tipo: excecao.tipo,
            data_especifica: excecao.data_especifica,
            data_fim: excecao.data_fim || undefined,
            hora_inicio: excecao.hora_inicio || null,
            hora_fim: excecao.hora_fim || null,
            descricao: excecao.descricao || null,
            ativo: excecao.ativo,
          };
          await criarExcecaoMutation.mutateAsync(payload);
        }
      }

      setExcecoesRascunho([]);
      setIdsExcecoesMarcadasRemocao([]);
      setExcecaoParaExcluir(null);
      toast.success("Alterações salvas com sucesso.", TOAST_NEUROSYNC);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao salvar alterações";
      toast.error(mensagem);
    } finally {
      setSalvandoAlteracoes(false);
    }
  };

  // =========================================================================
  // Estatísticas (dias ativos, horas semanais)
  // =========================================================================
  const estatisticas = useMemo(
    () => calcularEstatisticasCombinadas(horarios, horariosPontuais, excecoesVisiveis),
    [horarios, horariosPontuais, excecoesVisiveis],
  );

  // Próximo feriado e férias programadas (para exibir no resumo)
  const proximoFeriado = useMemo(() => {
    const hoje = new Date();
    const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    return (
      (nacionais.data || [])
        .filter((feriado) => feriado.date >= hojeISO)
        .sort((a, b) => a.date.localeCompare(b.date))[0] || null
    );
  }, [nacionais.data]);

  const feriasProgramadas = useMemo(
    () => obterFeriasProgramadas(excecoesPersistidas),
    [excecoesPersistidas],
  );

  const handleAbrirModalComData = (data?: string) => {
    setDataSelecionadaModal(data);
    setModalExcecao(true);
  };

  // Recebe o título do calendário (ex.: "junho 2026") e atualiza mesExibido
  const handleCalendarTitle = useCallback((title: string) => {
    try {
      const monthsPt = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
      ];
      const lower = title.toLowerCase();
      const yearMatch = title.match(/(\d{4})/);
      const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
      let month = monthsPt.findIndex((m) => lower.includes(m)) + 1;
      if (month === 0) {
        // fallback: keep current month
        const now = new Date();
        month = now.getMonth() + 1;
      }
      setMesExibido((prev) =>
        prev.month === month && prev.year === year ? prev : { month, year },
      );
    } catch (e) {
      // ignore
    }
  }, []);

  // Estados de carregamento e erro
  if (errorSemanal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-600"
      >
        <AlertCircle size={20} />
        <span>Não foi possível carregar os horários. Tente novamente.</span>
      </motion.div>
    );
  }

  if (loadingSemanal) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // =========================================================================
  // Renderização principal
  // =========================================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-5xl mx-auto pt-4"
    >
      {/* 1. Resumo operacional */}
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-[#9F64AF]/20 shadow-sm p-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <RxGear size={16} className="text-[#9F64AF] animate-spin" />
          <h4 className="text-sm font-semibold text-gray-800">
            Resumo operacional
          </h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">Dias ativos</span>
            <span className="font-semibold text-gray-800">
              {estatisticas.diasAtivos} de 7
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">Horas semanais</span>
            <span className="font-semibold text-gray-800">
              {estatisticas.horasSemanais}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Próximo feriado</span>
            <span className="font-semibold text-gray-800">
              {proximoFeriado ? formatarDataISO(proximoFeriado.date) : "Nenhum"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">Férias programadas</span>
            <span className="font-semibold text-gray-800">
              {feriasProgramadas.length > 0
                ? `${formatarDataISO(feriasProgramadas[0].data_especifica)} → ${
                    feriasProgramadas[0].data_fim
                      ? formatarDataISO(feriasProgramadas[0].data_fim)
                      : "?"
                  }`
                : "Nenhuma"}
            </span>
          </div>
        </div>
      </section>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-[#9F64AF]/20 bg-white/75 p-5 shadow-sm backdrop-blur-sm md:p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              {abaPrincipal === "semanal" ? (
                <CalendarDays size={16} className="text-[#9F64AF]" />
              ) : abaPrincipal === "calendario" ? (
                <CalendarRange size={16} className="text-[#9F64AF]" />
              ) : (
                <TbCalendarCancel size={16} className="text-[#9F64AF]" />
              )}
              <h4 className="text-sm font-semibold text-gray-800">
                {conteudoAba.titulo}
              </h4>
            </div>
            <p className="mt-1 text-xs text-gray-500 ml-6">
              {conteudoAba.descricao}
            </p>
          </div>

          <div className="flex flex-nowrap gap-2 rounded-2xl bg-[#F9F5FF] p-1.5">
            {permissoesFuncionamento.podeAdministrar && (
              <button
                type="button"
                onClick={() => setAbaPrincipal("semanal")}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-medium transition-colors ${
                  abaPrincipal === "semanal"
                    ? "bg-[#9F64AF] text-white shadow-sm"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                <CalendarDays size={14} />
                Horários de funcionamento
              </button>
            )}

            {permissoesFuncionamento.podeAdministrar && (
              <button
                type="button"
                onClick={() => setAbaPrincipal("excecoes")}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-medium transition-colors ${
                  abaPrincipal === "excecoes"
                    ? "bg-[#9F64AF] text-white shadow-sm"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                <TbCalendarCancel size={14} />
                Exceções e bloqueios
              </button>
            )}

            <button
              type="button"
              onClick={() => setAbaPrincipal("calendario")}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-medium transition-colors ${
                abaPrincipal === "calendario"
                  ? "bg-[#9F64AF] text-white shadow-sm"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              <CalendarRange size={14} />
              Calendário
            </button>
          </div>
        </div>

        <div className="mt-5">
          {abaPrincipal === "semanal" && permissoesFuncionamento.podeAdministrar && (
            <div className="space-y-4">

              <FuncionamentoSemanal
                horarios={horarios}
                excecoes={excecoesVisiveis}
                diasMensalAplicado={[]}
                diasComMensal={diasComMensal}
                disabled={!permissoesFuncionamento.podeEditarHorarios}
                bloqueado={bloqueado}
                compacto
                esconderTextoCabecalho
                modoConsultaOperacional={
                  permissoesFuncionamento.modoConsultaOperacional
                }
                onChange={handleChange}
                onCopiar={(origemIdx, destinos) => {
                  if (bloqueado) {
                    toast.warning(
                      "Existe funcionamento mensal configurado. Para alterar horários deste período, edite as datas específicas no calendário.",
                      TOAST_AVISO,
                    );
                    return;
                  }
                  const ref = horarios[origemIdx];

                  // Impede copiar horário vazio, inválido ou com intervalo incorreto.
                  // Reutiliza validarIntervalo (já importada) que cobre expediente e intervalo.
                  const errosCopia = validarIntervalo(
                    normalizarHorario(ref.hora_inicio),
                    normalizarHorario(ref.hora_fim),
                    normalizarHorarioNullable(ref.intervalo_inicio),
                    normalizarHorarioNullable(ref.intervalo_fim),
                    ref.ativo,
                  );
                  if (Object.keys(errosCopia).length > 0) {
                    toast.warning(
                      "Preencha um horário válido antes de copiar.",
                      TOAST_AVISO,
                    );
                    return;
                  }

                  const destinosAlterados = destinos.filter((i) => {
                    const destino = horarios[i];
                    return !horariosIguais(destino, {
                      ...destino,
                      ativo: ref.ativo,
                      hora_inicio: ref.hora_inicio,
                      hora_fim: ref.hora_fim,
                      intervalo_inicio: ref.intervalo_inicio,
                      intervalo_fim: ref.intervalo_fim,
                    });
                  });

                  if (destinosAlterados.length === 0) {
                    toast.info("Nenhum horário foi alterado.", TOAST_NEUROSYNC);
                    return;
                  }

                  setHorarios((prev) =>
                    prev.map((h, i) =>
                      destinos.includes(i)
                        ? {
                            ...h,
                            ativo: ref.ativo,
                            hora_inicio: ref.hora_inicio,
                            hora_fim: ref.hora_fim,
                            intervalo_inicio: ref.intervalo_inicio,
                            intervalo_fim: ref.intervalo_fim,
                          }
                        : h,
                    ),
                  );
                  toast.success(
                    `Copiado de ${DIAS_CURTOS[origemIdx]} para ${destinosAlterados.length} dia(s)`,
                    TOAST_NEUROSYNC,
                  );
                }}
                onAplicarMensal={handleAplicarMensal}
                onAplicarDiasUteis={aplicarDiasUteis}
                onFecharFinsDeSemana={fecharFinsDeSemana}
                onLimparHorarios={limparHorarios}
              />
            </div>
          )}

          {abaPrincipal === "calendario" && (
            <div className="space-y-4">
              <CalendarioFuncionamento
                horarios={horarios}
                horariosPontuais={horariosPontuais}
                excecoes={excecoesVisiveis}
                isPsicologo={permissoesFuncionamento.podeCriarExcecoes}
                compacto
                esconderCabecalho
                onCalendarTitleChange={handleCalendarTitle}
              />
            </div>
          )}

          {abaPrincipal === "excecoes" && permissoesFuncionamento.podeAdministrar && (
            <div className="space-y-4">
              <ExcecoesFuncionamento
                excecoes={excecoesVisiveis}
                feriadosOficiais={nacionais.data || []}
                loading={loadingExcecoes}
                disabled={!permissoesFuncionamento.podeRemoverExcecoes}
                compacto
                podeCriarExcecao={permissoesFuncionamento.podeCriarExcecoes}
                onNovaExcecao={() => handleAbrirModalComData()}
                onSolicitarRemocao={(excecao) => {
                  const rotulo =
                    excecao.tipo === "ferias"
                      ? "Férias"
                      : excecao.tipo === "bloqueio"
                        ? "Bloqueio"
                        : excecao.tipo === "feriado"
                          ? "Feriado oficial"
                          : "Exceção";

                  setExcecaoParaExcluir({
                    id: excecao.id,
                    titulo: `${rotulo} ${formatarDataISO(excecao.data_especifica)}`,
                  });
                }}
              />
            </div>
          )}
        </div>

        {permissoesFuncionamento.podeSalvarAlteracoes && (
          <div className="mt-5 flex items-center justify-end border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => void handleSalvar()}
              disabled={!temAlteracoesPendentes || salvandoAlteracoes}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#9F64AF] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvandoAlteracoes ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {salvandoAlteracoes ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        )}
      </motion.section>

      {/* Modal para criação de exceções */}
      {modalExcecao && (
        <ModalNovaExcecao
          onClose={() => setModalExcecao(false)}
          onSalvar={(dados) => {
            setExcecoesRascunho((prev) => [
              ...prev,
              {
                id: -Date.now() - prev.length,
                ativo: 1,
                rascunho: true,
                ...dados,
              },
            ]);
            setModalExcecao(false);
          }}
          dataSugerida={dataSelecionadaModal || proximoFeriado?.date}
          excecoesExistentes={excecoesVisiveis}
        />
      )}

      <ConfirmarAcaoModal
        isOpen={Boolean(excecaoParaExcluir)}
        onClose={() => setExcecaoParaExcluir(null)}
        onConfirm={() => {
          if (!excecaoParaExcluir) return;
          if (excecaoParaExcluir.id < 0) {
            setExcecoesRascunho((prev) =>
              prev.filter((excecao) => excecao.id !== excecaoParaExcluir.id),
            );
            setExcecaoParaExcluir(null);
            return;
          }

          setIdsExcecoesMarcadasRemocao((prev) =>
            prev.includes(excecaoParaExcluir.id)
              ? prev
              : [...prev, excecaoParaExcluir.id],
          );
          setExcecaoParaExcluir(null);
        }}
        titulo="Excluir exceção?"
        mensagem="Essa ação será aplicada quando você salvar as alterações."
        confirmando={false}
        tipo="excluir"
      />
    </motion.div>
  );
}

// =========================================================================
// Utilitário: formata data ISO (YYYY-MM-DD) para DD/MM/AAAA
// =========================================================================
function formatarDataISO(data: unknown): string {
  if (!data) return "";
  const asStr = typeof data === "string" ? data : String(data);

  // Se for string no formato YYYY-MM-DD, crie Date local para evitar problemas de timezone
  const isoMatch = asStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const ano = Number(isoMatch[1]);
    const mes = Number(isoMatch[2]);
    const dia = Number(isoMatch[3]);
    const d = new Date(ano, mes - 1, dia);
    const dd = d.getDate().toString().padStart(2, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // Caso padrão: tente criar Date a partir de timestamp ou ISO completo
  const valorData = typeof data === "number" || data instanceof Date ? data : asStr;
  const d = new Date(valorData);
  if (Number.isNaN(d.getTime())) {
    const match = String(data).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    return "";
  }
  const dia = d.getDate().toString().padStart(2, "0");
  const mes = (d.getMonth() + 1).toString().padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}
