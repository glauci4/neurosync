// app/pacientes/components/DetalhesPacienteModal.tsx
// Modal de detalhes do paciente exibe informações completas e ações de atendimento/cadastro. Utiliza o hook usePacientePorId para buscar os dados, e tem estados de carregamento e erro. A interface é organizada em seções com ícones e campos formatados (telefone, CPF, renda). Ações de atendimento são condicionais ao status do paciente, e ações de cadastro permitem editar, inativar/reactivar ou excluir o paciente (com validação para exclusão).

"use client";

import { motion } from "framer-motion";
import {
  Archive,
  ClipboardList,
  IdCard,
  PenLine,
  RotateCcw,
  Smartphone,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { BiTransfer } from "react-icons/bi";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { toast } from "sonner";
import { useFiltrosAgenda } from "@/app/agenda/hooks/useAgenda";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import { useDefinirResponsavelPaciente } from "@/hooks/useDefinirResponsavelPaciente";
import { usePacientePorId } from "@/hooks/usePacientePorId";
import { formatarCPF, formatarTelefone } from "@/lib/utils";
import PsicologoCombobox from "./PsicologoCombobox";
import TransferirAcompanhamentoModal from "./TransferirAcompanhamentoModal";

interface DetalhesPacienteModalProps {
  isOpen: boolean;
  pacienteId: number;
  onClose: () => void;
  onIniciarAtendimento?: (id: number) => void;
  onEncerrarAtendimento?: (id: number) => void;
  onRetomarAtendimento?: (id: number) => void;
  onEditar: () => void;
  onInativar: () => void;
  onReativarCadastro?: () => void;
  onExcluir: () => void;
}

// Componentes auxiliares para manter o código organizado e reutilizável

// Exibe um campo com label em cinza claro e valor em negrito escuro
function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  const valor =
    value === null ||
    value === undefined ||
    value === "" ||
    value === 0 ||
    value === "0"
      ? "Não informado"
      : value;

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="font-medium text-slate-900 break-words whitespace-pre-line">
        {valor}
      </p>
    </div>
  );
}

function normalizarPreferenciaNaoInformar(valor?: string | null) {
  return valor === "Prefiro não informar" ? "Prefere não informar" : valor;
}

// Seção agrupada com ícone lilás e título em caixa alta
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-[#9F64AF]" /> {title}
      </h3>
      {children}
    </section>
  );
}

// Componente principal do modal de detalhes do paciente

