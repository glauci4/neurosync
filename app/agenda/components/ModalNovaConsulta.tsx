"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarPlus,
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { usePacientePorId } from "@/hooks/usePacientePorId";
import {
  type AgendaPayload,
  useAtualizarConsulta,
  useCriarConsulta,
} from "../hooks/useAgenda";
import { dataDisponivelParaAgenda } from "../hooks/useDisponibilidadeAgenda";
import { HorariosDisponiveis } from "./HorariosDisponiveis";

interface OpcaoAgenda {
  valor: string;
  label: string;
  descricao?: string;
}

interface ValoresIniciaisConsulta {
  id?: number;
  paciente_id?: number;
  psicologo_id?: number;
  sala_id?: number;
  data_consulta?: string;
  horario_inicio?: string;
  horario_fim?: string;
  tipo_atendimento?: AgendaPayload["tipo_atendimento"];
  tipo_outro?: string | null;
  observacoes?: string | null;
}

interface ModalNovaConsultaProps {
  aberto: boolean;
  onClose: () => void;
  pacientes: OpcaoAgenda[];
  psicologos: OpcaoAgenda[];
  salas: OpcaoAgenda[];
  valoresIniciais?: ValoresIniciaisConsulta;
  modo?: "criar" | "editar" | "remarcar";
  onSuccess?: () => void;
}

interface ErrosFormulario {
  paciente_id?: string;
  psicologo_id?: string;
  sala_id?: string;
  data_consulta?: string;
  horario_disponivel?: string;
  horario_inicio?: string;
  horario_fim?: string;
  tipo_atendimento?: string;
  tipo_outro?: string;
  observacoes?: string;
  geral?: string;
}

const TIPOS_ATENDIMENTO: Array<{
  valor: AgendaPayload["tipo_atendimento"];
  label: string;
}> = [
  { valor: "triagem", label: "Triagem" },
  { valor: "psicoterapia", label: "Psicoterapia" },
  { valor: "devolutiva", label: "Devolutiva" },
  { valor: "avaliacao", label: "Avaliação" },
  { valor: "orientacao", label: "Orientação" },
  { valor: "retorno", label: "Retorno" },
  { valor: "alta", label: "Alta" },
  { valor: "outro", label: "Outro" },
];

function MensagemErro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;

  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-500">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span className="leading-5">{mensagem}</span>
    </p>
  );
}

