// app/configuracoes/funcionamento/components/ModalNovaExcecao.tsx
// Modal para criação de nova exceção com mini calendário e orientação dinâmica por tipo.

"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdErrorOutline } from "react-icons/md";
import { TbCalendarCancel } from "react-icons/tb";
import { toast } from "sonner";
import { type CriarExcecaoPayload, validarConflitosExcecao } from "../services";
import { getFeriadosNacionais } from "../services/feriados";
import type { Excecao } from "../types";
import { obterDataLocalISO } from "../utils/calendario";

type TipoExcecao = "feriado" | "ferias" | "bloqueio" | "excecao";

const DIAS_CABECALHO = [
  { chave: "domingo", label: "D" },
  { chave: "segunda", label: "S" },
  { chave: "terca", label: "T" },
  { chave: "quarta", label: "Q" },
  { chave: "quinta", label: "Q" },
  { chave: "sexta", label: "S" },
  { chave: "sabado", label: "S" },
];

interface ModalNovaExcecaoProps {
  onClose: () => void;
  onSalvar: (dados: CriarExcecaoPayload) => void;
  dataSugerida?: string;
  excecoesExistentes?: Excecao[];
}

function DropdownCustom({
  value,
  onChange,
  options,
}: {
  value: TipoExcecao;
  onChange: (valor: TipoExcecao) => void;
  options: Array<{ key: TipoExcecao; label: string }>;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const labelAtual = options.find((opcao) => opcao.key === value)?.label || "";
  const containerAtual = ref.current;

  useEffect(() => {
    const fechar = (evento: MouseEvent) => {
      if (containerAtual && !containerAtual.contains(evento.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [containerAtual]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-[#9F64AF]/20 bg-white/90 px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:border-[#9F64AF] focus:border-[#9F64AF] focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30"
      >
        <span className="truncate">{labelAtual}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#9F64AF] transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>
      {aberto && (
        <div className="absolute z-[10000] mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {options.map((opcao) => (
            <button
              key={opcao.key}
              type="button"
              onClick={() => {
                onChange(opcao.key);
                setAberto(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                value === opcao.key
                  ? "bg-[#F3EAF8] text-[#9F64AF] font-medium"
                  : "text-gray-700 hover:bg-[#F9F5FF]"
              }`}
            >
              <span>{opcao.label}</span>
              {value === opcao.key && (
                <Check size={16} className="text-[#9F64AF]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CampoErro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p className="mt-1 flex items-start gap-1 text-xs text-red-600">
      <MdErrorOutline size={12} className="mt-0.5 shrink-0" />
      <span>{mensagem}</span>
    </p>
  );
}

function criarDataLocalISO(dataISO: string) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function periodsOverlap(
  aInicio: string,
  aFim: string,
  bInicio: string,
  bFim: string,
): boolean {
  return aInicio <= bFim && aFim >= bInicio;
}

function formatarResumoConflito(dataISO: string, total: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
    return `Data inválida — ${total} ${total === 1 ? "consulta" : "consultas"}`;
  }

  const data = criarDataLocalISO(dataISO);
  if (Number.isNaN(data.getTime())) {
    return `Data inválida — ${total} ${total === 1 ? "consulta" : "consultas"}`;
  }

  const [ano, mes, dia] = dataISO.split("-").map(Number);
  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return `Data inválida — ${total} ${total === 1 ? "consulta" : "consultas"}`;
  }

  const formato = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const texto = formato.format(data);
  const capitalizado = texto.charAt(0).toUpperCase() + texto.slice(1);
  return `${capitalizado} — ${total} ${total === 1 ? "consulta" : "consultas"}`;
}

function obterOrientacaoTipo(tipo: TipoExcecao) {
  switch (tipo) {
    case "ferias":
      return "Selecione o período de férias.";
    case "bloqueio":
      return "Selecione o período de bloqueio.";
    case "excecao":
      return "Selecione a data e defina o horário especial.";
    default:
      return "Selecione um feriado oficial para preencher a indisponibilidade.";
  }
}

function obterPlaceholderObservacao(tipo: TipoExcecao) {
  switch (tipo) {
    case "ferias":
      return "Ex: Recesso da clínica";
    case "bloqueio":
      return "Ex: Manutenção interna";
    case "excecao":
      return "Ex: Atendimento reduzido";
    default:
      return "Ex: Feriado nacional";
  }
}

export default function ModalNovaExcecao({
  onClose,
  onSalvar,
  excecoesExistentes,
}: ModalNovaExcecaoProps) {
  const hoje = obterDataLocalISO(new Date());
  const [tipo, setTipo] = useState<TipoExcecao>("feriado");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [descricao, setDescricao] = useState("");
  const [descricaoAutomaticaFeriado, setDescricaoAutomaticaFeriado] = useState<
    string | null
  >(null);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [tocado, setTocado] = useState({
    dataInicio: false,
    dataFim: false,
    horaInicio: false,
    horaFim: false,
    descricao: false,
  });
  const [mesCalendario, setMesCalendario] = useState(() => {
    const hojeLocal = criarDataLocalISO(hoje);
    return new Date(hojeLocal.getFullYear(), hojeLocal.getMonth(), 1);
  });
  const [montado, setMontado] = useState(false);

  const errosVisuais = useMemo(() => {
    const erros: Record<string, string | undefined> = {};

    if (!dataInicio) erros.dataInicio = "Informe a data";
    if (dataInicio && dataInicio < hoje) {
      erros.dataInicio = "Não pode cadastrar datas anteriores a hoje";
    }

    if ((tipo === "ferias" || tipo === "bloqueio") && !dataFim) {
      erros.dataFim = "Informe a data final";
    }
    if (dataFim && dataInicio && dataFim < dataInicio) {
      erros.dataFim = "Data final menor que a inicial";
    }

    if (tipo === "excecao") {
      if (!horaInicio) erros.horaInicio = "Informe o horário de início";
      if (!horaFim) erros.horaFim = "Informe o horário de fim";
      if (horaInicio && horaFim && horaInicio >= horaFim) {
        erros.horaInicio = "Horário inválido";
        erros.horaFim = "Horário inválido";
      }
    }

    const descricaoTrim = descricao.trim();
    if (descricaoTrim && descricaoTrim.length > 0 && descricaoTrim.length < 3) {
      erros.descricao = "Informe uma observação válida";
    }

    return erros;
  }, [dataFim, dataInicio, descricao, horaFim, horaInicio, hoje, tipo]);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!montado) return;
    setTipo("feriado");
    setDataInicio("");
    setDataFim("");
    setHoraInicio("");
    setHoraFim("");
    setDescricao("");
    setDescricaoAutomaticaFeriado(null);
    setTentouSalvar(false);
    setTocado({
      dataInicio: false,
      dataFim: false,
      horaInicio: false,
      horaFim: false,
      descricao: false,
    });
    const hojeLocal = criarDataLocalISO(hoje);
    setMesCalendario(
      new Date(hojeLocal.getFullYear(), hojeLocal.getMonth(), 1),
    );
  }, [montado, hoje]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const anoCalendario = mesCalendario.getFullYear();
  const feriadosOficiaisQuery = useQuery({
    queryKey: ["feriados-nacionais", anoCalendario],
    queryFn: () => getFeriadosNacionais(anoCalendario),
    enabled: tipo === "feriado",
    staleTime: 24 * 60 * 60 * 1000,
  });

  const feriadosSet = useMemo(() => {
    const feriadosOficiais = feriadosOficiaisQuery.data || [];
    return new Map(
      feriadosOficiais
        .filter((feriado) => feriado.date >= hoje)
        .map((feriado) => [feriado.date, feriado.name]),
    );
  }, [feriadosOficiaisQuery.data, hoje]);

  const feriadosDoMesAtual = useMemo(() => {
    if (tipo !== "feriado") return new Map<string, string>();
    const ano = mesCalendario.getFullYear();
    const mes = String(mesCalendario.getMonth() + 1).padStart(2, "0");
    const prefixoMes = `${ano}-${mes}`;
    return new Map(
      Array.from(feriadosSet.entries()).filter(([data]) =>
        data.startsWith(prefixoMes),
      ),
    );
  }, [feriadosSet, mesCalendario, tipo]);

  const mesAtualReferencia = useMemo(() => {
    const data = criarDataLocalISO(hoje);
    return new Date(data.getFullYear(), data.getMonth(), 1);
  }, [hoje]);

  const podeVoltarMes = useMemo(() => {
    const mesAtualExibido = new Date(
      mesCalendario.getFullYear(),
      mesCalendario.getMonth(),
      1,
    );
    return mesAtualExibido > mesAtualReferencia;
  }, [mesAtualReferencia, mesCalendario]);

  const parametrosConflito = useMemo(() => {
    if (!dataInicio) return null;
    if ((tipo === "ferias" || tipo === "bloqueio") && !dataFim) return null;
    if (
      tipo === "excecao" &&
      (!horaInicio || !horaFim || horaInicio >= horaFim)
    ) {
      return null;
    }

    return {
      tipo,
      data_especifica: dataInicio,
      data_fim: tipo === "ferias" || tipo === "bloqueio" ? dataFim : dataInicio,
      hora_inicio: tipo === "excecao" ? horaInicio : null,
      hora_fim: tipo === "excecao" ? horaFim : null,
    } satisfies CriarExcecaoPayload;
  }, [dataFim, dataInicio, horaFim, horaInicio, tipo]);

  const conflitosQuery = useQuery({
    queryKey: ["funcionamento-excecao-conflitos", parametrosConflito],
    queryFn: () => {
      if (!parametrosConflito) {
        throw new Error("Parâmetros de conflito não informados");
      }
      return validarConflitosExcecao(parametrosConflito);
    },
    enabled: Boolean(parametrosConflito),
    staleTime: 0,
  });

  const conflitoExcecao = conflitosQuery.data?.temConflitos
    ? conflitosQuery.data
    : null;

  // Verifica conflito de período entre férias e bloqueios usando os dados locais,
  // sem precisar chamar a API.
  const conflitoPeriodo = useMemo(() => {
    if (!excecoesExistentes || !dataInicio) return null;
    if ((tipo === "bloqueio" || tipo === "ferias") && !dataFim) return null;

    const fim = dataFim || dataInicio;

    if (tipo === "bloqueio") {
      const encontrou = excecoesExistentes.find(
        (e) =>
          e.tipo === "ferias" &&
          e.ativo !== 0 &&
          periodsOverlap(
            dataInicio,
            fim,
            e.data_especifica,
            e.data_fim || e.data_especifica,
          ),
      );
      if (encontrou)
        return "Não é possível cadastrar bloqueio em um período já marcado como férias.";
    }

    if (tipo === "ferias") {
      const encontrou = excecoesExistentes.find(
        (e) =>
          e.tipo === "bloqueio" &&
          e.ativo !== 0 &&
          periodsOverlap(
            dataInicio,
            fim,
            e.data_especifica,
            e.data_fim || e.data_especifica,
          ),
      );
      if (encontrou)
        return "Já existe um bloqueio cadastrado neste período.";
    }

    return null;
  }, [excecoesExistentes, tipo, dataInicio, dataFim]);

  const formatarObservacaoFeriado = (nome: string) => {
    const nomeLimpo = nome.replace(/^feriado\s*:?\s*/i, "").trim();
    return `Feriado: ${nomeLimpo || nome}`;
  };

  const atualizarDescricaoPorFeriado = (
    dataSelecionada: string,
    nomeFeriado?: string,
  ) => {
    setDataInicio(dataSelecionada);

    if (nomeFeriado) {
      const observacao = formatarObservacaoFeriado(nomeFeriado);
      setDescricao(observacao);
      setDescricaoAutomaticaFeriado(observacao);
      return;
    }

    if (
      descricaoAutomaticaFeriado &&
      descricao === descricaoAutomaticaFeriado
    ) {
      setDescricao("");
    }
    setDescricaoAutomaticaFeriado(null);
  };

  const diasCalendario = useMemo(() => {
    const ano = mesCalendario.getFullYear();
    const mes = mesCalendario.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const dias: { chave: string; data: string | null }[] = [];
    for (let i = 0; i < primeiroDia.getDay(); i++) {
      dias.push({ chave: `vazio-${ano}-${mes}-${i}`, data: null });
    }
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const data = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dias.push({ chave: data, data });
    }
    return dias;
  }, [mesCalendario]);

  const mesAnterior = () =>
    setMesCalendario((atual) => {
      const anterior = new Date(atual.getFullYear(), atual.getMonth() - 1, 1);
      return anterior < mesAtualReferencia ? atual : anterior;
    });
  const proximoMes = () =>
    setMesCalendario(
      new Date(mesCalendario.getFullYear(), mesCalendario.getMonth() + 1, 1),
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTentouSalvar(true);
    if (!dataInicio) {
      toast.error("Informe a data", {
        icon: <MdErrorOutline size={16} className="text-red-600" />,
        className: "border-red-200 bg-red-50 text-red-600",
      });
      return;
    }
    if (dataInicio < hoje) {
      toast.error("Não pode cadastrar datas anteriores a hoje", {
        icon: <MdErrorOutline size={16} className="text-red-600" />,
        className: "border-red-200 bg-red-50 text-red-600",
      });
      return;
    }
    if ((tipo === "ferias" || tipo === "bloqueio") && !dataFim) {
      toast.error("Informe a data final", {
        icon: <MdErrorOutline size={16} className="text-red-600" />,
        className: "border-red-200 bg-red-50 text-red-600",
      });
      return;
    }
    if (dataFim && dataFim < dataInicio) {
      toast.error("Data final menor que a inicial", {
        icon: <MdErrorOutline size={16} className="text-red-600" />,
        className: "border-red-200 bg-red-50 text-red-600",
      });
      return;
    }
    if (tipo === "excecao" && (!horaInicio || !horaFim)) {
      toast.error("Informe o horário de início e fim", {
        icon: <MdErrorOutline size={16} className="text-red-600" />,
        className: "border-red-200 bg-red-50 text-red-600",
      });
      return;
    }
    if (errosVisuais.descricao) {
      toast.error("Informe uma observação válida.", {
        icon: <MdErrorOutline size={16} className="text-red-600" />,
        className: "border-red-200 bg-red-50 text-red-600",
      });
      return;
    }
    if (conflitoPeriodo) {
      toast.error(conflitoPeriodo, {
        icon: <MdErrorOutline size={16} className="text-red-600" />,
        className: "border-red-200 bg-red-50 text-red-600",
      });
      return;
    }
    if (conflitoExcecao?.temConflitos) {
      toast.error(conflitoExcecao.mensagem || "Existem consultas vinculadas.");
      return;
    }
    onSalvar({
      tipo,
      data_especifica: dataInicio,
      data_fim: dataFim || undefined,
      hora_inicio: horaInicio || null,
      hora_fim: horaFim || null,
      descricao: descricao || null,
    });
    onClose();
  };

  if (!montado) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-[#2B1F31]/35 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-[#9F64AF]/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200/50 px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EAF8]">
              <TbCalendarCancel size={17} className="text-[#9F64AF]" />
            </span>
            Nova exceção
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col md:flex-row gap-6"
          >
            <div className="flex-1 space-y-4">
              <div>
                <label
                  htmlFor="tipo-excecao"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Tipo
                </label>
                <DropdownCustom
                  value={tipo}
                  options={[
                    { key: "feriado", label: "Feriado" },
                    { key: "ferias", label: "Férias (período)" },
                    { key: "bloqueio", label: "Bloqueio (período)" },
                    { key: "excecao", label: "Horário especial" },
                  ]}
                  onChange={(valor) => {
                    setTipo(valor);
                    if (
                      descricaoAutomaticaFeriado &&
                      descricao === descricaoAutomaticaFeriado
                    ) {
                      setDescricao("");
                    }
                    setDescricaoAutomaticaFeriado(null);
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="data-inicio-excecao"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  {tipo === "ferias" || tipo === "bloqueio"
                    ? "Data inicial"
                    : "Data"}
                </label>
                <input
                  id="data-inicio-excecao"
                  type="date"
                  value={dataInicio}
                  onBlur={() =>
                    setTocado((prev) => ({ ...prev, dataInicio: true }))
                  }
                  onChange={(e) => {
                    const dataSelecionada = e.target.value;
                    const nomeFeriado =
                      tipo === "feriado"
                        ? feriadosSet.get(dataSelecionada)
                        : undefined;
                    atualizarDescricaoPorFeriado(dataSelecionada, nomeFeriado);
                  }}
                  min={hoje}
                  className="w-full px-3 py-2 border border-[#9F64AF]/20 rounded-xl text-sm text-gray-800 bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] shadow-sm"
                  required
                />
                <CampoErro
                  mensagem={
                    tentouSalvar || tocado.dataInicio
                      ? errosVisuais.dataInicio
                      : undefined
                  }
                />
              </div>
              {(tipo === "ferias" || tipo === "bloqueio") && (
                <div>
                  <label
                    htmlFor="data-fim-excecao"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Data final
                  </label>
                  <input
                    id="data-fim-excecao"
                    type="date"
                    value={dataFim}
                    onBlur={() =>
                      setTocado((prev) => ({ ...prev, dataFim: true }))
                    }
                    onChange={(e) => setDataFim(e.target.value)}
                    min={dataInicio || hoje}
                    className="w-full px-3 py-2 border border-[#9F64AF]/20 rounded-xl text-sm text-gray-800 bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] shadow-sm"
                    required
                  />
                  <CampoErro
                    mensagem={
                      tentouSalvar || tocado.dataFim
                        ? errosVisuais.dataFim
                        : undefined
                    }
                  />
                </div>
              )}
              {tipo === "excecao" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="hora-inicio-excecao"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Início
                    </label>
                    <input
                      id="hora-inicio-excecao"
                      type="time"
                      value={horaInicio}
                      onBlur={() =>
                        setTocado((prev) => ({ ...prev, horaInicio: true }))
                      }
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-[#9F64AF]/20 rounded-xl text-sm text-gray-800 bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] shadow-sm"
                    />
                    <CampoErro
                      mensagem={
                        tentouSalvar || tocado.horaInicio
                          ? errosVisuais.horaInicio
                          : undefined
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hora-fim-excecao"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Fim
                    </label>
                    <input
                      id="hora-fim-excecao"
                      type="time"
                      value={horaFim}
                      onBlur={() =>
                        setTocado((prev) => ({ ...prev, horaFim: true }))
                      }
                      onChange={(e) => setHoraFim(e.target.value)}
                      className="w-full px-3 py-2 border border-[#9F64AF]/20 rounded-xl text-sm text-gray-800 bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] shadow-sm"
                    />
                    <CampoErro
                      mensagem={
                        tentouSalvar || tocado.horaFim
                          ? errosVisuais.horaFim
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}
              <div>
                <label
                  htmlFor="descricao-excecao"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Observação
                </label>
                <input
                  id="descricao-excecao"
                  type="text"
                  value={descricao}
                  onBlur={() =>
                    setTocado((prev) => ({ ...prev, descricao: true }))
                  }
                  onChange={(e) => {
                    setDescricao(e.target.value);
                    if (e.target.value !== descricaoAutomaticaFeriado) {
                      setDescricaoAutomaticaFeriado(null);
                    }
                  }}
                  placeholder={obterPlaceholderObservacao(tipo)}
                  className="w-full px-3 py-2 border border-[#9F64AF]/20 rounded-xl text-sm text-gray-800 bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] shadow-sm"
                />
                <CampoErro
                  mensagem={
                    tentouSalvar || tocado.descricao
                      ? errosVisuais.descricao
                      : undefined
                  }
                />
              </div>
            </div>

            {/* Mini calendário */}
            <div className="w-64 flex-shrink-0 border-l border-[#9F64AF]/15 pl-5">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={mesAnterior}
                  disabled={!podeVoltarMes}
                  className="text-lg leading-none px-2 text-gray-500 hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  ‹
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {mesCalendario.toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  type="button"
                  onClick={proximoMes}
                  className="text-gray-500 hover:text-[#9F64AF] text-lg leading-none px-2"
                >
                  ›
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {DIAS_CABECALHO.map((dia) => (
                  <div
                    key={dia.chave}
                    className="text-gray-400 font-medium py-1"
                  >
                    {dia.label}
                  </div>
                ))}
                {diasCalendario.map(({ chave, data: dataStr }) => {
                  if (dataStr === null)
                    return <div key={chave} className="py-2" />;
                  const nomeFeriado = feriadosDoMesAtual.get(dataStr);
                  const isFeriado = Boolean(nomeFeriado);
                  const isSelected = dataInicio === dataStr;
                  const isPassada = dataStr < hoje;
                  return (
                    <button
                      key={dataStr}
                      type="button"
                      title={nomeFeriado || undefined}
                      disabled={isPassada}
                      onClick={() => {
                        if (isPassada) return;
                        atualizarDescricaoPorFeriado(dataStr, nomeFeriado);
                      }}
                      className={`rounded-full py-2 text-xs font-semibold transition-all ${
                        isPassada
                          ? "cursor-not-allowed bg-gray-100 text-gray-300 opacity-70"
                          : isSelected
                            ? "bg-[#9F64AF] text-white shadow-sm"
                            : isFeriado
                              ? "bg-[#F3EAF8] text-[#7B3F8C] hover:bg-[#E1D4F0] ring-1 ring-[#9F64AF]/15"
                              : "hover:bg-[#F8F5FA] text-gray-700"
                      }`}
                    >
                      {parseInt(dataStr.split("-")[2], 10)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-xs text-gray-600">
                {obterOrientacaoTipo(tipo)}
              </p>
            </div>
          </form>
          {conflitoPeriodo ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <div className="flex items-start gap-2">
                <MdErrorOutline size={14} className="mt-0.5 shrink-0 text-amber-600" />
                <p>{conflitoPeriodo}</p>
              </div>
            </div>
          ) : null}
          {conflitoExcecao ? (
            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <div className="flex items-start gap-2">
                <MdErrorOutline size={14} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    Consultas agendadas encontradas
                  </p>
                  <p className="mt-1">{conflitoExcecao.mensagem}</p>
                  {conflitoExcecao.dias.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-rose-600">
                      {conflitoExcecao.dias.map((dia) => (
                        <li key={dia.data}>
                          {formatarResumoConflito(dia.data, dia.total)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-200/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100/70 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={Boolean(conflitoExcecao?.temConflitos) || Boolean(conflitoPeriodo)}
              className="px-4 py-2 text-sm text-white bg-[#9F64AF] rounded-xl hover:bg-[#8B509B] transition disabled:opacity-50 shadow-sm"
            >
              Adicionar
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
