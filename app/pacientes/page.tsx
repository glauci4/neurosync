// app/pacientes/page.tsx
// Página principal do módulo de pacientes. Gerencia a listagem com filtros de visibilidade (ativo/inativo/todos), status de atendimento, busca, paginação e modais de cadastro, edição e detalhes.
// A prop `tipoVazio` é passada para `ListaPacientes` para personalizar mensagens de estado vazio.

"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSidebar } from "@/app/context/SidebarContext";
import Sidebar from "@/app/inicio/components/Sidebar";
import { useAlternarStatusPaciente } from "@/hooks/useAlternarStatusPaciente";
import { useAtualizarStatusAtendimento } from "@/hooks/useAtualizarStatusAtendimento";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import { useExcluirPaciente } from "@/hooks/useExcluirPaciente";
import { useListarPacientes } from "@/hooks/useListarPacientes";
import BarraFiltros from "./components/BarraFiltros";
import CabecalhoPacientes from "./components/CabecalhoPacientes";
import CadastroPacienteModal from "./components/CadastroPacienteModal";
import ConfirmarAcaoModal from "./components/ConfirmarAcaoModal";
import DetalhesPacienteModal from "./components/DetalhesPacienteModal";
import EditarPacienteModal from "./components/EditarPacienteModal";
import ListaPacientes from "./components/ListaPacientes";
import TabsStatusAtendimento from "./components/TabsStatusAtendimento";
import ImportarPacientesModal from "./importacao/modals/ImportarPacientesModal";

type Visibilidade = "ativo" | "inativo" | "todos";
type StatusAtendimento = "fila_espera" | "em_atendimento" | "encerrado";

