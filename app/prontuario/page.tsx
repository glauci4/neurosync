"use client";

import Highlight from "@tiptap/extension-highlight";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapUnderline from "@tiptap/extension-underline";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Bold,
  BrushCleaning,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Eraser,
  FileCheck,
  FilePenLine,
  FileText,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  PencilLine,
  PenLine,
  Redo2,
  Search,
  ShieldCheck,
  Signature,
  SlidersHorizontal,
  Underline as UnderlineIcon,
  Undo2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdErrorOutline } from "react-icons/md";
import { toast } from "sonner";
import { useSidebar } from "@/app/context/SidebarContext";
import Sidebar from "@/app/inicio/components/Sidebar";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import { useListarPacientes } from "@/hooks/useListarPacientes";
import { FiltrosProntuario } from "./components/FiltrosProntuario";
import { ResumoProntuario } from "./components/ResumoProntuario";
import {
  ModalVisualizarRegistroClinico,
  TimelineRegistros,
} from "./components/TimelineRegistros";
import { gerarRegistroClinicoPdf } from "./pdf/gerarRegistroClinicoPdf";
import { imprimirRegistroClinico } from "./print/imprimirRegistroClinico";
import {
  type RegistroClinico,
  type RegistroClinicoPayload,
  type StatusProntuario,
  type TipoAtendimentoProntuario,
  useAssinarEvolucao,
  useAtualizarEvolucao,
  useConsultasPacienteProntuario,
  useCriarEvolucao,
  useFinalizarEvolucao,
  useProntuarios,
} from "./hooks/useProntuario";

interface PacienteOpcao {
  id: number;
  nome: string;
  idade?: number;
  ativo?: boolean;
  status_atendimento?: string;
}

interface ErrosEvolucao {
  paciente_id?: string;
  data_registro?: string;
  tipo_atendimento?: string;
  consulta_id?: string;
  conteudo?: string;
  geral?: string;
}

interface OpcaoFiltro {
  valor: string;
  label: string;
  descricao?: string;
}

interface EstadoFiltrosProntuario {
  paciente_id?: number;
  psicologo_id?: number;
  status?: string;
  status_paciente?: "ativo" | "inativo";
  periodo?: string;
  tipo_atendimento?: string;
}

const TIPOS_ATENDIMENTO: Array<{
  valor: TipoAtendimentoProntuario;
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

const STATUS_CONSULTA_PRONTUARIO_BLOQUEADO = [
  "cancelado",
  "cancelada",
  "falta",
  "excluido",
  "excluida",
];

const STATUS_CONSULTA_PRONTUARIO_INICIADO = [
  "em_andamento",
  "iniciado",
  "iniciada",
  "concluido",
  "concluida",
  "realizado",
  "realizada",
];

const STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL = [
  "agendado",
  "agendada",
  "remarcado",
  "remarcada",
  "pendente",
];

function consultaJaPassou(consulta: {
  data_consulta: string;
  horario_fim: string;
}) {
  const data = obterDiaISO(consulta.data_consulta);
  const fim = new Date(`${data}T${consulta.horario_fim?.slice(0, 5)}`);

  if (Number.isNaN(fim.getTime())) {
    return false;
  }

  return new Date() > fim;
}

function consultaEstaNoHorarioAtual(consulta: {
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
}) {
  const data = obterDiaISO(consulta.data_consulta);
  const inicio = new Date(`${data}T${consulta.horario_inicio?.slice(0, 5)}`);
  const fim = new Date(`${data}T${consulta.horario_fim?.slice(0, 5)}`);
  const agora = new Date();

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return false;
  }

  return agora >= inicio && agora <= fim;
}

function consultaSelecionavelProntuario(consulta: { status: string }) {
  const status = consulta.status.trim().toLowerCase();
  return !STATUS_CONSULTA_PRONTUARIO_BLOQUEADO.includes(status);
}

function consultaPermiteRegistroProntuario(consulta: {
  status: string;
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
}) {
  const status = consulta.status.trim().toLowerCase();
  if (STATUS_CONSULTA_PRONTUARIO_INICIADO.includes(status)) return true;
  return (
    STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL.includes(status) &&
    consultaEstaNoHorarioAtual(consulta)
  );
}