export default function DetalhesPacienteModal({
  isOpen,
  pacienteId,
  onClose,
  onIniciarAtendimento,
  onEncerrarAtendimento,
  onRetomarAtendimento,
  onEditar,
  onInativar,
  onReativarCadastro,
  onExcluir,
}: DetalhesPacienteModalProps) {
  const { usuario } = useAutenticacao();
  const {
    data: paciente,
    isLoading,
    error,
  } = usePacientePorId(isOpen ? pacienteId : null);
  const { data: filtrosAgenda } = useFiltrosAgenda();
  const [transferirAberto, setTransferirAberto] = useState(false);
  const [definirResponsavelAberto, setDefinirResponsavelAberto] =
    useState(false);
  const [
    psicologoResponsavelSelecionadoId,
    setPsicologoResponsavelSelecionadoId,
  ] = useState("");
  const [erroDefinirResponsavel, setErroDefinirResponsavel] = useState("");
  const definirResponsavel = useDefinirResponsavelPaciente();

  if (!isOpen) return null;

  // Exclusão: paciente precisa estar na fila de espera e não ter consultas registradas
  const podeExcluir =
    (paciente?.podeExcluir === true || paciente?.podeExcluir === 1) &&
    paciente?.status_atendimento === "fila_espera";
  const isAtivo = Number(paciente?.ativo) === 1;

  // Configuração visual dos status de atendimento
  const statusConfig: Record<string, { label: string; className: string }> = {
    fila_espera: {
      label: "Fila de Espera",
      className: "bg-amber-100 text-amber-700",
    },
    em_atendimento: {
      label: "Em Atendimento",
      className: "bg-emerald-100 text-emerald-700",
    },
    encerrado: { label: "Encerrado", className: "bg-slate-100 text-slate-600" },
  };

  // Formata valor de renda para o padrão brasileiro
  const formatarRenda = (renda: unknown): string => {
    if (!renda) return "Não informado";
    const valor = Number(renda);
    if (Number.isNaN(valor)) return "Não informado";
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Handlers para ações de atendimento e cadastro
  const handleIniciarAtendimento = () => {
    if (onIniciarAtendimento && paciente) {
      onIniciarAtendimento(paciente.id);
      onClose();
    }
  };
  const handleEncerrarAtendimento = () => {
    if (onEncerrarAtendimento && paciente) {
      onEncerrarAtendimento(paciente.id);
      onClose();
    }
  };
  const handleRetomarAtendimento = () => {
    if (onRetomarAtendimento && paciente) {
      onRetomarAtendimento(paciente.id);
      onClose();
    }
  };
  const handleReativarCadastro = () => {
    if (onReativarCadastro) {
      onReativarCadastro();
      onClose();
    }
  };
  const handleExcluirPaciente = () => {
    if (!podeExcluir) return;
    onExcluir();
  };

  const status = paciente?.status_atendimento
    ? statusConfig[paciente.status_atendimento]
    : null;

  const temResponsavel = Boolean(paciente?.psicologo_responsavel_id);
  const temHistoricoAcompanhamento = Boolean(
    paciente?.psicologo_responsavel_nome ||
      paciente?.psicologo_responsavel_crp ||
      paciente?.psicologo_responsavel_atribuido_em_formatada ||
      paciente?.psicologo_responsavel_atribuido_por_nome,
  );
  const pacienteEncerradoOuInativo =
    !isAtivo || paciente?.status_atendimento === "encerrado";
  const podeDefinirResponsavel =
    isAtivo &&
    paciente?.status_atendimento === "em_atendimento" &&
    !temResponsavel;

  const acompanhamentoSemHistorico =
    pacienteEncerradoOuInativo && !temHistoricoAcompanhamento;

  const podeTransferirAcompanhamento = Boolean(
    usuario?.perfil_id === 2 &&
      paciente?.psicologo_responsavel_id &&
      paciente?.status_atendimento === "em_atendimento" &&
      (usuario?.isResponsavelClinica ||
        Number(usuario?.id) === Number(paciente.psicologo_responsavel_id)),
  );

  const enderecoFormatado = (() => {
    const limpar = (texto?: string | null) =>
      String(texto || "")
        .replace(/[•·]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const rua = limpar(paciente?.rua);
    const numero = limpar(paciente?.numero);
    const bairro = limpar(paciente?.bairro);
    const cidade = limpar(paciente?.cidade);
    const estado = limpar(paciente?.estado);
    const cep = limpar(paciente?.cep);

    const linha1 = [rua, numero].filter(Boolean).join(", ");
    const linha1Final = [linha1, bairro ? `- ${bairro}` : ""]
      .filter(Boolean)
      .join(" ")
      .trim();
    const linha2 = [
      [cidade, estado].filter(Boolean).join("/"),
      cep ? `- CEP ${cep}` : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return [linha1Final, linha2].filter(Boolean).join("\n");
  })();

  const psicologosAtivos =
    filtrosAgenda?.data.psicologos?.map((psicologo) => ({
      valor: String(psicologo.id),
      label: psicologo.nome,
    })) || [];

  const fecharDefinirResponsavel = () => {
    setDefinirResponsavelAberto(false);
    setPsicologoResponsavelSelecionadoId("");
    setErroDefinirResponsavel("");
  };

  const confirmarDefinirResponsavel = async () => {
    if (!paciente) return;

    if (!psicologoResponsavelSelecionadoId) {
      setErroDefinirResponsavel("Selecione um psicólogo responsável.");
      return;
    }

    try {
      await definirResponsavel.mutateAsync({
        pacienteId: paciente.id,
        psicologo_id: Number(psicologoResponsavelSelecionadoId),
      });
      toast.success("Responsável definido com sucesso");
      fecharDefinirResponsavel();
    } catch (erro) {
      setErroDefinirResponsavel(
        erro instanceof Error ? erro.message : "Erro ao definir responsável",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay escuro com blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Card do modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Botão fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Estado de carregamento */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Estado de erro */}
        {error && (
          <div className="text-red-500 text-center py-8">
            Erro ao carregar dados do paciente.
          </div>
        )}

        {/* Conteúdo dos detalhes do paciente */}
        {paciente && !isLoading && (
          <div className="p-6 space-y-6">
            {/* Cabeçalho com avatar, nome, tipo e status */}
            <header className="flex items-start gap-4 pr-8">
              <div className="w-14 h-14 rounded-full bg-[#F3E8F7] flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-[#9F64AF]" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-slate-900 truncate">
                  {paciente.nome}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {/* Badge de tipo (Adulto/Menor) */}
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F3E8F7] text-[#9F64AF]">
                    {paciente.tipo === "adulto" ? "Adulto" : "Menor"}
                  </span>
                  {/* Badge de status de atendimento */}
                  {status && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.className}`}
                    >
                      {status.label}
                    </span>
                  )}
                  {/* Badge de inativo (só aparece se paciente não estiver ativo) */}
                  {!isAtivo && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      Inativo
                    </span>
                  )}
                </div>
              </div>
            </header>

            {/* Seção: Acompanhamento Clínico */}
            <Section
              icon={HiOutlineClipboardDocumentList}
              title="Acompanhamento clínico"
            >
              <div className="rounded-2xl border border-[#E5D9F3] bg-[#FAF7FC] px-3.5 py-3">
                <div className="flex flex-col gap-2.5">
                  {acompanhamentoSemHistorico ? (
                    <p className="text-sm text-slate-500">
                      Paciente sem histórico de acompanhamento clínico.
                    </p>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800">
                          {paciente?.status_atendimento === "fila_espera"
                            ? "Acompanhamento ainda não iniciado."
                            : temResponsavel
                              ? pacienteEncerradoOuInativo
                                ? "Último responsável"
                                : "Psicólogo responsável"
                              : "Acompanhamento sem responsável"}
                        </h4>
                        {!temHistoricoAcompanhamento &&
                        paciente?.status_atendimento === "fila_espera" ? (
                          <p className="mt-1 text-sm text-slate-500">
                            O responsável será definido ao agendar a primeira
                            consulta.
                          </p>
                        ) : temResponsavel ? (
                          <p className="mt-1 text-sm text-slate-500">
                            {pacienteEncerradoOuInativo
                              ? "Último acompanhamento registrado para este paciente."
                              : "Acompanhamento vinculado ao psicólogo atual."}
                          </p>
                        ) : podeDefinirResponsavel ? (
                          <p className="mt-1 text-sm text-slate-500">
                            Este paciente ainda não possui psicólogo responsável
                            definido.
                          </p>
                        ) : null}
                      </div>

                      {podeDefinirResponsavel && (
                        <button
                          type="button"
                          onClick={() => {
                            setPsicologoResponsavelSelecionadoId("");
                            setErroDefinirResponsavel("");
                            setDefinirResponsavelAberto(true);
                          }}
                          className="w-fit rounded-xl border border-[#9F64AF]/20 bg-white px-3 py-2 text-xs font-medium text-[#9F64AF] shadow-sm transition hover:border-[#9F64AF] hover:bg-[#F9F4FC]"
                        >
                          Definir responsável
                        </button>
                      )}

                      {temResponsavel && (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                          <Field
                            label={
                              pacienteEncerradoOuInativo
                                ? "Último psicólogo"
                                : "Psicólogo"
                            }
                            value={
                              paciente.psicologo_responsavel_nome ||
                              "Não informado"
                            }
                          />
                          <Field
                            label="CRP"
                            value={
                              paciente.psicologo_responsavel_crp ||
                              "Não informado"
                            }
                          />
                          <Field
                            label={
                              pacienteEncerradoOuInativo
                                ? "Definido em"
                                : "Atribuído em"
                            }
                            value={
                              paciente.psicologo_responsavel_atribuido_em_formatada ||
                              "Não informado"
                            }
                          />
                          <Field
                            label="Definido por"
                            value={
                              paciente.psicologo_responsavel_atribuido_por_nome ||
                              "Não informado"
                            }
                          />
                        </div>
                      )}

                      {podeTransferirAcompanhamento && (
                        <button
                          type="button"
                          onClick={() => setTransferirAberto(true)}
                          className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#9F64AF]/20 bg-white px-4 py-2 text-sm font-medium text-[#9F64AF] shadow-sm transition hover:border-[#9F64AF] hover:bg-[#F9F4FC]"
                        >
                          <BiTransfer className="h-4 w-4" />
                          Transferir acompanhamento
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Section>

            {/* Seção: Dados Pessoais */}
            <Section icon={IdCard} title="Dados pessoais">
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Data de nascimento"
                  value={new Date(paciente.data_nascimento).toLocaleDateString(
                    "pt-BR",
                  )}
                />
                <Field label="Idade" value={`${paciente.idade} anos`} />
                <Field
                  label="Gênero"
                  value={
                    normalizarPreferenciaNaoInformar(paciente.genero) ||
                    "Não informado"
                  }
                />
                <Field
                  label="Raça/Etnia"
                  value={
                    normalizarPreferenciaNaoInformar(paciente.raca_etnia) ||
                    "Não informado"
                  }
                />
                <Field
                  label="CPF"
                  value={
                    paciente.cpf ? formatarCPF(paciente.cpf) : "Não informado"
                  }
                />
              </div>
            </Section>

            {/* Seção: Contato e Endereço */}
            <Section icon={Smartphone} title="Contato e endereço">
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-2">
                <Field
                  label="Telefone principal"
                  value={formatarTelefone(paciente.telefone)}
                />
                <Field
                  label="Telefone alternativo"
                  value={
                    paciente.telefone_alternativo
                      ? formatarTelefone(paciente.telefone_alternativo)
                      : "Não informado"
                  }
                />
                <Field
                  label="E-mail"
                  value={paciente.email || "Não informado"}
                />
                <Field
                  label="Endereço"
                  value={enderecoFormatado || "Não informado"}
                />
              </div>
            </Section>

            {/* Seção: Informações complementares */}
            <Section icon={ClipboardList} title="Informações complementares">
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Field
                  label="Socioeconômico"
                  value={formatarRenda(paciente.renda_familiar)}
                />
                <Field
                  label="Cadastro Único"
                  value={paciente.possui_cadastro_unico ? "Sim" : "Não"}
                />
                <Field
                  label="Acessibilidade"
                  value={
                    paciente.possui_deficiencia
                      ? paciente.descricao_deficiencia &&
                        paciente.descricao_deficiencia.trim() !== "0"
                        ? paciente.descricao_deficiencia
                        : "Possui deficiência"
                      : "Não informado"
                  }
                />
                {paciente.tipo === "menor" && paciente.responsavel && (
                  <>
                    <Field
                      label="Responsável legal"
                      value={paciente.responsavel.nome}
                    />
                    <Field
                      label="CPF do responsável"
                      value={
                        paciente.responsavel.cpf
                          ? formatarCPF(paciente.responsavel.cpf)
                          : "Não informado"
                      }
                    />
                    <Field
                      label="Telefone do responsável"
                      value={formatarTelefone(paciente.responsavel.telefone)}
                    />
                    <Field
                      label="Grau de parentesco"
                      value={paciente.responsavel.grau_parentesco}
                    />
                  </>
                )}
                {paciente.observacoes && (
                  <div className="sm:col-span-2">
                    <Field label="Observações" value={paciente.observacoes} />
                  </div>
                )}
              </div>
            </Section>

            {/* Ações de Atendimento, exibidas apenas se paciente estiver ativo */}
            {isAtivo && (
              <section className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ações de Atendimento
                </h3>
                <div className="flex flex-wrap gap-2">
                  {/* Botão Iniciar atendimento */}
                  {paciente.status_atendimento === "fila_espera" && (
                    <button
                      type="button"
                      onClick={handleIniciarAtendimento}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                    >
                      Iniciar atendimento
                    </button>
                  )}
                  {/* Botão Encerrar atendimento */}
                  {paciente.status_atendimento === "em_atendimento" && (
                    <button
                      type="button"
                      onClick={handleEncerrarAtendimento}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                    >
                      Encerrar atendimento
                    </button>
                  )}
                  {/* Botão Retomar atendimento */}
                  {paciente.status_atendimento === "encerrado" && (
                    <button
                      type="button"
                      onClick={handleRetomarAtendimento}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> Retomar atendimento
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Ações de Cadastro */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ações de Cadastro
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* Botão Editar dados */}
                <button
                  type="button"
                  onClick={onEditar}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                >
                  <PenLine className="w-4 h-4" /> Editar dados
                </button>

                {/* Botão Inativar (se ativo) ou Reativar (se inativo) */}
                {isAtivo ? (
                  <button
                    type="button"
                    onClick={onInativar}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                  >
                    <Archive className="w-4 h-4" /> Inativar paciente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReativarCadastro}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                  >
                    Reativar cadastro
                  </button>
                )}

                {/* Botão Excluir paciente (desabilitado se não puder excluir) */}
                <span
                  className="inline-flex"
                  title={
                    !podeExcluir
                      ? "Este paciente possui movimentações vinculadas e não pode ser excluído."
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={handleExcluirPaciente}
                    disabled={!podeExcluir}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      !podeExcluir
                        ? "cursor-not-allowed bg-[#9F64AF]/15 text-[#9F64AF]/40"
                        : "bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" /> Excluir paciente
                  </button>
                </span>
              </div>
            </section>
          </div>
        )}
      </motion.div>

      {paciente && (
        <TransferirAcompanhamentoModal
          aberto={transferirAberto}
          pacienteId={paciente.id}
          pacienteNome={paciente.nome}
          psicologoResponsavelId={Number(paciente.psicologo_responsavel_id)}
          psicologoResponsavelNome={paciente.psicologo_responsavel_nome}
          onClose={() => setTransferirAberto(false)}
          onSuccess={() => setTransferirAberto(false)}
        />
      )}

      {definirResponsavelAberto && paciente && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={fecharDefinirResponsavel}
            aria-label="Fechar modal"
          ></button>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={fecharDefinirResponsavel}
              className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            <div className="mb-5 flex items-start gap-3 pr-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#9F64AF]">
                <HiOutlineClipboardDocumentList className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Definir responsável
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecione um psicólogo ativo da clínica para assumir o
                  acompanhamento deste paciente.
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-[#9F64AF]/15 bg-[#F8F4FB] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Paciente
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {paciente.nome}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <PsicologoCombobox
                  label="Novo psicólogo responsável"
                  obrigatorio
                  value={psicologoResponsavelSelecionadoId}
                  placeholder="Selecione um psicólogo"
                  erro={erroDefinirResponsavel}
                  opcoes={psicologosAtivos}
                  onChange={(valor) => {
                    setPsicologoResponsavelSelecionadoId(valor);
                    setErroDefinirResponsavel("");
                  }}
                />
                {psicologosAtivos.length === 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    Não há psicólogos ativos disponíveis para transferência.
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharDefinirResponsavel}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarDefinirResponsavel}
                  disabled={definirResponsavel.isPending}
                  className="rounded-xl bg-[#9F64AF] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {definirResponsavel.isPending
                    ? "Definindo..."
                    : "Definir responsável"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
