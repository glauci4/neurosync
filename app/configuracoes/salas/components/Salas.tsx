"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArchiveRestore,
  Edit3,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdErrorOutline,
  MdOutlineDoorSliding,
  MdOutlineMeetingRoom,
  MdOutlineNoMeetingRoom,
} from "react-icons/md";
import { toast } from "sonner";
import ConfirmarAcaoModal from "@/app/pacientes/components/ConfirmarAcaoModal";
import { useSalas } from "../hooks/useSalas";
import type { Sala, SalaPayload, TipoSala } from "../types";

type FiltroStatusSala = "ativo" | "inativo" | "todos";
type TipoAcaoSala = "inativar" | "reativar" | "excluir";

interface SalasProps {
  podeEditar: boolean;
  onCabecalhoChange?: (cabecalho: {
    titulo: string;
    descricao: string;
  }) => void;
}

interface ModalSalaProps {
  sala?: Sala | null;
  salas: Sala[];
  salvando: boolean;
  onClose: () => void;
  onSalvar: (dados: SalaPayload) => void;
}

interface FiltroSalasCardProps {
  filtroAtual: FiltroStatusSala;
  onFiltroChange: (filtro: FiltroStatusSala) => void;
  onClose: () => void;
}

const TIPOS_SALA: Record<TipoSala, { label: string; descricao: string }> = {
  geral: {
    label: "Atendimento Geral",
    descricao: "Atendimento Geral",
  },
  infantil: {
    label: "Atendimento Infantil",
    descricao: "Atendimento Infantil",
  },
};

const CABECALHOS_SALAS: Record<
  FiltroStatusSala,
  { titulo: string; descricao: string }
> = {
  ativo: {
    titulo: "Salas Ativas",
    descricao: "Gerencie as salas ativas da clínica",
  },
  inativo: {
    titulo: "Salas Inativas",
    descricao: "Visualize as salas inativas da clínica",
  },
  todos: {
    titulo: "Todas as Salas",
    descricao: "Visualize todas as salas cadastradas na clínica",
  },
};

const TOAST_NEUROSYNC = {
  className: "border-[#9F64AF]/30 bg-[#F3EAF8] text-[#6F3A82]",
};

function salaEstaAtiva(sala: Sala) {
  return Boolean(sala.ativo);
}