function toastProntuarioInfo(mensagem: string) {
  toast.custom(
    (id) => (
      <div className="flex w-full max-w-sm items-start gap-2 rounded-2xl border border-[#E5D9F3] bg-[#F6F0FA] px-4 py-3 text-[#2F2436] shadow-lg shadow-[#9F64AF]/10">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#9F64AF]" />
        <p className="text-sm leading-5">{mensagem}</p>
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
}

const STATUS_CONFIG: Record<
  StatusProntuario,
  { label: string; classe: string; icone: typeof FileText }
> = {
  // Badges de status diferenciam rascunho, finalização e assinatura clínica.
  rascunho: {
    label: "Rascunho",
    classe: "border-amber-100 bg-amber-50 text-amber-700",
    icone: PencilLine,
  },
  finalizado: {
    label: "Finalizado",
    classe: "border-[#D9BCE8] bg-[#F3EAF8] text-[#5F2D6D]",
    icone: FileCheck,
  },
  assinado: {
    label: "Assinado",
    classe: "border-emerald-100 bg-emerald-50 text-emerald-700",
    icone: ShieldCheck,
  },
};

const STATUS_OPCOES: OpcaoFiltro[] = [
  { valor: "rascunho", label: "Rascunho" },
  { valor: "finalizado", label: "Finalizado" },
  { valor: "assinado", label: "Assinado" },
];

const PERIODO_OPCOES: OpcaoFiltro[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "semana", label: "Esta semana" },
  { valor: "mes", label: "Este mês" },
];

const STATUS_PACIENTE_OPCOES: OpcaoFiltro[] = [
  { valor: "ativo", label: "Pacientes ativos" },
  { valor: "inativo", label: "Pacientes inativos" },
];

function dataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(data?: string | null) {
  if (!data) return "-";
  const date = new Date(`${String(data).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(data);
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatarDataHora(data?: string | null) {
  if (!data) return "-";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return String(data);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatarDataHoraEdicao(data?: string | null) {
  if (!data) return "-";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return String(data);
  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const horaFormatada = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dataFormatada} às ${horaFormatada}`;
}

function formatarDataClinica(data?: string | null) {
  if (!data) return "-";
  const date = new Date(`${String(data).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(data);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatarHoraClinica(data?: string | null) {
  if (!data) return "";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function obterDiaISO(data?: string | null) {
  return data ? String(data).slice(0, 10) : "";
}

function dentroDoPeriodo(data: string, periodo?: string) {
  if (!periodo) return true;
  const alvo = new Date(`${data}T00:00:00`);
  const hoje = new Date(`${dataHojeISO()}T00:00:00`);
  if (Number.isNaN(alvo.getTime())) return true;

  if (periodo === "hoje") return data === dataHojeISO();

  if (periodo === "semana") {
    const inicio = new Date(hoje);
    const diaSemana = (inicio.getDay() + 6) % 7;
    inicio.setDate(inicio.getDate() - diaSemana);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    return alvo >= inicio && alvo <= fim;
  }

  if (periodo === "mes") {
    return (
      alvo.getFullYear() === hoje.getFullYear() &&
      alvo.getMonth() === hoje.getMonth()
    );
  }

  return true;
}

function tipoAtendimentoLabel(tipo: TipoAtendimentoProntuario) {
  return TIPOS_ATENDIMENTO.find((opcao) => opcao.valor === tipo)?.label || tipo;
}

function MensagemErro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;

  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
      <MdErrorOutline size={14} />
      {mensagem}
    </p>
  );
}

function limparTextoRegistroClinico(conteudo: string) {
  return conteudo
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function validarConteudoRegistroClinico(conteudo: string) {
  const texto = limparTextoRegistroClinico(conteudo);
  if (!texto) return "Descreva o registro clínico antes de continuar.";

  const letras = texto.match(/\p{L}/gu) || [];
  const numeros = texto.match(/\d/g) || [];
  const palavras = texto.toLowerCase().match(/\p{L}{3,}/gu) || [];
  const palavrasUnicas = new Set(palavras);

  if (texto.length < 30 || letras.length < 20) {
    return "O registro clínico deve conter uma descrição válida.";
  }

  if (/^[\d\W_]+$/u.test(texto) || numeros.length > letras.length * 0.35) {
    return "O registro clínico deve conter uma descrição válida.";
  }

  if (
    /(.)\1{4,}/iu.test(texto) ||
    /[bcdfghjklmnpqrstvwxyzç]{6,}/iu.test(texto) ||
    (palavras.length > 2 && palavrasUnicas.size / palavras.length < 0.35) ||
    (palavras.length <= 2 && texto.length < 60)
  ) {
    return "Evite preencher o registro com caracteres aleatórios.";
  }

  return undefined;
}

function OpcaoFiltroProntuario({
  label,
  descricao,
  selecionada,
  onClick,
}: {
  label: string;
  descricao?: string;
  selecionada: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
        selecionada
          ? "bg-[#F3EAF8] text-[#9F64AF]"
          : "text-gray-700 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{label}</span>
        {descricao && (
          <span
            className={`block truncate text-xs ${
              selecionada ? "text-[#9F64AF]/75" : "text-gray-400"
            }`}
          >
            {descricao}
          </span>
        )}
      </span>
      {selecionada && <Check size={15} className="shrink-0 text-[#9F64AF]" />}
    </button>
  );
}

function ComboboxClinico({
  label,
  valor,
  opcoes,
  placeholder,
  erro,
  disabled,
  onChange,
}: {
  label: string;
  valor?: string;
  opcoes: OpcaoFiltro[];
  placeholder: string;
  erro?: string;
  disabled?: boolean;
  onChange: (valor?: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const botaoRef = useRef<HTMLButtonElement | null>(null);
  const [posicaoLista, setPosicaoLista] = useState({
    abrirParaCima: false,
    maxHeight: 224,
  });
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

  useEffect(() => {
    if (!aberto) return;

    const atualizarPosicao = () => {
      const botao = botaoRef.current;
      if (!botao) return;

      const rect = botao.getBoundingClientRect();
      const modal = botao.closest("[data-prontuario-modal]");
      const modalRect = modal?.getBoundingClientRect();
      const limiteSuperior = modalRect?.top ?? 0;
      const limiteInferior = modalRect?.bottom ?? window.innerHeight;
      const espacoAbaixo = Math.max(0, limiteInferior - rect.bottom - 12);
      const espacoAcima = Math.max(0, rect.top - limiteSuperior - 12);
      const abrirParaCima = espacoAbaixo < 180 && espacoAcima > espacoAbaixo;
      const espacoDisponivel = abrirParaCima ? espacoAcima : espacoAbaixo;

      setPosicaoLista({
        abrirParaCima,
        maxHeight: Math.max(120, Math.min(224, espacoDisponivel - 60)),
      });
    };

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAberto(false);
        setBusca("");
      }
    };

    atualizarPosicao();
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", atualizarPosicao);
    window.addEventListener("scroll", atualizarPosicao, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao, true);
    };
  }, [aberto]);

  const selecionar = (novoValor?: string) => {
    onChange(novoValor);
    setAberto(false);
    setBusca("");
  };

  return (
    <div className="relative">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
      </span>
      <button
        ref={botaoRef}
        type="button"
        disabled={disabled}
        onClick={() => setAberto((atual) => !atual)}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-xl border bg-white/90 px-3 text-left text-sm shadow-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
          erro ? "border-red-300" : "border-gray-200 hover:border-[#9F64AF]/50"
        }`}
      >
        <span
          className={selecionada ? "truncate text-gray-700" : "text-gray-400"}
        >
          {selecionada?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <div
          className={`absolute left-0 z-[10020] w-full overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white p-2 shadow-xl ${
            posicaoLista.abrirParaCima ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Pesquisar..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>
          <div
            className="agenda-filtro-scroll overflow-y-auto pr-1"
            style={{ maxHeight: posicaoLista.maxHeight }}
          >
            <OpcaoFiltroProntuario
              label="Nenhuma"
              selecionada={!valor}
              onClick={() => selecionar(undefined)}
            />
            {filtradas.map((opcao) => (
              <OpcaoFiltroProntuario
                key={opcao.valor}
                label={opcao.label}
                descricao={opcao.descricao}
                selecionada={valor === opcao.valor}
                onClick={() => selecionar(opcao.valor)}
              />
            ))}
          </div>
        </div>
      )}
      <style jsx global>{`
        .agenda-filtro-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(159, 100, 175, 0.45) transparent;
        }
        .agenda-filtro-scroll::-webkit-scrollbar {
          width: 7px;
        }
        .agenda-filtro-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .agenda-filtro-scroll::-webkit-scrollbar-thumb {
          background: rgba(159, 100, 175, 0.35);
          border-radius: 999px;
        }
        .agenda-filtro-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(159, 100, 175, 0.55);
        }
      `}</style>
      <MensagemErro mensagem={erro} />
    </div>
  );
}

function ModalEvolucao({
  aberto,
  pacientes,
  evolucoes,
  evolucao,
  onClose,
}: {
  aberto: boolean;
  pacientes: PacienteOpcao[];
  evolucoes: RegistroClinico[];
  evolucao?: RegistroClinico | null;
  onClose: () => void;
}) {
  const [montado, setMontado] = useState(false);
  const [registroAberto, setRegistroAberto] = useState(false);
  const [confirmarFinalizacao, setConfirmarFinalizacao] = useState(false);
  const [formulario, setFormulario] = useState({
    paciente_id: "",
    consulta_id: "",
    data_registro: "",
    tipo_atendimento: "" as TipoAtendimentoProntuario | "",
    conteudo: "",
  });
  const [erros, setErros] = useState<ErrosEvolucao>({});
  const [versaoToolbar, setVersaoToolbar] = useState(0);
  const criarEvolucao = useCriarEvolucao();
  const atualizarEvolucao = useAtualizarEvolucao();
  const pacienteIdSelecionado = Number(formulario.paciente_id || 0);
  const { data: consultasData, isLoading: carregandoConsultas } =
    useConsultasPacienteProntuario(pacienteIdSelecionado || undefined);
  const salvando = criarEvolucao.isPending || atualizarEvolucao.isPending;
  const editando = Boolean(evolucao?.id);
  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapUnderline,
      Highlight.configure({ multicolor: true }),
    ],
    content: formulario.conteudo || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[520px] px-4 py-4 text-sm leading-7 text-gray-700 outline-none prose prose-sm max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      atualizarCampo("conteudo", editor.getHTML());
    },
  });
  void versaoToolbar;

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    setRegistroAberto(Boolean(evolucao?.id));
    setConfirmarFinalizacao(false);
    setErros({});
    setFormulario({
      paciente_id: evolucao?.paciente_id ? String(evolucao.paciente_id) : "",
      consulta_id: evolucao?.consulta_id ? String(evolucao.consulta_id) : "",
      data_registro: evolucao?.data_registro?.slice(0, 10) || "",
      tipo_atendimento: evolucao?.tipo_atendimento || "",
      conteudo: evolucao?.conteudo || "",
    });
  }, [aberto, evolucao]);

  useEffect(() => {
    if (!aberto || !editor) return;
    editor.commands.setContent(evolucao?.conteudo || "");
  }, [aberto, editor, evolucao?.conteudo]);

  useEffect(() => {
    if (!editor) return;
    const atualizarToolbar = () => setVersaoToolbar((atual) => atual + 1);

    editor.on("selectionUpdate", atualizarToolbar);
    editor.on("transaction", atualizarToolbar);
    return () => {
      editor.off("selectionUpdate", atualizarToolbar);
      editor.off("transaction", atualizarToolbar);
    };
  }, [editor]);

  useEffect(() => {
    if (!aberto) return;
    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, onClose]);

  const consultas = useMemo(
    () =>
      (consultasData?.data || [])
        .filter((consulta) => consultaSelecionavelProntuario(consulta))
        .sort((a, b) =>
          `${b.data_consulta}T${b.horario_inicio}`.localeCompare(
            `${a.data_consulta}T${a.horario_inicio}`,
          ),
        ),
    [consultasData?.data],
  );
  const pacienteSelecionado = pacientes.find(
    (paciente) => paciente.id === pacienteIdSelecionado,
  );
  const consultaSelecionada = consultas.find(
    (consulta) => String(consulta.id) === formulario.consulta_id,
  );
  const ultimaConsulta = consultas[0];
  const atualizarCampo = (campo: keyof typeof formulario, valor: string) => {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined, geral: undefined }));
  };

  const selecionarPaciente = (valor?: string) => {
    setFormulario((atual) => ({
      ...atual,
      paciente_id: valor || "",
      consulta_id: "",
      data_registro: "",
      tipo_atendimento: "",
    }));
    setErros((atuais) => ({
      ...atuais,
      paciente_id: undefined,
      consulta_id: undefined,
      geral: undefined,
    }));
  };

  const selecionarConsulta = (valor?: string) => {
    const consulta = consultas.find((item) => String(item.id) === valor);
    if (consulta) {
      const status = consulta.status.trim().toLowerCase();
      if (
        STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL.includes(status) &&
        consultaJaPassou(consulta)
      ) {
        toastProntuarioInfo(
          "O horário desta consulta já passou. Marque a consulta como concluída para registrar o prontuário.",
        );
      }
    }
    setFormulario((atual) => ({
      ...atual,
      consulta_id: valor || "",
      data_registro: consulta?.data_consulta || "",
      tipo_atendimento: consulta?.tipo_atendimento || "",
    }));
    setErros((atuais) => ({
      ...atuais,
      consulta_id: undefined,
      data_registro: undefined,
      tipo_atendimento: undefined,
      geral: undefined,
    }));
  };

  const validar = (
    finalizar: boolean,
    opcoes: {
      validarConteudo?: boolean;
      validarPermissaoConsulta?: boolean;
    } = {},
  ) => {
    const validarConteudo = opcoes.validarConteudo ?? true;
    const validarPermissaoConsulta = opcoes.validarPermissaoConsulta ?? true;
    const novosErros: ErrosEvolucao = {};
    if (!formulario.paciente_id) {
      novosErros.paciente_id = "Paciente é obrigatório";
    }
    if (!formulario.data_registro) {
      novosErros.data_registro = "Data é obrigatória";
    }
    if (!formulario.consulta_id) {
      novosErros.consulta_id =
        "Selecione uma consulta vinculada para criar o registro clínico.";
    }
    if (formulario.consulta_id && !formulario.tipo_atendimento) {
      novosErros.tipo_atendimento =
        "Tipo de atendimento não encontrado na consulta vinculada.";
    }
    if (
      formulario.consulta_id &&
      !consultas.some(
        (consulta) => String(consulta.id) === formulario.consulta_id,
      )
    ) {
      novosErros.consulta_id = "Consulta vinculada inválida";
    }
    if (validarConteudo) {
      const erroConteudo = validarConteudoRegistroClinico(
        editor?.getText() || formulario.conteudo,
      );
      if (erroConteudo) {
        novosErros.conteudo = erroConteudo;
      }
    }
    const consultaVinculavelSelecionada = Boolean(consultaSelecionada);
    if (pacienteSelecionado?.ativo === false) {
      novosErros.paciente_id = "Paciente não encontrado ou inativo";
    }
    if (pacienteSelecionado && !consultaVinculavelSelecionada) {
      novosErros.consulta_id =
        "Selecione uma consulta vinculada válida para criar o registro clínico.";
      if (!formulario.consulta_id) {
        novosErros.consulta_id =
          "Selecione uma consulta vinculada para criar o registro clínico.";
      }
    }
    if (
      validarPermissaoConsulta &&
      consultaSelecionada &&
      !consultaPermiteRegistroProntuario(consultaSelecionada)
    ) {
      novosErros.consulta_id =
        "Marque a consulta como concluída para registrar o prontuário.";
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const continuarParaRegistro = () => {
    const formularioValido = validar(false, {
      validarConteudo: false,
      validarPermissaoConsulta: false,
    });
    if (!formularioValido) return;

    if (
      consultaSelecionada &&
      !consultaPermiteRegistroProntuario(consultaSelecionada)
    ) {
      const status = consultaSelecionada.status.trim().toLowerCase();
      if (
        STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL.includes(status) &&
        consultaJaPassou(consultaSelecionada)
      ) {
        toastProntuarioInfo(
          "O horário desta consulta já passou. Marque a consulta como concluída para registrar o prontuário.",
        );
        return;
      }

      if (STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL.includes(status)) {
        toastProntuarioInfo("Este atendimento ainda não foi iniciado.");
      } else {
        toastProntuarioInfo(
          "Marque a consulta como concluída para registrar o prontuário.",
        );
      }
      return;
    }

    setRegistroAberto(true);
  };

  const salvar = async (finalizar: boolean) => {
    if (!validar(finalizar)) return;

    const conteudoEditor = editor?.getHTML() || formulario.conteudo;
    const payload: RegistroClinicoPayload = {
      paciente_id: Number(formulario.paciente_id),
      consulta_id: formulario.consulta_id
        ? Number(formulario.consulta_id)
        : null,
      data_registro: formulario.data_registro,
      tipo_atendimento:
        formulario.tipo_atendimento as TipoAtendimentoProntuario,
      conteudo: conteudoEditor.trim(),
      finalizar,
    };

    try {
      if (editando && evolucao?.id) {
        await atualizarEvolucao.mutateAsync({
          id: evolucao.id,
          dados: payload,
        });
        toast.success("Rascunho atualizado");
      } else {
        await criarEvolucao.mutateAsync(payload);
        toast.success(finalizar ? "Registro finalizado" : "Rascunho criado");
      }
      onClose();
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao salvar registro";
      setErros({ geral: mensagem });
      setConfirmarFinalizacao(false);
    }
  };

  const quantidadeEvolucoesPaciente = pacienteIdSelecionado
    ? evolucoes.filter((item) => item.paciente_id === pacienteIdSelecionado)
        .length
    : 0;
  const opcoesPacientes = pacientes.map((paciente) => ({
    valor: String(paciente.id),
    label: paciente.nome,
    descricao: [
      paciente.idade ? `${paciente.idade} anos` : "",
      paciente.status_atendimento || "",
    ]
      .filter(Boolean)
      .join(" · "),
  }));
  const opcoesConsultas = consultas.map((consulta) => ({
    valor: String(consulta.id),
    label: `${formatarData(consulta.data_consulta)} · ${tipoAtendimentoLabel(
      consulta.tipo_atendimento,
    )}`,
    descricao: `${consulta.horario_inicio?.slice(0, 5)}-${consulta.horario_fim?.slice(
      0,
      5,
    )} · ${consulta.psicologo_nome} · ${consulta.status}`,
  }));
  const tipoAtendimentoSelecionado = formulario.tipo_atendimento
    ? tipoAtendimentoLabel(
        formulario.tipo_atendimento as TipoAtendimentoProntuario,
      )
    : "";

  if (!aberto || !montado) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        data-prontuario-modal
        className="relative max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-2xl border border-[#9F64AF]/15 bg-white p-6 shadow-2xl sm:p-8"
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
            <FilePenLine size={22} />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {editando ? "Editar registro clínico" : "Novo registro clínico"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Registre um registro clínico vinculado ao paciente e ao
              profissional.
            </p>
          </div>
        </div>

        <form
          noValidate
          onSubmit={(evento: FormEvent<HTMLFormElement>) => {
            evento.preventDefault();
            continuarParaRegistro();
          }}
          className="space-y-5"
        >
          <div className="rounded-2xl border border-[#F3EAF8] bg-[#FCFAFD] p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ComboboxClinico
                label="Paciente *"
                valor={formulario.paciente_id}
                opcoes={opcoesPacientes}
                placeholder="Pesquisar e selecionar paciente"
                erro={erros.paciente_id}
                onChange={selecionarPaciente}
              />

              <ComboboxClinico
                label="Consulta vinculada"
                valor={formulario.consulta_id}
                opcoes={opcoesConsultas}
                placeholder={
                  pacienteIdSelecionado
                    ? carregandoConsultas
                      ? "Carregando consultas..."
                      : "Selecionar consulta real"
                    : "Selecione um paciente primeiro"
                }
                erro={erros.consulta_id}
                disabled={!pacienteIdSelecionado || carregandoConsultas}
                onChange={selecionarConsulta}
              />
            </div>

            {pacienteSelecionado && (
              <div className="mt-4 rounded-2xl border border-[#9F64AF]/15 bg-white/85 p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {pacienteSelecionado.nome}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {pacienteSelecionado.idade
                        ? `${pacienteSelecionado.idade} anos`
                        : "Idade não informada"}{" "}
                      · {pacienteSelecionado.ativo ? "Ativo" : "Inativo"} ·{" "}
                      {pacienteSelecionado.status_atendimento ||
                        "Status não informado"}
                    </p>
                  </div>
                  <div className="grid gap-2 text-xs text-gray-500 sm:grid-cols-2 md:text-right">
                    <div>
                      <span className="block font-medium text-gray-500">
                        Última consulta
                      </span>
                      <strong className="mt-0.5 block whitespace-nowrap text-gray-700">
                        {ultimaConsulta
                          ? `${formatarData(ultimaConsulta.data_consulta)} · ${ultimaConsulta.horario_inicio?.slice(
                              0,
                              5,
                            )}`
                          : "Nenhuma"}
                      </strong>
                    </div>
                    <div>
                      <span className="block font-medium text-gray-500">
                        Evoluções
                      </span>
                      <strong className="mt-0.5 block text-gray-700">
                        {quantidadeEvolucoesPaciente}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="prontuario-data"
                className="mb-1.5 block text-xs font-semibold text-gray-600"
              >
                Data <span className="text-red-500">*</span>
              </label>
              <input
                id="prontuario-data"
                type="text"
                readOnly
                value={
                  formulario.data_registro
                    ? formatarData(formulario.data_registro)
                    : ""
                }
                placeholder="Selecione uma consulta vinculada"
                className={`h-11 w-full cursor-not-allowed rounded-xl border bg-gray-50 px-3 text-sm text-gray-500 shadow-sm outline-none ${
                  erros.data_registro ? "border-red-300" : "border-gray-200"
                }`}
              />
              <MensagemErro mensagem={erros.data_registro} />
            </div>

            <div>
              <label
                htmlFor="prontuario-tipo-atendimento"
                className="mb-1.5 block text-xs font-semibold text-gray-600"
              >
                Tipo de atendimento
              </label>
              <input
                id="prontuario-tipo-atendimento"
                type="text"
                readOnly
                value={tipoAtendimentoSelecionado}
                placeholder="Selecione uma consulta vinculada"
                className={`h-11 w-full cursor-not-allowed rounded-xl border bg-gray-50 px-3 text-sm text-gray-500 shadow-sm outline-none ${
                  erros.tipo_atendimento ? "border-red-300" : "border-gray-200"
                }`}
              />
              <MensagemErro mensagem={erros.tipo_atendimento} />
            </div>
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
              disabled={salvando}
              className="rounded-xl bg-[#9F64AF] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B] disabled:opacity-60"
            >
              Continuar para registro
            </button>
          </div>
        </form>

        {registroAberto && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex h-[92vh] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white shadow-2xl"
            >
              <div className="shrink-0 border-[#F3EAF8] border-b bg-white/95 px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Registro clínico
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Descreva o registro clínico, comportamento observado,
                      intervenções realizadas e encaminhamentos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegistroAberto(false)}
                    className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Voltar aos dados do registro"
                  >
                    <X size={20} />
                  </button>
                </div>

                {pacienteSelecionado && (
                  <div className="mt-4 grid gap-3 rounded-2xl border border-[#F3EAF8] bg-[#FCFAFD] p-4 text-sm lg:grid-cols-[1.2fr_1fr]">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {pacienteSelecionado.nome}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {pacienteSelecionado.idade
                          ? `${pacienteSelecionado.idade} anos`
                          : "Idade não informada"}{" "}
                        · {pacienteSelecionado.status_atendimento}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 lg:text-right">
                      <p>
                        {formulario.consulta_id
                          ? opcoesConsultas.find(
                              (opcao) => opcao.valor === formulario.consulta_id,
                            )?.label
                          : "Sem consulta vinculada"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col bg-[#FCFAFD] p-6">
                <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#9F64AF]/15 bg-white shadow-sm">
                  <div className="z-10 flex shrink-0 flex-wrap items-center gap-2 border-[#F3EAF8] border-b bg-white px-4 py-3">
                    <button
                      type="button"
                      disabled={!editor?.can().undo()}
                      onMouseDown={(evento) => evento.preventDefault()}
                      onClick={() => editor?.chain().focus().undo().run()}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                      title="Desfazer"
                    >
                      <Undo2 size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={!editor?.can().redo()}
                      onMouseDown={(evento) => evento.preventDefault()}
                      onClick={() => editor?.chain().focus().redo().run()}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                      title="Refazer"
                    >
                      <Redo2 size={16} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(evento) => evento.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`rounded-lg p-2 transition ${
                        editor?.isActive("bold")
                          ? "bg-[#F3EAF8] text-[#9F64AF]"
                          : "text-gray-500 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                      }`}
                      title="Negrito"
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(evento) => evento.preventDefault()}
                      onClick={() =>
                        editor?.chain().focus().toggleItalic().run()
                      }
                      className={`rounded-lg p-2 transition ${
                        editor?.isActive("italic")
                          ? "bg-[#F3EAF8] text-[#9F64AF]"
                          : "text-gray-500 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                      }`}
                      title="Itálico"
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(evento) => evento.preventDefault()}
                      onClick={() =>
                        editor?.chain().focus().toggleUnderline().run()
                      }
                      className={`rounded-lg p-2 transition ${
                        editor?.isActive("underline")
                          ? "bg-[#F3EAF8] text-[#9F64AF]"
                          : "text-gray-500 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                      }`}
                      title="Sublinhado"
                    >
                      <UnderlineIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(evento) => evento.preventDefault()}
                      onClick={() =>
                        editor?.chain().focus().toggleBulletList().run()
                      }
                      className={`rounded-lg p-2 transition ${
                        editor?.isActive("bulletList")
                          ? "bg-[#F3EAF8] text-[#9F64AF]"
                          : "text-gray-500 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                      }`}
                      title="Lista"
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(evento) => evento.preventDefault()}
                      onClick={() =>
                        editor?.chain().focus().toggleOrderedList().run()
                      }
                      className={`rounded-lg p-2 transition ${
                        editor?.isActive("orderedList")
                          ? "bg-[#F3EAF8] text-[#9F64AF]"
                          : "text-gray-500 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                      }`}
                      title="Lista numerada"
                    >
                      <ListOrdered size={16} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(evento) => evento.preventDefault()}
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .toggleHighlight({ color: "#FFF3B0" })
                          .run()
                      }
                      className={`rounded-lg p-2 transition ${
                        editor?.isActive("highlight")
                          ? "bg-[#F3EAF8] text-[#9F64AF]"
                          : "text-gray-500 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                      }`}
                      title="Destacar texto"
                    >
                      <Highlighter size={16} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(evento) => evento.preventDefault()}
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .clearNodes()
                          .unsetAllMarks()
                          .run()
                      }
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                      title="Limpar formatação"
                    >
                      <Eraser size={16} />
                    </button>
                    <span className="ml-auto text-xs text-gray-400">
                      {editor?.getText().length || 0} caracteres
                    </span>
                  </div>

                  <div className="agenda-filtro-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <EditorContent
                      editor={editor}
                      className="min-h-full [&_.ProseMirror]:min-h-[520px] [&_.ProseMirror]:px-5 [&_.ProseMirror]:py-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:mb-3"
                    />
                  </div>
                </div>
                <MensagemErro mensagem={erros.conteudo} />
                <MensagemErro mensagem={erros.geral} />
              </div>

              <div className="shrink-0 border-[#F3EAF8] border-t bg-white px-6 py-4">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setRegistroAberto(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() => salvar(false)}
                    className="rounded-xl border border-[#9F64AF]/20 bg-white px-4 py-2.5 text-sm font-medium text-[#9F64AF] transition hover:bg-[#F3EAF8] disabled:opacity-60"
                  >
                    Salvar rascunho
                  </button>
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() => {
                      if (validar(true)) setConfirmarFinalizacao(true);
                    }}
                    className="rounded-xl bg-[#9F64AF] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B] disabled:opacity-60"
                  >
                    Finalizar registro
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {confirmarFinalizacao && (
          <div className="fixed inset-0 z-[10040] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[#9F64AF]/15 bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-800">
                Finalizar registro
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Após finalizar, este registro ficará protegido contra alterações
                livres. Edições futuras serão registradas no histórico clínico.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmarFinalizacao(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={salvando}
                  onClick={() => salvar(true)}
                  className="rounded-xl bg-[#9F64AF] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B] disabled:opacity-60"
                >
                  Finalizar registro
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body,
  );
}

export default function ProntuarioPage() {
  const router = useRouter();
  const { usuario, carregando, fazerLogout } = useAutenticacao();
  const { isCollapsed } = useSidebar();
  const [busca, setBusca] = useState("");
  const [filtrosProntuario, setFiltrosProntuario] =
    useState<EstadoFiltrosProntuario>({});
  const [modalAberto, setModalAberto] = useState(false);
  const [evolucaoEdicao, setEvolucaoEdicao] = useState<RegistroClinico | null>(
    null,
  );
  const [evolucaoVisualizacao, setEvolucaoVisualizacao] =
    useState<RegistroClinico | null>(null);
  const { data: pacientesData } = useListarPacientes({
    visibilidade: "ativo",
    limit: 100,
    somente_responsavel: true,
  });
  const filtros = useMemo(
    () => ({
      busca: busca || undefined,
      paciente_id: filtrosProntuario.paciente_id,
      status: filtrosProntuario.status || undefined,
    }),
    [busca, filtrosProntuario.paciente_id, filtrosProntuario.status],
  );
  const {
    data: prontuariosData,
    isLoading,
    error: prontuariosError,
  } = useProntuarios(filtros);
  const finalizarEvolucao = useFinalizarEvolucao();
  const assinarEvolucao = useAssinarEvolucao();
  const evolucoesBase = useMemo(
    () => prontuariosData?.data || [],
    [prontuariosData?.data],
  );
  const evolucoes = useMemo(
    () =>
      evolucoesBase
        .filter((evolucao) =>
          filtrosProntuario.status_paciente
            ? filtrosProntuario.status_paciente === "ativo"
              ? Boolean(evolucao.paciente_ativo)
              : !evolucao.paciente_ativo
            : true,
        )
        .filter((evolucao) =>
          filtrosProntuario.psicologo_id
            ? evolucao.psicologo_id === filtrosProntuario.psicologo_id
            : true,
        )
        .filter((evolucao) =>
          filtrosProntuario.tipo_atendimento
            ? evolucao.tipo_atendimento === filtrosProntuario.tipo_atendimento
            : true,
        )
        .filter((evolucao) =>
          dentroDoPeriodo(
            obterDiaISO(evolucao.data_registro),
            filtrosProntuario.periodo,
          ),
        )
        .sort((a, b) =>
          `${obterDiaISO(b.data_registro)}T${b.criado_em}`.localeCompare(
            `${obterDiaISO(a.data_registro)}T${a.criado_em}`,
          ),
        ),
    [
      evolucoesBase,
      filtrosProntuario.periodo,
      filtrosProntuario.psicologo_id,
      filtrosProntuario.status_paciente,
      filtrosProntuario.tipo_atendimento,
    ],
  );
  const opcoesPsicologos = useMemo(() => {
    const mapa = new Map<string, OpcaoFiltro>();
    for (const evolucao of evolucoesBase) {
      mapa.set(String(evolucao.psicologo_id), {
        valor: String(evolucao.psicologo_id),
        label: evolucao.psicologo_nome,
        descricao: evolucao.crp ? `CRP ${evolucao.crp}` : undefined,
      });
    }
    if (usuario?.id && usuario.nome && !mapa.has(String(usuario.id))) {
      mapa.set(String(usuario.id), {
        valor: String(usuario.id),
        label: usuario.nome,
      });
    }
    return Array.from(mapa.values());
  }, [evolucoesBase, usuario?.id, usuario?.nome]);
  const resumoOperacional = useMemo(() => {
    const hoje = dataHojeISO();
    const pacientesAcompanhamento = new Set(
      evolucoesBase.map((evolucao) => evolucao.paciente_id),
    ).size;
    const pendentesAssinatura = evolucoesBase.filter(
      (evolucao) => evolucao.status === "finalizado",
    ).length;
    const assinadasSemana = evolucoesBase.filter(
      (evolucao) =>
        evolucao.status === "assinado" &&
        dentroDoPeriodo(obterDiaISO(evolucao.assinado_em), "semana"),
    ).length;
    const ultimaEvolucao = [...evolucoesBase].sort((a, b) =>
      `${obterDiaISO(b.data_registro)}T${b.criado_em}`.localeCompare(
        `${obterDiaISO(a.data_registro)}T${a.criado_em}`,
      ),
    )[0];

    return {
      evolucoesHoje: evolucoesBase.filter(
        (evolucao) => obterDiaISO(evolucao.data_registro) === hoje,
      ).length,
      pacientesAcompanhamento,
      pendentesAssinatura,
      assinadasSemana,
      ultimaEvolucao: ultimaEvolucao
        ? `${formatarData(ultimaEvolucao.data_registro)} · ${
            ultimaEvolucao.paciente_nome
          }`
        : "Nenhuma",
    };
  }, [evolucoesBase]);

  useEffect(() => {
    // Permissão visual: o backend mantém o bloqueio real para secretária,
    // usuários inativos e perfis sem acesso ao prontuário.
    if (!carregando && (!usuario || usuario.perfil_id !== 2)) {
      router.replace("/inicio");
    }
  }, [carregando, router, usuario]);

  if (carregando || !usuario || usuario.perfil_id !== 2) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
      </div>
    );
  }

  const pacientes = (pacientesData?.data || []).map((paciente) => ({
    id: paciente.id,
    nome: paciente.nome,
    idade: paciente.idade,
    ativo: paciente.ativo,
    status_atendimento: paciente.status_atendimento,
  }));
  const opcoesPacientes = pacientes.map((paciente) => ({
    valor: String(paciente.id),
    label: paciente.nome,
  }));
  const contentMargin = isCollapsed ? "ml-20" : "ml-64";
  const mensagemErroProntuario =
    prontuariosError instanceof Error ? prontuariosError.message : "";
  const mensagemErroProntuarioAmigavel = mensagemErroProntuario
    ? "Você não possui permissão para acessar este prontuário."
    : "";
  const mensagemErroProntuarioDetalhe = mensagemErroProntuario
    ? mensagemErroProntuario.toLowerCase().includes("permiss")
      ? "Este paciente está vinculado a outro psicólogo responsável."
      : mensagemErroProntuario
    : "";
  const temFiltroOuBuscaAtivo =
    Boolean(busca.trim()) || Object.values(filtrosProntuario).some(Boolean);

  const abrirNovo = () => {
    setEvolucaoEdicao(null);
    setModalAberto(true);
  };

  const confirmarFinalizacao = async (evolucao: RegistroClinico) => {
    try {
      await finalizarEvolucao.mutateAsync(evolucao.id);
      toast.success("Registro finalizado");
      setEvolucaoVisualizacao((atual) =>
        atual?.id === evolucao.id
          ? {
              ...atual,
              status: "finalizado",
              finalizado_em: atual.finalizado_em || new Date().toISOString(),
            }
          : atual,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao finalizar registro",
      );
    }
  };

  const executarAssinatura = async (evolucao: RegistroClinico) => {
    try {
      const resposta = await assinarEvolucao.mutateAsync(evolucao.id);
      toast.success("Registro assinado");
      const dadosAssinatura = resposta?.data;
      setEvolucaoVisualizacao((atual) =>
        atual?.id === evolucao.id
          ? {
              ...atual,
              status: "assinado",
              assinatura_url:
                dadosAssinatura?.assinatura_url || atual.assinatura_url,
              assinado_em: dadosAssinatura?.assinado_em || atual.assinado_em,
            }
          : atual,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao assinar registro",
      );
    }
  };

  const gerarPdfRegistroClinico = useCallback(
    async (evolucao: RegistroClinico) => {
      try {
        await gerarRegistroClinicoPdf(evolucao);
        toast.success("PDF gerado com sucesso");
      } catch (error) {
        console.error("Erro ao gerar PDF do registro clínico:", error);
        toast.error("Não foi possível gerar o PDF");
      }
    },
    [],
  );

  const imprimirRegistroClinicoVisualizacao = useCallback(
    (evolucao: RegistroClinico) => {
      try {
        imprimirRegistroClinico(evolucao);
      } catch (error) {
        console.error("Erro ao imprimir registro clínico:", error);
        toast.error("Não foi possível abrir a impressão");
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0]">
      <Sidebar
        perfilId={usuario.perfil_id}
        onLogout={fazerLogout}
        usuario={usuario}
      />

      <div className={contentMargin}>
        <div className="px-8 pt-8 pb-2">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Prontuário</h1>
              <p className="mt-1 text-sm text-gray-500">
                Registre e acompanhe registros clínicos dos pacientes.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirNovo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9F64AF] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B]"
            >
              <FileText size={16} />
              Novo registro clínico
            </button>
          </header>
        </div>

        <main className="px-8 pb-8">
          <div className="mx-auto max-w-5xl space-y-8 pt-4">
            <ResumoProntuario resumo={resumoOperacional} />

            <section className="rounded-2xl border border-[#9F64AF]/20 bg-white/70 p-4 shadow-sm backdrop-blur-sm sm:p-5">
              <div className="relative z-30 mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative">
                  <Search
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    value={busca}
                    onChange={(evento) => setBusca(evento.target.value)}
                    placeholder="Buscar por paciente..."
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white/90 pr-10 pl-10 text-sm text-gray-700 outline-none transition focus:border-[#9F64AF]/70 lg:w-[360px]"
                  />
                  {busca.trim() && (
                    <button
                      type="button"
                      onClick={() => setBusca("")}
                      className="absolute top-1/2 right-2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg p-1.5 text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                      aria-label="Limpar busca"
                      title="Limpar busca"
                    >
                      <BrushCleaning size={15} />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <FiltrosProntuario
                    filtros={filtrosProntuario}
                    pacientes={opcoesPacientes}
                    psicologos={opcoesPsicologos}
                    onChange={setFiltrosProntuario}
                  />
                  <span className="whitespace-nowrap text-sm text-gray-600">
                    {evolucoes.length}{" "}
                    {evolucoes.length === 1 ? "registro" : "registros"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#F3EAF8] bg-white/55 p-4">
                <div className="mb-4 flex flex-col gap-1">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Timeline clínica
                  </h2>
                  <p className="text-xs text-gray-500">
                    Histórico documental dos registros clínicos registrados.
                  </p>
                </div>

                {mensagemErroProntuario ? (
                  <section className="rounded-2xl border border-red-100 bg-red-50/70 p-12 text-center shadow-sm">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-red-600">
                      <FileText size={34} />
                    </span>
                    <h2 className="mt-4 text-base font-semibold text-red-700">
                      {mensagemErroProntuarioAmigavel}
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-600/80">
                      {mensagemErroProntuarioDetalhe}
                    </p>
                  </section>
                ) : isLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
                  </div>
                ) : evolucoes.length === 0 ? (
                  <section className="rounded-2xl border border-dashed border-[#D9BCE8] bg-white/75 p-12 text-center shadow-sm">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#9F64AF]">
                      <FileText size={34} />
                    </span>
                    <h2 className="mt-4 text-base font-semibold text-gray-800">
                      {temFiltroOuBuscaAtivo
                        ? "Nenhum resultado encontrado"
                        : "Nenhum registro clínico encontrado"}
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                      {temFiltroOuBuscaAtivo
                        ? "Não encontramos registros clínicos para os filtros ou termo pesquisado. Limpe a busca ou ajuste os filtros para visualizar outros registros."
                        : "Os registros clínicos dos pacientes aparecerão aqui conforme os atendimentos forem realizados."}
                    </p>
                  </section>
                ) : (
                  <TimelineRegistros
                    evolucoes={evolucoes}
                    onVisualizar={setEvolucaoVisualizacao}
                    onEditar={(item) => {
                      setEvolucaoEdicao(item);
                      setModalAberto(true);
                    }}
                    onFinalizar={confirmarFinalizacao}
                    onAssinar={executarAssinatura}
                  />
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <ModalEvolucao
        aberto={modalAberto}
        pacientes={pacientes}
        evolucoes={evolucoesBase}
        evolucao={evolucaoEdicao}
        onClose={() => {
          setModalAberto(false);
          setEvolucaoEdicao(null);
        }}
      />

      <ModalVisualizarRegistroClinico
        evolucao={evolucaoVisualizacao}
        onClose={() => setEvolucaoVisualizacao(null)}
        onEditar={(item) => {
          setEvolucaoVisualizacao(null);
          setEvolucaoEdicao(item);
          setModalAberto(true);
        }}
        onFinalizar={confirmarFinalizacao}
        onAssinar={executarAssinatura}
        onGerarPdf={gerarPdfRegistroClinico}
        onImprimir={imprimirRegistroClinicoVisualizacao}
      />
    </div>
  );
}