function ComboboxConsulta({
  label,
  obrigatorio,
  valor,
  opcoes,
  placeholder,
  erro,
  onChange,
  desabilitado,
}: {
  label: string;
  obrigatorio?: boolean;
  valor?: string;
  opcoes: OpcaoAgenda[];
  placeholder: string;
  erro?: string;
  onChange: (valor: string) => void;
  desabilitado?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const selecionada = opcoes.find((opcao) => opcao.valor === valor);
  const filtradas = useMemo(
    () =>
      opcoes.filter((opcao) =>
        `${opcao.label} ${opcao.descricao || ""}`
          .toLowerCase()
          .includes(busca.toLowerCase()),
      ),
    [busca, opcoes],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        evento.stopImmediatePropagation();
        setAberto(false);
        setBusca("");
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [aberto]);

  // Fecha ao clicar fora do combobox (funciona dentro de modais)
  useEffect(() => {
    if (!aberto) return;

    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setAberto(false);
      setBusca("");
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [aberto]);

  return (
    <div ref={containerRef} data-combobox-consulta className="relative">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
        {obrigatorio && <span className="text-red-500"> *</span>}
      </span>
      <button
        type="button"
        disabled={desabilitado}
        onClick={() => !desabilitado && setAberto((atual) => !atual)}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm shadow-sm ${
          desabilitado
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
            : `bg-white/90 text-gray-700 ${erro ? "border-red-300" : "border-gray-200"}`
        }`}
      >
        <span className={selecionada && !desabilitado ? "truncate" : "truncate text-gray-400"}>
          {selecionada?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${aberto && !desabilitado ? "rotate-180" : ""}`}
        />
      </button>
      <MensagemErro mensagem={erro} />

      {aberto && (
        <div className="absolute left-0 top-full z-[10000] mt-2 w-full max-w-full rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Pesquisar..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>

          <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#9F64AF]/60">
            {filtradas.map((opcao) => {
              const selecionada = valor === opcao.valor;

              return (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => {
                    onChange(opcao.valor);
                    setAberto(false);
                    setBusca("");
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                    selecionada
                      ? "bg-[#F3EAF8] text-[#9F64AF]"
                      : "text-gray-700 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {opcao.label}
                    </span>
                    {opcao.descricao && (
                      <span
                        className={`block truncate text-xs ${
                          selecionada ? "text-[#9F64AF]/75" : "text-gray-400"
                        }`}
                      >
                        {opcao.descricao}
                      </span>
                    )}
                  </span>
                  {selecionada && (
                    <Check size={15} className="shrink-0 text-[#9F64AF]" />
                  )}
                </button>
              );
            })}

            {filtradas.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-gray-400">
                Nenhum resultado encontrado.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function horaMenor(inicio: string, fim: string) {
  return inicio && fim && inicio < fim;
}

function dataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dataISOValida(data: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const [ano, mes, dia] = data.split("-").map(Number);
  const parsed = new Date(ano, mes - 1, dia);
  return (
    parsed.getFullYear() === ano &&
    parsed.getMonth() === mes - 1 &&
    parsed.getDate() === dia
  );
}

function normalizarTextoValidacao(valor: string) {
  return valor.trim().replace(/\s+/g, " ");
}

function textoSemAcentos(valor: string) {
  return valor.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function temVogal(valor: string) {
  return /[aeiou]/i.test(textoSemAcentos(valor));
}

function temPalavraComTresOuMaisLetras(valor: string) {
  return valor.split(/\s+/).some((palavra) => palavra.length >= 3);
}

function textoDescricaoValido(valor: string, minimo: number, maximo: number) {
  const texto = normalizarTextoValidacao(valor);
  if (texto.length < minimo || texto.length > maximo) return false;
  if (/^\d+$/.test(texto)) return false;
  if (!/\p{L}/u.test(texto)) return false;
  if (!temVogal(texto)) return false;
  if (!temPalavraComTresOuMaisLetras(texto)) return false;
  return true;
}

function tipoOutroValido(valor: string) {
  return textoDescricaoValido(valor, 3, 60);
}

function observacaoValida(valor: string) {
  const texto = normalizarTextoValidacao(valor);
  if (!texto) return true;
  return textoDescricaoValido(texto, 5, 500);
}

function calcularIdadePaciente(dataNascimento?: string | null) {
  if (!dataNascimento) return null;

  const valor = dataNascimento.split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;

  const [ano, mes, dia] = valor.split("-").map(Number);
  const nascimento = new Date(ano, mes - 1, dia);
  if (
    Number.isNaN(nascimento.getTime()) ||
    nascimento.getFullYear() !== ano ||
    nascimento.getMonth() !== mes - 1 ||
    nascimento.getDate() !== dia
  ) {
    return null;
  }

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth() - nascimento.getMonth();
  if (
    mesAtual < 0 ||
    (mesAtual === 0 && hoje.getDate() < nascimento.getDate())
  ) {
    idade--;
  }

  return idade;
}

function salaEhInfantil(label?: string) {
  if (!label) return false;
  const texto = label.toLowerCase();
  return texto.includes("infantil");
}

function erroApiParaCampo(mensagem: string): ErrosFormulario {
  const texto = mensagem.toLowerCase();

  if (texto.includes("data")) return { data_consulta: mensagem };
  if (texto.includes("paciente")) return { paciente_id: mensagem };
  if (
    texto.includes("atendimento") ||
    texto.includes("fila") ||
    texto.includes("encerrado") ||
    texto.includes("inativo")
  ) {
    return { paciente_id: mensagem };
  }
  if (texto.includes("psicólogo") || texto.includes("psicologo")) {
    return { psicologo_id: mensagem };
  }
  if (texto.includes("sala")) return { sala_id: mensagem };
  if (
    texto.includes("funcionamento") ||
    texto.includes("feriado") ||
    texto.includes("bloqueio")
  ) {
    return { horario_disponivel: mensagem };
  }
  if (texto.includes("fechada") || texto.includes("histórico")) {
    return { data_consulta: "Não é possível agendar em uma data fechada" };
  }
  if (texto.includes("horário") || texto.includes("horario")) {
    return { horario_disponivel: mensagem };
  }
  if (
    texto.includes("já possui uma consulta") ||
    texto.includes("já possui consulta")
  ) {
    return {
      horario_disponivel:
        "Já existe uma consulta agendada para este paciente neste horário.",
    };
  }

  return { geral: mensagem };
}

function estadoInicial(valoresIniciais?: ValoresIniciaisConsulta) {
  return {
    paciente_id: valoresIniciais?.paciente_id
      ? String(valoresIniciais.paciente_id)
      : "",
    psicologo_id: valoresIniciais?.psicologo_id
      ? String(valoresIniciais.psicologo_id)
      : "",
    sala_id: valoresIniciais?.sala_id ? String(valoresIniciais.sala_id) : "",
    data_consulta: valoresIniciais?.data_consulta || "",
    horario_inicio: valoresIniciais?.horario_inicio || "",
    horario_fim: valoresIniciais?.horario_fim || "",
    tipo_atendimento: valoresIniciais?.tipo_atendimento || "",
    tipo_outro: valoresIniciais?.tipo_outro || "",
    observacoes: valoresIniciais?.observacoes || "",
  };
}

export default function ModalNovaConsulta({
  aberto,
  onClose,
  pacientes,
  psicologos,
  salas,
  valoresIniciais,
  modo = "criar",
  onSuccess,
}: ModalNovaConsultaProps) {
  const [montado, setMontado] = useState(false);
  const [formulario, setFormulario] = useState(estadoInicial(valoresIniciais));
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [, setCamposTocados] = useState<
    Partial<Record<keyof ErrosFormulario, boolean>>
  >({});
  const [, setTentouSalvar] = useState(false);
  const queryClient = useQueryClient();
  const criarConsulta = useCriarConsulta();
  const atualizarConsulta = useAtualizarConsulta();
  const salvando = criarConsulta.isPending || atualizarConsulta.isPending;
  const pacienteSelecionadoId = formulario.paciente_id
    ? Number(formulario.paciente_id)
    : null;
  const psicologoSelecionadoId = formulario.psicologo_id
    ? Number(formulario.psicologo_id)
    : null;
  const {
    data: pacienteSelecionado,
    isLoading: pacienteSelecionadoCarregando,
  } = usePacientePorId(pacienteSelecionadoId);
  const avisoPrimeiraConsultaRef = useRef<number | null>(null);
  const selecaoInicialToastRef = useRef<string | null>(null);
  const avisoSalaInfantilRef = useRef<string | null>(null);
  const pacienteTemResponsavel = Boolean(
    pacienteSelecionado?.psicologo_responsavel_id,
  );
  const responsavelIdAtual = pacienteSelecionado?.psicologo_responsavel_id
    ? Number(pacienteSelecionado.psicologo_responsavel_id)
    : null;
  const avisoResponsavelDiferente =
    Boolean(pacienteSelecionadoId) &&
    Boolean(psicologoSelecionadoId) &&
    pacienteTemResponsavel &&
    responsavelIdAtual !== psicologoSelecionadoId;
  const idadePaciente = calcularIdadePaciente(
    pacienteSelecionado?.data_nascimento,
  );
  const salaSelecionada = salas.find(
    (opcao) => opcao.valor === formulario.sala_id,
  );
  const titulo =
    modo === "editar"
      ? "Editar consulta"
      : modo === "remarcar"
        ? "Remarcar consulta"
        : "Nova consulta";
  const descricao =
    modo === "remarcar"
      ? "Atualize data e horário mantendo o histórico operacional da consulta."
      : "Agende um atendimento respeitando disponibilidade, funcionamento e histórico diário.";
  const dataConsultaValidaParaDisponibilidade = dataDisponivelParaAgenda(
    formulario.data_consulta,
  );

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    setFormulario(estadoInicial(valoresIniciais));
    setErros({});
    setCamposTocados({});
    setTentouSalvar(false);
  }, [aberto, valoresIniciais]);

  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, onClose]);

  useEffect(() => {
    if (!aberto) {
      avisoPrimeiraConsultaRef.current = null;
      selecaoInicialToastRef.current = null;
      avisoSalaInfantilRef.current = null;
      return;
    }

    if (!pacienteSelecionadoId || pacienteTemResponsavel) {
      avisoPrimeiraConsultaRef.current = null;
      return;
    }

    const selecaoAtual = `${pacienteSelecionadoId}:${psicologoSelecionadoId || ""}`;

    if (selecaoInicialToastRef.current === null) {
      selecaoInicialToastRef.current = selecaoAtual;
      return;
    }

    if (!psicologoSelecionadoId) return;

    if (selecaoInicialToastRef.current === selecaoAtual) return;
    if (avisoPrimeiraConsultaRef.current === pacienteSelecionadoId) return;

    avisoPrimeiraConsultaRef.current = pacienteSelecionadoId;
    toast.custom(
      (id) => (
        <div className="flex w-full max-w-sm items-start gap-2 rounded-2xl border border-[#E5D9F3] bg-[#F6F0FA] px-4 py-3 text-[#2F2436] shadow-lg shadow-[#9F64AF]/10">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#9F64AF]" />
          <p className="text-sm leading-5">
            Este paciente ainda não possui responsável definido. O profissional
            selecionado será vinculado ao acompanhamento.
          </p>
          <button
            type="button"
            onClick={() => toast.dismiss(id)}
            className="ml-auto rounded-full p-1 text-[#9F64AF] transition hover:bg-[#EDE0F5]"
            aria-label="Fechar aviso"
          >
            <X size={14} />
          </button>
        </div>
      ),
      { duration: 5000 },
    );
  }, [
    aberto,
    pacienteSelecionadoId,
    pacienteTemResponsavel,
    psicologoSelecionadoId,
  ]);

  useEffect(() => {
    if (!aberto) return;

    if (
      !pacienteSelecionadoId ||
      !psicologoSelecionadoId ||
      typeof idadePaciente !== "number" ||
      idadePaciente > 12
    ) {
      avisoSalaInfantilRef.current = null;
      return;
    }

    if (salaEhInfantil(salaSelecionada?.label)) {
      avisoSalaInfantilRef.current = null;
      return;
    }

    const chaveAviso = `${pacienteSelecionadoId}:${psicologoSelecionadoId}:${formulario.sala_id || ""}`;
    if (avisoSalaInfantilRef.current === chaveAviso) return;

    avisoSalaInfantilRef.current = chaveAviso;
    toast.custom(
      (id) => (
        <div className="flex w-full max-w-sm items-start gap-2 rounded-2xl border border-[#E5D9F3] bg-[#F6F0FA] px-4 py-3 text-[#2F2436] shadow-lg shadow-[#9F64AF]/10">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#9F64AF]" />
          <p className="text-sm leading-5">
            Este paciente está na faixa etária infantil. Sempre que possível,
            priorize o atendimento em uma Sala Infantil.
          </p>
          <button
            type="button"
            onClick={() => toast.dismiss(id)}
            className="ml-auto rounded-full p-1 text-[#9F64AF] transition hover:bg-[#EDE0F5]"
            aria-label="Fechar aviso"
          >
            <X size={14} />
          </button>
        </div>
      ),
      { duration: 5000 },
    );
  }, [
    aberto,
    idadePaciente,
    pacienteSelecionadoId,
    psicologoSelecionadoId,
    salaSelecionada?.label,
    formulario.sala_id,
  ]);

  useEffect(() => {
    if (!aberto || modo !== "criar") return;
    if (!pacienteSelecionadoId || pacienteSelecionadoCarregando) return;
    if (!pacienteSelecionado) return;

    const responsavelId = pacienteSelecionado.psicologo_responsavel_id
      ? String(pacienteSelecionado.psicologo_responsavel_id)
      : "";

    setFormulario((atual) =>
      atual.psicologo_id === responsavelId
        ? atual
        : { ...atual, psicologo_id: responsavelId },
    );
    setErros((atual) => ({ ...atual, psicologo_id: undefined }));
  }, [
    aberto,
    modo,
    pacienteSelecionado,
    pacienteSelecionadoCarregando,
    pacienteSelecionadoId,
  ]);

  if (!aberto || !montado) return null;

  const atualizarCampo = (campo: keyof typeof formulario, valor: string) => {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined, geral: undefined }));

    if (
      campo === "data_consulta" ||
      campo === "psicologo_id" ||
      campo === "sala_id"
    ) {
      setFormulario((atual) => ({
        ...atual,
        horario_inicio: "",
        horario_fim: "",
      }));
      setErros((atuais) => ({
        ...atuais,
        horario_inicio: undefined,
        horario_fim: undefined,
        horario_disponivel: undefined,
      }));
    }
  };

  const marcarCampoTocado = (campo: keyof ErrosFormulario) => {
    setCamposTocados((atuais) => ({ ...atuais, [campo]: true }));
  };

  const validarCampoAoSair = (campo: keyof ErrosFormulario) => {
    marcarCampoTocado(campo);

    setErros((atuais) => {
      const proximos = { ...atuais, [campo]: undefined, geral: undefined };

      if (campo === "data_consulta" && formulario.data_consulta) {
        if (!dataISOValida(formulario.data_consulta)) {
          proximos.data_consulta = "Data inválida";
        } else if (formulario.data_consulta < dataHojeISO()) {
          proximos.data_consulta =
            "Não é possível agendar consulta em data passada.";
        }
      }

      if (campo === "tipo_outro" && formulario.tipo_atendimento === "outro") {
        if (!tipoOutroValido(formulario.tipo_outro)) {
          proximos.tipo_outro = "Informe um tipo de atendimento válido.";
        }
      }

      if (campo === "observacoes" && formulario.observacoes.trim()) {
        if (!observacaoValida(formulario.observacoes)) {
          proximos.observacoes =
            "Informe uma observação válida ou deixe o campo em branco.";
        }
      }

      if (
        (campo === "horario_inicio" || campo === "horario_fim") &&
        formulario.horario_inicio &&
        formulario.horario_fim &&
        !horaMenor(formulario.horario_inicio, formulario.horario_fim)
      ) {
        proximos.horario_fim =
          "Horário final deve ser maior que o horário inicial";
      }

      return proximos;
    });
  };

  const validar = () => {
    setTentouSalvar(true);
    const novosErros: ErrosFormulario = {};
    const hoje = dataHojeISO();
    const dataValidaParaHorario =
      Boolean(formulario.data_consulta) &&
      dataISOValida(formulario.data_consulta) &&
      formulario.data_consulta >= hoje;

    if (!formulario.paciente_id)
      novosErros.paciente_id = "Paciente é obrigatório";
    if (!formulario.psicologo_id) {
      novosErros.psicologo_id = "Psicólogo(a) é obrigatório(a)";
    }
    if (!formulario.sala_id) novosErros.sala_id = "Sala é obrigatória";
    if (!formulario.data_consulta) {
      novosErros.data_consulta = "Data é obrigatória";
    } else if (!dataISOValida(formulario.data_consulta)) {
      novosErros.data_consulta = "Data inválida";
    } else if (formulario.data_consulta < hoje) {
      novosErros.data_consulta =
        "Não é possível agendar consulta em data passada.";
    }
    if (
      dataValidaParaHorario &&
      (!formulario.horario_inicio || !formulario.horario_fim)
    ) {
      novosErros.horario_disponivel = "Selecione um horário disponível.";
    } else if (
      dataValidaParaHorario &&
      !horaMenor(formulario.horario_inicio, formulario.horario_fim)
    ) {
      novosErros.horario_disponivel = "Selecione um horário disponível.";
    }
    if (!formulario.tipo_atendimento) {
      novosErros.tipo_atendimento = "Tipo de atendimento é obrigatório";
    }
    if (
      formulario.tipo_atendimento === "outro" &&
      !tipoOutroValido(formulario.tipo_outro)
    ) {
      novosErros.tipo_outro = "Informe um tipo de atendimento válido.";
    }
    if (!observacaoValida(formulario.observacoes)) {
      novosErros.observacoes =
        "Informe uma observação válida ou deixe o campo em branco.";
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!validar()) return;

    try {
      const payload: AgendaPayload = {
        paciente_id: Number(formulario.paciente_id),
        psicologo_id: Number(formulario.psicologo_id),
        sala_id: Number(formulario.sala_id),
        data_consulta: formulario.data_consulta,
        horario_inicio: formulario.horario_inicio,
        horario_fim: formulario.horario_fim,
        tipo_atendimento:
          formulario.tipo_atendimento as AgendaPayload["tipo_atendimento"],
        tipo_outro:
          formulario.tipo_atendimento === "outro"
            ? formulario.tipo_outro.trim()
            : null,
        observacoes: formulario.observacoes.trim() || null,
        status: modo === "remarcar" ? "remarcado" : undefined,
        definir_responsavel: !pacienteTemResponsavel ? true : undefined,
      };

      if (modo === "criar") {
        await criarConsulta.mutateAsync(payload);
      } else if (valoresIniciais?.id) {
        await atualizarConsulta.mutateAsync({
          id: valoresIniciais.id,
          dados: payload,
        });
      }

      // A mutation invalida a query da Agenda; o toast dá retorno imediato sem
      // duplicar requests no componente.
      toast.success(
        modo === "remarcar"
          ? "Consulta remarcada"
          : modo === "editar"
            ? "Consulta atualizada"
            : "Consulta agendada com sucesso",
      );
      if (pacienteSelecionadoId) {
        await queryClient.invalidateQueries({
          queryKey: ["paciente", pacienteSelecionadoId],
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao salvar consulta";
      setErros(erroApiParaCampo(mensagem));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.2 }}
        className="relative max-h-[92vh] w-full max-w-3xl overflow-x-hidden overflow-y-auto rounded-2xl border border-[#9F64AF]/15 bg-white p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Fechar modal"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#9F64AF]">
            <CalendarPlus size={22} />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{titulo}</h2>
            <p className="mt-1 text-sm text-gray-500">{descricao}</p>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <ComboboxConsulta
              label="Paciente"
              obrigatorio
              valor={formulario.paciente_id}
              opcoes={pacientes}
              placeholder="Selecione o paciente"
              erro={erros.paciente_id}
              onChange={(valor) => atualizarCampo("paciente_id", valor)}
            />
            <ComboboxConsulta
              label="Psicólogo(a)"
              obrigatorio
              valor={formulario.psicologo_id}
              opcoes={psicologos}
              placeholder="Selecione o(a) psicólogo(a)"
              erro={erros.psicologo_id}
              onChange={(valor) => atualizarCampo("psicologo_id", valor)}
              desabilitado={pacienteTemResponsavel && modo === "criar"}
            />
            <ComboboxConsulta
              label="Sala"
              obrigatorio
              valor={formulario.sala_id}
              opcoes={salas}
              placeholder="Selecione a sala"
              erro={erros.sala_id}
              onChange={(valor) => atualizarCampo("sala_id", valor)}
            />
          </div>

          {pacienteSelecionadoCarregando &&
            pacienteSelecionadoId &&
            psicologoSelecionadoId && (
              <div className="rounded-2xl border border-[#9F64AF]/20 bg-[#F3EAF8] px-4 py-3 text-sm text-[#6F4E7A]">
                Carregando acompanhamento clínico do paciente...
              </div>
            )}

          {avisoResponsavelDiferente && pacienteSelecionado && (
            <div className="rounded-2xl border border-[#E5D9F3] bg-[#FAF7FC] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#9F64AF] shadow-sm">
                  <AlertCircle size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    Este paciente possui outro psicólogo responsável.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    O agendamento seguirá normalmente sem alterar o vínculo
                    clínico atual.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="agenda-data-consulta"
                className="mb-1.5 block text-xs font-semibold text-gray-600"
              >
                Data <span className="text-red-500">*</span>
              </label>
              <input
                id="agenda-data-consulta"
                type="date"
                value={formulario.data_consulta}
                onChange={(evento) =>
                  atualizarCampo("data_consulta", evento.target.value)
                }
                onBlur={() => validarCampoAoSair("data_consulta")}
                className={`h-11 w-full rounded-xl border bg-white/90 px-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[#9F64AF]/70 ${
                  erros.data_consulta ? "border-red-300" : "border-gray-200"
                }`}
              />
              <MensagemErro mensagem={erros.data_consulta} />
            </div>
          </div>

          <div
            id="horarios-disponiveis-bloco"
            className="rounded-2xl border border-[#E5D9F3] bg-[#F8F4FB] p-4"
          >
            <HorariosDisponiveis
              psicologoId={formulario.psicologo_id}
              salaId={formulario.sala_id}
              data={formulario.data_consulta}
              dataValidaParaConsulta={dataConsultaValidaParaDisponibilidade}
              consultaId={valoresIniciais?.id}
              valorSelecionado={formulario.horario_inicio || null}
              onLimparHorario={() => {
                setFormulario((atual) => ({
                  ...atual,
                  horario_inicio: "",
                  horario_fim: "",
                }));
                setErros((atual) => ({
                  ...atual,
                  horario_inicio: undefined,
                  horario_fim: undefined,
                  horario_disponivel: undefined,
                }));
              }}
              erro={
                erros.horario_disponivel ||
                erros.horario_inicio ||
                erros.horario_fim
              }
              onSelecionar={(horario) => {
                setFormulario((atual) => ({
                  ...atual,
                  horario_inicio: horario.inicio,
                  horario_fim: horario.fim,
                }));
                setErros((atual) => ({
                  ...atual,
                  horario_inicio: undefined,
                  horario_fim: undefined,
                  horario_disponivel: undefined,
                }));
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ComboboxConsulta
              label="Tipo de atendimento"
              obrigatorio
              valor={formulario.tipo_atendimento}
              opcoes={TIPOS_ATENDIMENTO}
              placeholder="Selecione o tipo"
              erro={erros.tipo_atendimento}
              onChange={(valor) => atualizarCampo("tipo_atendimento", valor)}
            />

            {formulario.tipo_atendimento === "outro" && (
              <div>
                <label
                  htmlFor="agenda-tipo-outro"
                  className="mb-1.5 block text-xs font-semibold text-gray-600"
                >
                  Outro tipo <span className="text-red-500">*</span>
                </label>
                <input
                  id="agenda-tipo-outro"
                  value={formulario.tipo_outro}
                  onChange={(evento) =>
                    atualizarCampo("tipo_outro", evento.target.value)
                  }
                  onBlur={() => validarCampoAoSair("tipo_outro")}
                  placeholder="Descreva o tipo de atendimento"
                  className={`h-11 w-full rounded-xl border bg-white/90 px-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[#9F64AF]/70 ${
                    erros.tipo_outro ? "border-red-300" : "border-gray-200"
                  }`}
                />
                <MensagemErro mensagem={erros.tipo_outro} />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="agenda-observacoes"
              className="mb-1.5 block text-xs font-semibold text-gray-600"
            >
              Observações
            </label>
            <textarea
              id="agenda-observacoes"
              value={formulario.observacoes}
              onChange={(evento) =>
                atualizarCampo("observacoes", evento.target.value)
              }
              onBlur={() => validarCampoAoSair("observacoes")}
              placeholder="Observações internas sobre a consulta"
              rows={3}
              className={`w-full resize-none rounded-xl border bg-white/90 px-3 py-2 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[#9F64AF]/70 ${
                erros.observacoes ? "border-red-300" : "border-gray-200"
              }`}
            />
            <MensagemErro mensagem={erros.observacoes} />
          </div>

          <MensagemErro mensagem={erros.geral} />

          <div className="flex flex-col-reverse gap-3 border-gray-100 border-t pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || pacienteSelecionadoCarregando}
              className="rounded-xl bg-[#9F64AF] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Agendar consulta"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body,
  );
}