function normalizarNomeSala(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

function FiltroSalasCard({
  filtroAtual,
  onFiltroChange,
  onClose,
}: FiltroSalasCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const isActive = (valor: FiltroStatusSala) => filtroAtual === valor;

  return (
    <div
      ref={cardRef}
      className="absolute left-0 z-50 mt-3 w-72 overflow-visible rounded-2xl border border-gray-100 bg-white shadow-xl"
    >
      <div className="absolute -top-2 left-4">
        <div className="h-4 w-4 rotate-45 border-l border-t border-gray-100 bg-white" />
      </div>

      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="mt-1 text-sm font-semibold text-gray-800">
          Filtrar salas
        </h3>
        <p className="text-xs text-gray-500">
          Selecione quais salas deseja visualizar
        </p>
      </div>

      {/* Filtros: mesma linguagem visual do FiltroVisibilidadeCard de Pacientes,
          mantendo Salas como um Pacientes simplificado. Os ícones vêm de
          react-icons/md para padronizar o vocabulário visual do módulo. */}
      <div className="p-2">
        <button
          type="button"
          onClick={() => {
            onFiltroChange("ativo");
            onClose();
          }}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
            isActive("ativo")
              ? "bg-[#F3E8F7] text-[#9F64AF]"
              : "text-gray-700 hover:bg-[#F3E8F7] hover:text-[#9F64AF]"
          }`}
        >
          <span className="flex items-center gap-2">
            <MdOutlineMeetingRoom size={16} />
            Ativas
          </span>
          {isActive("ativo") && <span className="text-[#9F64AF]">✓</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            onFiltroChange("inativo");
            onClose();
          }}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
            isActive("inativo")
              ? "bg-[#F3E8F7] text-[#9F64AF]"
              : "text-gray-700 hover:bg-[#F3E8F7] hover:text-[#9F64AF]"
          }`}
        >
          <span className="flex items-center gap-2">
            <MdOutlineNoMeetingRoom size={16} />
            Inativas
          </span>
          {isActive("inativo") && <span className="text-[#9F64AF]">✓</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            onFiltroChange("todos");
            onClose();
          }}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
            isActive("todos")
              ? "bg-[#F3E8F7] text-[#9F64AF]"
              : "text-gray-700 hover:bg-[#F3E8F7] hover:text-[#9F64AF]"
          }`}
        >
          <span className="flex items-center gap-2">
            <MdOutlineDoorSliding size={16} />
            Todas
          </span>
          {isActive("todos") && <span className="text-[#9F64AF]">✓</span>}
        </button>
      </div>
    </div>
  );
}

function ModalSala({
  sala,
  salas,
  salvando,
  onClose,
  onSalvar,
}: ModalSalaProps) {
  const [nome, setNome] = useState(sala?.nome || "");
  const [tipo, setTipo] = useState<TipoSala>(sala?.tipo || "geral");
  const [nomeTocado, setNomeTocado] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [tipoAberto, setTipoAberto] = useState(false);
  const tipoRef = useRef<HTMLDivElement | null>(null);
  const nomeNormalizado = normalizarNomeSala(nome);
  // Duplicidade: o modal antecipa a regra da API para evitar envio de nomes
  // equivalentes na mesma clínica, mas o bloqueio definitivo continua no back-end.
  const nomeDuplicado = salas.some(
    (item) =>
      item.id !== sala?.id && normalizarNomeSala(item.nome) === nomeNormalizado,
  );
  const erroNome = !nome.trim()
    ? "Informe o nome da sala"
    : nomeDuplicado
      ? "Já existe uma sala com esse nome"
      : "";
  const mostrarErroNome = (nomeTocado || tentouSalvar) && Boolean(erroNome);

  useEffect(() => {
    if (!tipoAberto) return;

    function handleClickOutside(evento: MouseEvent) {
      if (tipoRef.current && !tipoRef.current.contains(evento.target as Node)) {
        setTipoAberto(false);
      }
    }

    function handleKeyDown(evento: KeyboardEvent) {
      if (evento.key === "Escape") setTipoAberto(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [tipoAberto]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(evento) => {
        if (evento.key === "Escape") onClose();
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EAF8]">
              <MdOutlineMeetingRoom size={28} className="text-[#9F64AF]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {sala ? "Editar sala" : "Nova sala"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Configure um recurso que poderá ser usado pela Agenda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="nome-sala"
              className="mb-1 block text-xs font-medium text-gray-800"
            >
              Nome
            </label>
            <input
              id="nome-sala"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              onBlur={() => setNomeTocado(true)}
              placeholder="Ex: Sala 1"
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF] ${
                mostrarErroNome
                  ? "border-rose-300 bg-rose-50"
                  : "border-[#9F64AF]/20"
              }`}
            />
            {mostrarErroNome && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                <MdErrorOutline size={14} />
                {erroNome}
              </p>
            )}
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-gray-800">
              Tipo
            </span>
            <div ref={tipoRef} className="relative">
              <button
                type="button"
                onClick={() => setTipoAberto((atual) => !atual)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-3 py-2 text-left text-sm font-medium text-gray-900 outline-none transition hover:bg-[#F3EAF8] focus:border-transparent focus:ring-2 focus:ring-[#9F64AF]"
              >
                <span>
                  {tipo === "geral"
                    ? "Atendimento Geral"
                    : "Atendimento Infantil"}
                </span>
                <span className="text-[#9F64AF]">▾</span>
              </button>

              {tipoAberto ? (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg">
                  {[
                    { valor: "geral" as const, label: "Atendimento Geral" },
                    {
                      valor: "infantil" as const,
                      label: "Atendimento Infantil",
                    },
                  ].map((opcao) => {
                    const selecionada = tipo === opcao.valor;

                    return (
                      <button
                        key={opcao.valor}
                        type="button"
                        onClick={() => {
                          setTipo(opcao.valor);
                          setTipoAberto(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                          selecionada
                            ? "bg-[#F3EAF8] text-[#9F64AF]"
                            : "text-gray-700 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                        }`}
                      >
                        <span className="font-medium">{opcao.label}</span>
                        {selecionada ? (
                          <span className="text-[#9F64AF]">✓</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={salvando}
            onClick={() => {
              setTentouSalvar(true);
              if (erroNome) return;
              onSalvar({ nome: nome.trim(), tipo });
            }}
            className="flex-1 rounded-lg bg-[#9F64AF] px-4 py-2 text-white transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Salas({ podeEditar, onCabecalhoChange }: SalasProps) {
  const { query, criar, atualizar, inativar, reativar, excluir } = useSalas();
  const [modalAberto, setModalAberto] = useState(false);
  const [salaEditando, setSalaEditando] = useState<Sala | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusSala>("ativo");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modalConfirmacao, setModalConfirmacao] = useState<{
    isOpen: boolean;
    tipo: TipoAcaoSala;
    sala: Sala | null;
  }>({ isOpen: false, tipo: "inativar", sala: null });
  const salas = query.data || [];
  const itensPorPagina = 10;

  const salasFiltradas = useMemo(() => {
    const termoBusca = normalizarNomeSala(busca);

    // Filtros e busca: seguem a experiência de Pacientes e ficam derivados da
    // query de salas, sem fetch manual ou carregamento paralelo no componente.
    return salas
      .filter((sala) => {
        const ativa = salaEstaAtiva(sala);
        if (filtroStatus === "ativo" && !ativa) return false;
        if (filtroStatus === "inativo" && ativa) return false;
        return normalizarNomeSala(sala.nome).includes(termoBusca);
      })
      .sort((salaA, salaB) => {
        const statusA = salaEstaAtiva(salaA) ? 0 : 1;
        const statusB = salaEstaAtiva(salaB) ? 0 : 1;
        if (statusA !== statusB) return statusA - statusB;
        return salaA.nome.localeCompare(salaB.nome, "pt-BR");
      });
  }, [busca, filtroStatus, salas]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(salasFiltradas.length / itensPorPagina),
  );
  const salasPaginadas = salasFiltradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina,
  );
  const buscaAtiva = busca.trim() !== "";

  useEffect(() => {
    // Cabeçalho dinâmico: mantém Salas no mesmo comportamento de Pacientes,
    // onde título e descrição acompanham o filtro selecionado.
    onCabecalhoChange?.(CABECALHOS_SALAS[filtroStatus]);
  }, [filtroStatus, onCabecalhoChange]);

  const abrirNovaSala = () => {
    setSalaEditando(null);
    setModalAberto(true);
  };

  const abrirEdicao = (sala: Sala) => {
    setSalaEditando(sala);
    setModalAberto(true);
  };

  const salvarSala = (dados: SalaPayload) => {
    if (salaEditando) {
      atualizar.mutate(
        {
          id: salaEditando.id,
          dados: { ...dados, ativo: salaEstaAtiva(salaEditando) },
        },
        {
          onSuccess: () => {
            toast.success("Sala atualizada", TOAST_NEUROSYNC);
            setModalAberto(false);
          },
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }

    criar.mutate(dados, {
      onSuccess: () => {
        toast.success("Sala cadastrada", TOAST_NEUROSYNC);
        setModalAberto(false);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleAlternarStatus = (sala: Sala) => {
    // Inativação: salas inativas continuam disponíveis para histórico clínico,
    // mas ficam fora da futura seleção de novos agendamentos.
    const proximoStatus = !salaEstaAtiva(sala);
    const mutation = proximoStatus ? reativar : inativar;

    mutation.mutate(sala.id, {
      onSuccess: () =>
        toast.success(
          proximoStatus ? "Sala reativada" : "Sala inativada",
          TOAST_NEUROSYNC,
        ),
      onError: (error) => toast.error(error.message),
    });
  };

  const handleExcluir = (sala: Sala) => {
    excluir.mutate(sala.id, {
      onSuccess: (resposta) =>
        toast.success(resposta.message || "Sala excluída", TOAST_NEUROSYNC),
      onError: (error) => toast.error(error.message),
    });
  };

  const abrirConfirmacao = (tipo: TipoAcaoSala, sala: Sala) => {
    if (!podeEditar) return;
    setModalConfirmacao({ isOpen: true, tipo, sala });
  };

  const confirmarAcaoSala = () => {
    if (!modalConfirmacao.sala) return;

    if (modalConfirmacao.tipo === "excluir") {
      // Exclusão: segue o padrão operacional de Pacientes, usando exclusão
      // lógica apenas quando não houver histórico vinculado.
      handleExcluir(modalConfirmacao.sala);
    } else {
      handleAlternarStatus(modalConfirmacao.sala);
    }

    setModalConfirmacao({ isOpen: false, tipo: "inativar", sala: null });
  };

  const tituloConfirmacao =
    modalConfirmacao.tipo === "inativar"
      ? "Inativar sala"
      : modalConfirmacao.tipo === "reativar"
        ? "Reativar sala"
        : "Excluir sala";
  const mensagemConfirmacao =
    modalConfirmacao.tipo === "inativar"
      ? `Tem certeza que deseja inativar ${modalConfirmacao.sala?.nome}? A sala não aparecerá para novos agendamentos.`
      : modalConfirmacao.tipo === "reativar"
        ? `Tem certeza que deseja reativar ${modalConfirmacao.sala?.nome}? A sala voltará a ficar disponível para uso futuro na Agenda.`
        : `Tem certeza que deseja excluir ${modalConfirmacao.sala?.nome}? Salas com histórico não podem ser excluídas, apenas inativadas.`;

  return (
    <section>
      {/* Reutilização do padrão visual de Pacientes: após o cabeçalho dinâmico,
          a primeira linha do módulo é a barra operacional de busca e filtro. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-[380px] max-w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={busca}
              onChange={(evento) => {
                setBusca(evento.target.value);
                setPaginaAtual(1);
              }}
              placeholder="Buscar por nome da sala..."
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9F64AF]"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltroAberto(!filtroAberto)}
              className="rounded-xl border border-gray-300 p-2.5 text-gray-600 transition hover:bg-gray-50"
              title="Filtrar salas"
            >
              <SlidersHorizontal size={18} />
            </button>

            {filtroAberto && (
              <FiltroSalasCard
                filtroAtual={filtroStatus}
                onFiltroChange={(filtro) => {
                  setFiltroStatus(filtro);
                  setPaginaAtual(1);
                }}
                onClose={() => setFiltroAberto(false)}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            {/* Contagem: segue Pacientes com um único total baseado no filtro
                atual, sem resumo paralelo de ativas/inativas. */}
            <span className="whitespace-nowrap">
              {salasFiltradas.length}{" "}
              {salasFiltradas.length === 1 ? "sala" : "salas"}
            </span>
          </div>
        </div>

        {podeEditar && (
          <button
            type="button"
            onClick={abrirNovaSala}
            className="flex items-center gap-2 rounded-xl bg-[#9F64AF] px-5 py-2 text-white shadow-sm hover:bg-[#8B509B]"
          >
            <Plus size={16} />
            <span>Nova Sala</span>
          </button>
        )}
      </div>

      {query.isLoading && (
        <div className="flex items-center justify-center py-16">
          <div>
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
            <p className="text-sm text-gray-400">Carregando salas...</p>
          </div>
        </div>
      )}

      {!query.isLoading && salasFiltradas.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#F3EAF8]">
            {filtroStatus === "inativo" ? (
              <MdOutlineNoMeetingRoom size={32} className="text-[#9F64AF]" />
            ) : filtroStatus === "todos" ? (
              <MdOutlineDoorSliding size={32} className="text-[#9F64AF]" />
            ) : (
              <MdOutlineMeetingRoom size={32} className="text-[#9F64AF]" />
            )}
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-800">
            {buscaAtiva
              ? "Nenhuma sala encontrada"
              : filtroStatus === "ativo"
                ? "Nenhuma sala ativa"
                : filtroStatus === "inativo"
                  ? "Nenhuma sala inativa"
                  : "Nenhuma sala cadastrada"}
          </h3>
          <p className="mb-6 text-sm text-gray-400">
            {buscaAtiva
              ? "Tente outros termos ou ajuste o filtro selecionado."
              : filtroStatus === "ativo"
                ? "Salas ativas aparecerão aqui."
                : filtroStatus === "inativo"
                  ? "Salas inativas aparecerão aqui."
                  : "Cadastre salas para preparar a clínica para a Agenda."}
          </p>

          {podeEditar && !buscaAtiva && filtroStatus !== "inativo" && (
            <button
              type="button"
              onClick={abrirNovaSala}
              className="flex items-center gap-2 rounded-xl bg-[#9F64AF] px-5 py-2.5 text-white shadow-sm transition-all duration-200 hover:bg-[#8B509B] hover:shadow-md"
            >
              <Plus size={16} />
              <span className="text-sm font-medium">Adicionar Sala</span>
            </button>
          )}
        </div>
      )}

      {!query.isLoading && salasFiltradas.length > 0 && (
        <div className="space-y-3">
          {salasPaginadas.map((sala) => {
            const ativa = salaEstaAtiva(sala);
            const possuiHistoricoConsultas = Boolean(sala.possui_consultas);
            const tipo = TIPOS_SALA[sala.tipo] || TIPOS_SALA.geral;
            const IconeSala = ativa
              ? MdOutlineMeetingRoom
              : MdOutlineNoMeetingRoom;

            return (
              <motion.div
                key={sala.id}
                layout
                className="group flex cursor-default items-center justify-between rounded-xl border border-gray-100 bg-white/80 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-gray-50/50 hover:shadow-md"
              >
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <IconeSala size={16} className="shrink-0 text-gray-400" />
                    <h3 className="text-base font-semibold text-gray-800">
                      {sala.nome}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        sala.tipo === "infantil"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-[#F3E8F7] text-[#9F64AF]"
                      }`}
                    >
                      {tipo.label}
                    </span>
                    {/* Badges: seguem a mesma hierarquia de ItemPaciente,
                      com status operacional e tipo da sala em pílulas pequenas. */}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        ativa
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-400 text-gray-900"
                      }`}
                    >
                      {ativa ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  {/* Preparação para Agenda: a ordenação, busca, filtros e
                    paginação local antecipam o uso da sala como recurso
                    agendável com disponibilidade futura. */}
                </div>

                {podeEditar && (
                  <div className="ml-4 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEdicao(sala)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-[#9F64AF] hover:text-white"
                    >
                      <Edit3 size={14} /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        abrirConfirmacao(ativa ? "inativar" : "reativar", sala)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-[#9F64AF] hover:text-white"
                    >
                      {ativa ? (
                        <MdOutlineNoMeetingRoom size={14} />
                      ) : (
                        <ArchiveRestore size={14} />
                      )}
                      {ativa ? "Inativar" : "Reativar"}
                    </button>
                    <span
                      className="inline-flex"
                      title={
                        possuiHistoricoConsultas
                          ? "Esta sala possui consultas vinculadas e não pode ser excluída."
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        disabled={possuiHistoricoConsultas}
                        onClick={() => abrirConfirmacao("excluir", sala)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-[#9F64AF] hover:text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100 disabled:hover:text-gray-400"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}

          {totalPaginas > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setPaginaAtual((pagina) => pagina - 1)}
                disabled={paginaAtual === 1}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-1.5 text-sm text-gray-700">
                Página {paginaAtual} de {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPaginaAtual((pagina) => pagina + 1)}
                disabled={paginaAtual === totalPaginas}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {modalAberto && (
          <ModalSala
            sala={salaEditando}
            salas={salas}
            salvando={criar.isPending || atualizar.isPending}
            onClose={() => setModalAberto(false)}
            onSalvar={salvarSala}
          />
        )}
      </AnimatePresence>

      <ConfirmarAcaoModal
        isOpen={modalConfirmacao.isOpen}
        onClose={() =>
          setModalConfirmacao({ isOpen: false, tipo: "inativar", sala: null })
        }
        onConfirm={confirmarAcaoSala}
        titulo={tituloConfirmacao}
        mensagem={mensagemConfirmacao}
        tipo={
          modalConfirmacao.tipo === "reativar"
            ? "reativar"
            : modalConfirmacao.tipo
        }
        confirmando={
          inativar.isPending || reativar.isPending || excluir.isPending
        }
      />
    </section>
  );
}