export default function PacientesPage() {
  const {
    usuario,
    carregando: authCarregando,
    fazerLogout,
  } = useAutenticacao();
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  // ESTADOS
  const [visibilidade, setVisibilidade] = useState<Visibilidade>("ativo");
  const [statusAtendimento, setStatusAtendimento] =
    useState<StatusAtendimento>("fila_espera");
  const [busca, setBusca] = useState("");
  const [buscaDebounce, setBuscaDebounce] = useState("");
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 10;

  // Estados dos modais
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [editandoPacienteId, setEditandoPacienteId] = useState<number | null>(
    null,
  );
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [pacienteIdDetalhes, setPacienteIdDetalhes] = useState<number | null>(
    null,
  );
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);

  // Estado para o modal de confirmação (inativar/reativar/excluir)
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    tipo: "inativar" | "reativar" | "excluir";
    pacienteId: number;
    pacienteNome: string;
    novoStatus?: boolean;
  }>({
    isOpen: false,
    tipo: "inativar",
    pacienteId: 0,
    pacienteNome: "",
    novoStatus: undefined,
  });

  // HOOKS DE MUTAÇÃO
  const { mutate: alternarStatus } = useAlternarStatusPaciente();
  const { mutate: excluirPaciente } = useExcluirPaciente();
  const { mutateAsync: atualizarStatusAtendimento } =
    useAtualizarStatusAtendimento();

  // DEBOUNCE DA BUSCA
  const handleBuscaChange = useCallback((valor: string) => {
    setBusca(valor);
    const timeout = setTimeout(() => {
      setBuscaDebounce(valor);
      setPagina(1);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  // REQUISIÇÃO DE DADOS
  const { data, isLoading, error, refetch } = useListarPacientes({
    visibilidade: visibilidade,
    status_atendimento: statusAtendimento,
    busca: buscaDebounce,
    page: pagina,
    limit: itensPorPagina,
  });

  const pacientes = data?.data || [];
  const totalRegistros = data?.paginacao?.total || 0;
  const totalPaginas = data?.paginacao?.totalPages || 1;

  // EFEITO PARA ABRIR O MODAL DE CADASTRO SE HOUVER O PARÂMETRO "cadastrar=1" NA URL (ex: após cadastro rápido ou clique em "Cadastrar novo paciente" na barra de filtros)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cadastrar") === "1") {
      setModalCadastroAberto(true);
    }
  }, []);

  // AÇÕES
  const handleNovoPaciente = () => setModalCadastroAberto(true);
  const handleImportarDados = () => setModalImportacaoAberto(true);

  const handleMudarPagina = (novaPagina: number) => {
    setPagina(novaPagina);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAbrirDetalhes = (id: number) => {
    setPacienteIdDetalhes(id);
    setModalDetalhesAberto(true);
  };

  // Callbacks para o modal de detalhes
  const handleEditarDoModal = () => {
    if (pacienteIdDetalhes) {
      setEditandoPacienteId(pacienteIdDetalhes);
      setModalEdicaoAberto(true);
      setModalDetalhesAberto(false);
    }
  };

  const handleInativarPaciente = () => {
    if (pacienteIdDetalhes) {
      const nome =
        pacientes.find((p) => p.id === pacienteIdDetalhes)?.nome || "paciente";
      setModalConfig({
        isOpen: true,
        tipo: "inativar",
        pacienteId: pacienteIdDetalhes,
        pacienteNome: nome,
        novoStatus: false,
      });
    }
  };

  const handleReativarCadastro = () => {
    if (pacienteIdDetalhes) {
      const nome =
        pacientes.find((p) => p.id === pacienteIdDetalhes)?.nome || "paciente";
      setModalConfig({
        isOpen: true,
        tipo: "reativar",
        pacienteId: pacienteIdDetalhes,
        pacienteNome: nome,
        novoStatus: true,
      });
    }
  };

  const handleExcluirPaciente = () => {
    if (pacienteIdDetalhes) {
      const nome =
        pacientes.find((p) => p.id === pacienteIdDetalhes)?.nome || "paciente";
      setModalConfig({
        isOpen: true,
        tipo: "excluir",
        pacienteId: pacienteIdDetalhes,
        pacienteNome: nome,
      });
    }
  };

  // NOVOS CALLBACKS PARA STATUS DE ATENDIMENTO
  const handleIniciarAtendimento = async (id: number) => {
    await atualizarStatusAtendimento({ id, status: "em_atendimento" });
    setModalDetalhesAberto(false);
    sessionStorage.setItem(
      "neurosync:nova_consulta_paciente",
      JSON.stringify({ paciente_id: id, abrir_nova_consulta: "1" }),
    );
    router.push(`/agenda?abrir_nova_consulta=1&paciente_agendar_id=${id}`);
  };

  const handleEncerrarAtendimento = (id: number) => {
    atualizarStatusAtendimento({ id, status: "encerrado" });
    setModalDetalhesAberto(false);
    refetch();
  };

  const handleRetomarAtendimento = (id: number) => {
    atualizarStatusAtendimento({ id, status: "fila_espera" });
    setModalDetalhesAberto(false);
    refetch();
  };

  const handleConfirm = () => {
    const { tipo, pacienteId, novoStatus } = modalConfig;
    if (tipo === "excluir") {
      excluirPaciente(pacienteId);
    } else if (novoStatus !== undefined) {
      alternarStatus({ id: pacienteId, ativo: novoStatus });
    }
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
    // Fecha também o modal de detalhes, se estiver aberto
    if (modalDetalhesAberto) setModalDetalhesAberto(false);
  };

  const handleCloseModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Callback para fechar o modal de edição e recarregar
  const handleFecharEdicao = () => {
    setModalEdicaoAberto(false);
    setEditandoPacienteId(null);
    refetch();
  };

  // DETERMINA O TIPO DE VAZIO
  const tipoVazio =
    visibilidade === "inativo"
      ? "inativos"
      : (visibilidade === "ativo" || visibilidade === "todos") &&
          statusAtendimento
        ? statusAtendimento
        : undefined;

  // LOADING INICIAL
  if (authCarregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) return null;

  const perfilId =
    usuario.perfil_id || (usuario.perfil === "psicologo" ? 2 : 1);
  const marginLeft = isCollapsed ? "ml-20" : "ml-64";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0]">
      <Sidebar perfilId={perfilId} onLogout={fazerLogout} usuario={usuario} />

      <div className={marginLeft}>
        <div className="pt-8 px-8 pb-2">
          <CabecalhoPacientes
            status={
              visibilidade === "ativo"
                ? "ativo"
                : visibilidade === "inativo"
                  ? "inativo"
                  : "todos"
            }
          />

          <BarraFiltros
            busca={busca}
            onBuscaChange={handleBuscaChange}
            visibilidade={visibilidade}
            onVisibilidadeChange={setVisibilidade}
            totalRegistros={totalRegistros}
            onNovoPaciente={handleNovoPaciente}
            onImportarDados={handleImportarDados}
          />

          <TabsStatusAtendimento
            statusAtual={statusAtendimento}
            onStatusChange={setStatusAtendimento}
            totalFilaEspera={0}
            totalEmAtendimento={0}
            totalEncerrados={0}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6"
          >
            <ListaPacientes
              pacientes={pacientes}
              isLoading={isLoading}
              error={error?.message}
              status={
                visibilidade === "ativo"
                  ? "ativo"
                  : visibilidade === "inativo"
                    ? "inativo"
                    : "todos"
              }
              tipoVazio={tipoVazio}
              onRefetch={refetch}
              paginaAtual={pagina}
              totalPaginas={totalPaginas}
              onMudarPagina={handleMudarPagina}
              buscaAtiva={buscaDebounce !== ""}
              onAbrirDetalhes={handleAbrirDetalhes}
            />
          </motion.div>
        </div>
      </div>

      {/* Modais */}
      <CadastroPacienteModal
        isOpen={modalCadastroAberto}
        onClose={() => setModalCadastroAberto(false)}
        onSuccess={() => refetch()}
      />

      <ImportarPacientesModal
        isOpen={modalImportacaoAberto}
        onClose={() => setModalImportacaoAberto(false)}
        onSuccess={() => refetch()}
      />

      {editandoPacienteId && (
        <EditarPacienteModal
          isOpen={modalEdicaoAberto}
          onClose={handleFecharEdicao}
          pacienteId={editandoPacienteId}
          onSuccess={() => refetch()}
        />
      )}

      {modalDetalhesAberto && pacienteIdDetalhes && (
        <DetalhesPacienteModal
          isOpen={modalDetalhesAberto}
          pacienteId={pacienteIdDetalhes}
          onClose={() => setModalDetalhesAberto(false)}
          onEditar={handleEditarDoModal}
          onInativar={handleInativarPaciente}
          onReativarCadastro={handleReativarCadastro}
          onExcluir={handleExcluirPaciente}
          onIniciarAtendimento={handleIniciarAtendimento}
          onEncerrarAtendimento={handleEncerrarAtendimento}
          onRetomarAtendimento={handleRetomarAtendimento}
        />
      )}

      <ConfirmarAcaoModal
        isOpen={modalConfig.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        titulo={
          modalConfig.tipo === "inativar"
            ? "Inativar paciente"
            : modalConfig.tipo === "reativar"
              ? "Reativar paciente"
              : "Excluir paciente"
        }
        mensagem={
          modalConfig.tipo === "inativar"
            ? `Tem certeza que deseja inativar ${modalConfig.pacienteNome}? O paciente será movido para a lista de inativos.`
            : modalConfig.tipo === "reativar"
              ? `Tem certeza que deseja reativar ${modalConfig.pacienteNome}? O paciente voltará para a lista de ativos.`
              : `Tem certeza que deseja excluir permanentemente o paciente ${modalConfig.pacienteNome}? Esta ação não pode ser desfeita.`
        }
        tipo={modalConfig.tipo}
        confirmando={false}
      />
    </div>
  );
}
