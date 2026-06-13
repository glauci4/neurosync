"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { motion } from "framer-motion";
import {
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
  Italic,
  List,
  ListOrdered,
  PencilLine,
  PenLine,
  Search,
  ShieldCheck,
  Signature,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdErrorOutline } from "react-icons/md";
import { RxGear } from "react-icons/rx";
import { toast } from "sonner";
import { useSidebar } from "@/app/context/SidebarContext";
import Sidebar from "@/app/inicio/components/Sidebar";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import { useListarPacientes } from "@/hooks/useListarPacientes";
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

const STATUS_CONSULTA_PRONTUARIO_LIBERADO = [
  "em_andamento",
  "concluido",
  "concluida",
  "realizado",
  "realizada",
];

function consultaLiberaProntuario(status: string) {
  return STATUS_CONSULTA_PRONTUARIO_LIBERADO.includes(
    status.trim().toLowerCase(),
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

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAberto(false);
        setBusca("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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
        <div className="absolute top-full left-0 z-[10020] mt-2 w-full overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white p-2 shadow-xl">
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Pesquisar..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
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
      <MensagemErro mensagem={erro} />
    </div>
  );
}

function ComboboxFiltroProntuario({
  label,
  valor,
  opcoes,
  placeholder,
  onChange,
}: {
  label: string;
  valor?: string;
  opcoes: OpcaoFiltro[];
  placeholder: string;
  onChange: (valor?: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const opcoesFiltradas = useMemo(
    () =>
      opcoes.filter((opcao) =>
        `${opcao.label} ${opcao.descricao || ""}`
          .toLowerCase()
          .includes(busca.toLowerCase()),
      ),
    [busca, opcoes],
  );
  const selecionada = opcoes.find((opcao) => opcao.valor === valor);

  useEffect(() => {
    if (!aberto) return;
    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAberto(false);
        setBusca("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto]);

  const selecionar = (novoValor?: string) => {
    onChange(novoValor);
    setAberto(false);
    setBusca("");
  };

  return (
    <div className="relative border-gray-100 border-b py-2.5 last:border-b-0">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-[#F3EAF8]"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold text-gray-400 uppercase">
            {label}
          </span>
          <span
            className={`mt-0.5 block truncate text-sm ${
              selecionada ? "font-medium text-gray-700" : "text-gray-400"
            }`}
          >
            {selecionada?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {aberto && (
        <div className="mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Pesquisar..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            <OpcaoFiltroProntuario
              label="Todos"
              selecionada={!valor}
              onClick={() => selecionar(undefined)}
            />
            {opcoesFiltradas.map((opcao) => (
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
    </div>
  );
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

function FiltrosProntuario({
  filtros,
  pacientes,
  psicologos,
  onChange,
}: {
  filtros: EstadoFiltrosProntuario;
  pacientes: OpcaoFiltro[];
  psicologos: OpcaoFiltro[];
  onChange: (filtros: EstadoFiltrosProntuario) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState({
    top: 0,
    left: 0,
    width: 380,
    maxHeight: 520,
    arrowLeft: 330,
  });
  const botaoRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const filtrosAtivos = Object.values(filtros).filter(Boolean).length;

  const atualizarPosicao = useCallback(() => {
    if (!botaoRef.current) return;

    const rect = botaoRef.current.getBoundingClientRect();
    const margem = 16;
    const espacamento = 12;
    const largura = Math.min(380, window.innerWidth - margem * 2);
    const top = rect.bottom + espacamento;
    const left = Math.min(
      Math.max(margem, rect.right - largura),
      window.innerWidth - largura - margem,
    );
    const alturaDisponivel = Math.max(140, window.innerHeight - top - margem);
    const maxHeight = Math.min(
      Math.floor(window.innerHeight * 0.7),
      alturaDisponivel,
    );

    setPosicao({
      top,
      left,
      width: largura,
      maxHeight,
      arrowLeft: Math.min(
        Math.max(18, rect.left + rect.width / 2 - left - 8),
        largura - 34,
      ),
    });
  }, []);

  useEffect(() => {
    if (!aberto) return;
    atualizarPosicao();

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    const handleClickOutside = (evento: MouseEvent) => {
      const alvo = evento.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(alvo) &&
        botaoRef.current &&
        !botaoRef.current.contains(alvo)
      ) {
        setAberto(false);
      }
    };
    const handleViewportChange = () => atualizarPosicao();

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [aberto, atualizarPosicao]);

  return (
    <div className="relative">
      <button
        ref={botaoRef}
        type="button"
        onClick={() => {
          setAberto((atual) => {
            const proximo = !atual;
            if (proximo) requestAnimationFrame(atualizarPosicao);
            return proximo;
          });
        }}
        className="relative rounded-xl border border-gray-300 bg-white/85 p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-[#9F64AF]"
        title="Filtrar prontuário"
        aria-label="Filtrar prontuário"
        aria-expanded={aberto}
      >
        <SlidersHorizontal size={18} />
        {filtrosAtivos > 0 && (
          <span className="-top-1 -right-1 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9F64AF] px-1 text-[10px] font-bold text-white">
            {filtrosAtivos}
          </span>
        )}
      </button>

      {aberto
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[10000] flex flex-col overflow-visible rounded-2xl border border-[#9F64AF]/15 bg-white/95 p-3 shadow-2xl backdrop-blur-sm"
              style={{
                top: posicao.top,
                left: posicao.left,
                width: posicao.width,
                maxHeight: posicao.maxHeight,
              }}
              role="dialog"
              aria-label="Filtros do prontuário"
            >
              <span
                className="-top-2 absolute h-4 w-4 rotate-45 border-t border-l border-[#9F64AF]/15 bg-white/95 backdrop-blur-sm"
                style={{ left: posicao.arrowLeft }}
              />
              <div className="shrink-0 border-[#F3EAF8] border-b px-1 pb-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Filtrar prontuário
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Refine o histórico clínico exibido na timeline.
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto py-1 pr-1">
                <ComboboxFiltroProntuario
                  label="Paciente"
                  valor={
                    filtros.paciente_id
                      ? String(filtros.paciente_id)
                      : undefined
                  }
                  opcoes={pacientes}
                  placeholder="Todos"
                  onChange={(valor) =>
                    onChange({
                      ...filtros,
                      paciente_id: valor ? Number(valor) : undefined,
                    })
                  }
                />
                <ComboboxFiltroProntuario
                  label="Psicólogo"
                  valor={
                    filtros.psicologo_id
                      ? String(filtros.psicologo_id)
                      : undefined
                  }
                  opcoes={psicologos}
                  placeholder="Todos"
                  onChange={(valor) =>
                    onChange({
                      ...filtros,
                      psicologo_id: valor ? Number(valor) : undefined,
                    })
                  }
                />
                <ComboboxFiltroProntuario
                  label="Status do paciente"
                  valor={filtros.status_paciente}
                  opcoes={STATUS_PACIENTE_OPCOES}
                  placeholder="Todos"
                  onChange={(valor) =>
                    onChange({
                      ...filtros,
                      status_paciente: valor as "ativo" | "inativo" | undefined,
                    })
                  }
                />
                <ComboboxFiltroProntuario
                  label="Status"
                  valor={filtros.status}
                  opcoes={STATUS_OPCOES}
                  placeholder="Todos"
                  onChange={(valor) => onChange({ ...filtros, status: valor })}
                />
                <ComboboxFiltroProntuario
                  label="Período"
                  valor={filtros.periodo}
                  opcoes={PERIODO_OPCOES}
                  placeholder="Todos"
                  onChange={(valor) => onChange({ ...filtros, periodo: valor })}
                />
                <ComboboxFiltroProntuario
                  label="Tipo de atendimento"
                  valor={filtros.tipo_atendimento}
                  opcoes={TIPOS_ATENDIMENTO.map((tipo) => ({
                    valor: tipo.valor,
                    label: tipo.label,
                  }))}
                  placeholder="Todos"
                  onChange={(valor) =>
                    onChange({ ...filtros, tipo_atendimento: valor })
                  }
                />
              </div>

              <div className="flex shrink-0 items-center justify-between border-[#F3EAF8] border-t bg-white/95 px-1 pt-3">
                <span className="text-xs text-gray-400">
                  {filtrosAtivos} {filtrosAtivos === 1 ? "filtro" : "filtros"}
                </span>
                <button
                  type="button"
                  onClick={() => onChange({})}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                >
                  <BrushCleaning size={13} />
                  Limpar filtros
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
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
    data_registro: dataHojeISO(),
    tipo_atendimento: "" as TipoAtendimentoProntuario | "",
    conteudo: "",
  });
  const [erros, setErros] = useState<ErrosEvolucao>({});
  const criarEvolucao = useCriarEvolucao();
  const atualizarEvolucao = useAtualizarEvolucao();
  const pacienteIdSelecionado = Number(formulario.paciente_id || 0);
  const { data: consultasData, isLoading: carregandoConsultas } =
    useConsultasPacienteProntuario(pacienteIdSelecionado || undefined);
  const salvando = criarEvolucao.isPending || atualizarEvolucao.isPending;
  const editando = Boolean(evolucao?.id);
  const editor = useEditor({
    extensions: [StarterKit],
    content: formulario.conteudo || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[360px] px-4 py-4 text-sm leading-7 text-gray-700 outline-none prose prose-sm max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      atualizarCampo("conteudo", editor.getHTML());
    },
  });

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    setRegistroAberto(Boolean(evolucao?.id));
    setConfirmarFinalizacao(false);
    setErros({});
    setFormulario({
      paciente_id: evolucao?.paciente_id ? String(evolucao.paciente_id) : "",
      consulta_id: evolucao?.consulta_id ? String(evolucao.consulta_id) : "",
      data_registro: evolucao?.data_registro?.slice(0, 10) || dataHojeISO(),
      tipo_atendimento: evolucao?.tipo_atendimento || "",
      conteudo: evolucao?.conteudo || "",
    });
  }, [aberto, evolucao]);

  useEffect(() => {
    if (!aberto || !editor) return;
    editor.commands.setContent(evolucao?.conteudo || "");
  }, [aberto, editor, evolucao?.conteudo]);

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
        .filter((consulta) => consultaLiberaProntuario(consulta.status))
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
  const ultimaConsulta = consultas[0];
  const textoEditor = editor?.getText().trim() || "";

  const atualizarCampo = (campo: keyof typeof formulario, valor: string) => {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined, geral: undefined }));
  };

  const selecionarPaciente = (valor?: string) => {
    setFormulario((atual) => ({
      ...atual,
      paciente_id: valor || "",
      consulta_id: "",
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
    setFormulario((atual) => ({
      ...atual,
      consulta_id: valor || "",
      data_registro: consulta?.data_consulta || atual.data_registro,
      tipo_atendimento: consulta?.tipo_atendimento || atual.tipo_atendimento,
    }));
    setErros((atuais) => ({
      ...atuais,
      consulta_id: undefined,
      data_registro: undefined,
      tipo_atendimento: undefined,
      geral: undefined,
    }));
  };

  const validar = (finalizar: boolean) => {
    const novosErros: ErrosEvolucao = {};
    if (!formulario.paciente_id) {
      novosErros.paciente_id = "Paciente é obrigatório";
    }
    if (!formulario.data_registro) {
      novosErros.data_registro = "Data é obrigatória";
    }
    if (!formulario.tipo_atendimento) {
      novosErros.tipo_atendimento = "Tipo de atendimento é obrigatório";
    }
    if (
      formulario.consulta_id &&
      !consultas.some(
        (consulta) => String(consulta.id) === formulario.consulta_id,
      )
    ) {
      novosErros.consulta_id = "Consulta vinculada inválida";
    }
    if (finalizar && !textoEditor) {
      novosErros.conteudo =
        "Conteúdo do registro clínico é obrigatório para finalizar";
    }
    const consultaLiberadaSelecionada = consultas.some(
      (consulta) =>
        String(consulta.id) === formulario.consulta_id &&
        consultaLiberaProntuario(consulta.status),
    );
    if (pacienteSelecionado?.ativo === false) {
      novosErros.paciente_id = "Paciente não encontrado ou inativo";
    }
    if (pacienteSelecionado && !consultaLiberadaSelecionada) {
      novosErros.consulta_id =
        "Só é possível criar um registro clínico a partir de uma consulta iniciada.";
      if (!formulario.consulta_id) {
        novosErros.consulta_id =
          "Só é possível criar um registro clínico a partir de uma consulta iniciada.";
      }
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
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
  const opcoesTipos = TIPOS_ATENDIMENTO.map((tipo) => ({
    valor: tipo.valor,
    label: tipo.label,
  }));

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
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#9F64AF]/15 bg-white p-6 shadow-2xl sm:p-8"
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
            if (validar(false)) setRegistroAberto(true);
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
                    <span>
                      Última consulta:{" "}
                      <strong className="text-gray-700">
                        {ultimaConsulta
                          ? `${formatarData(ultimaConsulta.data_consulta)} · ${ultimaConsulta.horario_inicio?.slice(
                              0,
                              5,
                            )}`
                          : "Nenhuma"}
                      </strong>
                    </span>
                    <span>
                      Evoluções:{" "}
                      <strong className="text-gray-700">
                        {quantidadeEvolucoesPaciente}
                      </strong>
                    </span>
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
                type="date"
                value={formulario.data_registro}
                onChange={(evento) =>
                  atualizarCampo("data_registro", evento.target.value)
                }
                className={`h-11 w-full rounded-xl border bg-white/90 px-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[#9F64AF]/70 ${
                  erros.data_registro ? "border-red-300" : "border-gray-200"
                }`}
              />
              <MensagemErro mensagem={erros.data_registro} />
            </div>

            <ComboboxClinico
              label="Tipo de atendimento *"
              valor={formulario.tipo_atendimento}
              opcoes={opcoesTipos}
              placeholder="Selecionar tipo"
              erro={erros.tipo_atendimento}
              onChange={(valor) =>
                atualizarCampo("tipo_atendimento", valor || "")
              }
            />
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
              className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white shadow-2xl"
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
                      <p className="mt-1">
                        {formatarData(formulario.data_registro)} ·{" "}
                        {tipoAtendimentoLabel(
                          formulario.tipo_atendimento as TipoAtendimentoProntuario,
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#FCFAFD] p-6">
                <div className="overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 border-[#F3EAF8] border-b bg-white/95 px-4 py-3">
                    <button
                      type="button"
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

                  <EditorContent
                    editor={editor}
                    className="min-h-[420px] [&_.ProseMirror]:min-h-[420px] [&_.ProseMirror]:px-5 [&_.ProseMirror]:py-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:mb-3"
                  />
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

function ConteudoEvolucao({ conteudo }: { conteudo: string }) {
  const editorLeitura = useEditor({
    extensions: [StarterKit],
    content: conteudo,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "text-sm leading-6 text-gray-700 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6",
      },
    },
  });

  return <EditorContent editor={editorLeitura} />;
}

function CardEvolucao({
  evolucao,
  onEditar,
  onFinalizar,
  onAssinar,
}: {
  evolucao: RegistroClinico;
  onEditar: (evolucao: RegistroClinico) => void;
  onFinalizar: (evolucao: RegistroClinico) => void;
  onAssinar: (evolucao: RegistroClinico) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const status = STATUS_CONFIG[evolucao.status];
  const StatusIcone = status.icone;
  const horaRegistro =
    formatarHoraClinica(evolucao.finalizado_em) ||
    formatarHoraClinica(evolucao.criado_em);
  const podeEditar = evolucao.status === "rascunho";
  const consultaVinculada = Number(evolucao.consulta_id) > 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white/90 shadow-sm backdrop-blur-sm">
      {/* Cabeçalho documental com status clínico e ações permitidas pelo backend. */}
      <div className="border-[#F3EAF8] border-b bg-white/80 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.classe}`}
              >
                <StatusIcone size={13} />
                {status.label}
              </span>
              {consultaVinculada && (
                <span className="rounded-full border border-[#D9BCE8] bg-[#F9F4FB] px-2.5 py-0.5 text-[11px] font-semibold text-[#7A4B86]">
                  Consulta vinculada
                </span>
              )}
            </div>
            <h3 className="mt-2 truncate text-base font-semibold text-gray-800">
              {evolucao.paciente_nome}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={13} className="text-[#9F64AF]" />
                {formatarDataClinica(evolucao.data_registro)}
                {horaRegistro ? ` · ${horaRegistro}` : ""}
              </span>
              <span>{tipoAtendimentoLabel(evolucao.tipo_atendimento)}</span>
              <span>
                {evolucao.psicologo_nome}
                {evolucao.crp ? ` · CRP ${evolucao.crp}` : ""}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setExpandido((atual) => !atual)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#9F64AF]/20 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#9F64AF] transition hover:bg-[#F3EAF8]"
            >
              <FileText size={13} />
              {expandido ? "Recolher registro" : "Ver registro"}
            </button>
          </div>
        </div>
      </div>

      {expandido && (
        <div className="space-y-2.5 p-3.5">
          <div className="rounded-2xl border border-gray-100 bg-[#FCFAFD] p-3.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase text-gray-500">
                Registro clínico
              </span>
              <span className="text-[11px] text-gray-400">
                Atualizado em {formatarDataHora(evolucao.atualizado_em)}
              </span>
            </div>
            {evolucao.conteudo ? (
              <ConteudoEvolucao conteudo={evolucao.conteudo} />
            ) : (
              <p className="text-sm leading-6 text-gray-500">
                Rascunho sem conteúdo registrado.
              </p>
            )}
          </div>

          {evolucao.editado_em && evolucao.editado_por_nome && (
            <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white/80 p-3.5 text-[11px] text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              {/* Registro discreto da última edição; o histórico completo fica preservado no banco. */}
              <p className="leading-[1.15]">
                Editado por{" "}
                <span className="font-semibold text-gray-700">
                  {evolucao.editado_por_nome}
                </span>
                {evolucao.crp_editor ? ` — CRP ${evolucao.crp_editor}` : ""} em{" "}
                {formatarDataHoraEdicao(evolucao.editado_em)}
              </p>
              {evolucao.assinatura_editor_url && (
                <div className="shrink-0 rounded-lg border border-gray-100 bg-white p-2">
                  <Image
                    src={evolucao.assinatura_editor_url}
                    alt="Assinatura do psicólogo editor"
                    width={150}
                    height={48}
                    className="max-h-10 max-w-[130px] object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {evolucao.status === "assinado" && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
              {/* A assinatura exibida é a cópia histórica gravada no momento da assinatura. */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/75 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <Signature size={13} />
                    Assinado digitalmente
                  </span>
                  <p className="mt-2.5 text-sm font-semibold text-emerald-900">
                    {evolucao.psicologo_nome}
                    {evolucao.crp ? ` · CRP ${evolucao.crp}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700/80">
                    {formatarDataHora(evolucao.assinado_em)}
                  </p>
                </div>
                {evolucao.assinatura_url && (
                  <div className="rounded-xl border border-emerald-100 bg-white/90 p-2.5 shadow-sm">
                    <Image
                      src={evolucao.assinatura_url}
                      alt="Assinatura profissional"
                      width={280}
                      height={90}
                      className="max-h-20 max-w-[220px] object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-gray-100 border-t pt-2.5">
            {podeEditar && (
              <>
                <button
                  type="button"
                  onClick={() => onEditar(evolucao)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#9F64AF]/20 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#9F64AF] transition hover:bg-[#F3EAF8]"
                >
                  <PenLine size={13} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onFinalizar(evolucao)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#9F64AF] px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#8B509B]"
                >
                  <CheckCircle2 size={13} />
                  Finalizar
                </button>
              </>
            )}
            {evolucao.status === "finalizado" && (
              <button
                type="button"
                onClick={() => onAssinar(evolucao)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#9F64AF] px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#8B509B]"
              >
                <Signature size={13} />
                Assinar registro
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function TimelineClinica({
  evolucoes,
  onEditar,
  onFinalizar,
  onAssinar,
}: {
  evolucoes: RegistroClinico[];
  onEditar: (evolucao: RegistroClinico) => void;
  onFinalizar: (evolucao: RegistroClinico) => void;
  onAssinar: (evolucao: RegistroClinico) => void;
}) {
  return (
    <section className="space-y-6">
      {evolucoes.map((evolucao, index) => (
        <div key={evolucao.id} className="grid gap-3 md:grid-cols-[104px_1fr]">
          <div className="flex md:justify-end">
            <div className="rounded-xl border border-[#9F64AF]/15 bg-white/75 px-2.5 py-1.5 text-left shadow-sm md:text-right">
              <p className="text-[11px] font-semibold text-[#9F64AF]">
                {formatarData(evolucao.data_registro)}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {tipoAtendimentoLabel(evolucao.tipo_atendimento)}
              </p>
            </div>
          </div>

          <div className="relative pl-4">
            {/* A timeline reforça a leitura histórica do prontuário clínico. */}
            <span className="absolute top-2 left-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#9F64AF] shadow-[0_0_0_4px_rgba(159,100,175,0.16)]" />
            {index < evolucoes.length - 1 && (
              <span className="absolute top-5 bottom-[-1.25rem] left-[4px] w-px bg-[#D9BCE8]" />
            )}
            <span className="sr-only">Linha do tempo clínica</span>
            <CardEvolucao
              evolucao={evolucao}
              onEditar={onEditar}
              onFinalizar={onFinalizar}
              onAssinar={onAssinar}
            />
          </div>
        </div>
      ))}
    </section>
  );
}

function ModalConfirmacao({
  aberto,
  titulo,
  descricao,
  textoConfirmar,
  carregando,
  variante = "padrao",
  onClose,
  onConfirmar,
}: {
  aberto: boolean;
  titulo: string;
  descricao: string;
  textoConfirmar: string;
  carregando?: boolean;
  variante?: "padrao" | "perigo";
  onClose: () => void;
  onConfirmar: () => void;
}) {
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);
  useEffect(() => {
    if (!aberto) return;
    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, onClose]);

  if (!aberto || !montado) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-2xl border border-[#9F64AF]/15 bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-gray-800">{titulo}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{descricao}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={carregando}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-60 ${
              variante === "perigo"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#9F64AF] hover:bg-[#8B509B]"
            }`}
          >
            {carregando ? "Processando..." : textoConfirmar}
          </button>
        </div>
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
  const [confirmacao, setConfirmacao] = useState<RegistroClinico | null>(null);
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

  const abrirNovo = () => {
    setEvolucaoEdicao(null);
    setModalAberto(true);
  };

  const confirmarFinalizacao = async (evolucao: RegistroClinico) => {
    try {
      await finalizarEvolucao.mutateAsync(evolucao.id);
      toast.success("Registro finalizado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao finalizar registro",
      );
    }
  };

  const executarAssinatura = async (evolucao: RegistroClinico) => {
    try {
      await assinarEvolucao.mutateAsync(evolucao.id);
      toast.success("Registro assinado");
      setConfirmacao(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao assinar registro",
      );
    }
  };

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
            <section className="mt-4 rounded-2xl border border-[#9F64AF]/20 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
              {/* Resumo operacional segue o mesmo padrão de Agenda e Funcionamento. */}
              <div className="mb-4 flex items-center gap-2">
                <RxGear size={16} className="animate-spin text-[#9F64AF]" />
                <h2 className="text-sm font-semibold text-gray-800">
                  Resumo operacional
                </h2>
              </div>

              <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">Registros hoje</span>
                  <span className="font-semibold text-gray-800">
                    {resumoOperacional.evolucoesHoje}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">
                    Pacientes em acompanhamento
                  </span>
                  <span className="font-semibold text-gray-800">
                    {resumoOperacional.pacientesAcompanhamento}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">
                    Pendentes de assinatura
                  </span>
                  <span className="font-semibold text-gray-800">
                    {resumoOperacional.pendentesAssinatura}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">
                    Registros assinados
                  </span>
                  <span className="font-semibold text-gray-800">
                    {resumoOperacional.assinadasSemana}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">
                    Último registro clínico
                  </span>
                  <span className="truncate font-semibold text-gray-800">
                    {resumoOperacional.ultimaEvolucao}
                  </span>
                </div>
              </div>
            </section>

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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white/90 pr-3 pl-10 text-sm text-gray-700 outline-none transition focus:border-[#9F64AF]/70 lg:w-[360px]"
                  />
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
                      Nenhum registro clínico encontrado
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                      Os registros clínicos dos pacientes aparecerão aqui
                      conforme os atendimentos forem realizados.
                    </p>
                  </section>
                ) : (
                  <TimelineClinica
                    evolucoes={evolucoes}
                    onEditar={(item) => {
                      setEvolucaoEdicao(item);
                      setModalAberto(true);
                    }}
                    onFinalizar={confirmarFinalizacao}
                    onAssinar={(item) => setConfirmacao(item)}
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

      <ModalConfirmacao
        aberto={Boolean(confirmacao)}
        titulo="Assinar registro"
        descricao="Após assinar, este registro não poderá ser editado. A assinatura profissional cadastrada no Perfil Profissional será copiada para o prontuário."
        textoConfirmar="Assinar registro"
        variante="padrao"
        carregando={assinarEvolucao.isPending}
        onClose={() => setConfirmacao(null)}
        onConfirmar={() => {
          if (!confirmacao) return;
          executarAssinatura(confirmacao);
        }}
      />
    </div>
  );
}
