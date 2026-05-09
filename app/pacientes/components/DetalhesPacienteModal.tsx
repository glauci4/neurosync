// app/pacientes/components/DetalhesPacienteModal.tsx
// Modal de detalhes do paciente exibe informações completas e ações de atendimento/cadastro. Utiliza o hook usePacientePorId para buscar os dados, e tem estados de carregamento e erro. A interface é organizada em seções com ícones e campos formatados (telefone, CPF, renda). Ações de atendimento são condicionais ao status do paciente, e ações de cadastro permitem editar, inativar/reactivar ou excluir o paciente (com validação para exclusão). 

'use client';

import { motion } from 'framer-motion';
import {
    X, User, Smartphone, Mail, MapPin, Users, AlertCircle,
    RotateCcw, PenLine, Archive, ArchiveRestore, Trash2,
    CreditCard, IdCard
} from 'lucide-react';
import { MdAccessible, MdOutlineContactEmergency } from 'react-icons/md';
import { usePacientePorId } from '@/hooks/usePacientePorId';
import { formatarTelefone, formatarCPF } from '@/lib/utils';

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
    return (
        <div>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="font-medium text-slate-900">{value || '—'}</p>
        </div>
    );
}

// Seção agrupada com ícone lilás e título em caixa alta
function Section({
    icon: Icon,
    title,
    children,
}: {
    icon: any;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
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
    const { data: paciente, isLoading, error } = usePacientePorId(isOpen ? pacienteId : null);

    if (!isOpen) return null;

    // Exclusão: paciente precisa estar na fila de espera e não ter consultas registradas
    const podeExcluir = (paciente?.podeExcluir === true || paciente?.podeExcluir === 1)
        && paciente?.status_atendimento === 'fila_espera';
    const isAtivo = Number(paciente?.ativo) === 1;

    // Configuração visual dos status de atendimento
    const statusConfig: Record<string, { label: string; className: string }> = {
        fila_espera: { label: 'Fila de Espera', className: 'bg-amber-100 text-amber-700' },
        em_atendimento: { label: 'Em Atendimento', className: 'bg-emerald-100 text-emerald-700' },
        encerrado: { label: 'Encerrado', className: 'bg-slate-100 text-slate-600' },
    };

    // Formata valor de renda para o padrão brasileiro
    const formatarRenda = (renda: any): string => {
        if (!renda) return 'Não informado';
        const valor = Number(renda);
        if (isNaN(valor)) return 'Não informado';
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

    const status = paciente?.status_atendimento ? statusConfig[paciente.status_atendimento] : null;

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
                    <div className="text-red-500 text-center py-8">Erro ao carregar dados do paciente.</div>
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
                                        {paciente.tipo === 'adulto' ? 'Adulto' : 'Menor'}
                                    </span>
                                    {/* Badge de status de atendimento */}
                                    {status && (
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
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

                        {/* Seção: Dados Pessoais */}
                        <Section icon={IdCard} title="Dados Pessoais">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                <Field
                                    label="Data de Nascimento"
                                    value={new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}
                                />
                                <Field label="Idade" value={`${paciente.idade} anos`} />
                                <Field label="Gênero" value={paciente.genero || 'Não informado'} />
                                <Field label="Raça/Etnia" value={paciente.raca_etnia || 'Não informado'} />
                                <Field label="CPF" value={paciente.cpf ? formatarCPF(paciente.cpf) : 'Não informado'} />
                            </div>
                        </Section>

                        {/* Seção: Contato (telefone principal, alternativo e e-mail) */}
                        <Section icon={Smartphone} title="Contato">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F3E8F7]/60 text-slate-900">
                                    <Smartphone className="w-4 h-4 text-[#9F64AF]" />
                                    <span className="truncate">{formatarTelefone(paciente.telefone)}</span>
                                </div>
                                {paciente.telefone_alternativo && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F3E8F7]/60 text-slate-900">
                                        <Smartphone className="w-4 h-4 text-[#9F64AF]" />
                                        <span className="truncate">
                                            Alt.: {formatarTelefone(paciente.telefone_alternativo)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F3E8F7]/60 text-slate-900 sm:col-span-2">
                                    <Mail className="w-4 h-4 text-[#9F64AF]" />
                                    <span className="truncate">{paciente.email || 'Não informado'}</span>
                                </div>
                            </div>
                        </Section>

                        {/* Seção: Contato de Emergência (exibida condicionalmente) */}
                        {paciente.contato_emergencia && (
                            <Section icon={MdOutlineContactEmergency} title="Contato de Emergência">
                                <div className="p-3 rounded-lg bg-[#F3E8F7]/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                    <Field label="Nome" value={paciente.contato_emergencia.nome} />
                                    <Field
                                        label="Telefone"
                                        value={formatarTelefone(paciente.contato_emergencia.telefone)}
                                    />
                                    {paciente.contato_emergencia.parentesco && (
                                        <Field label="Parentesco" value={paciente.contato_emergencia.parentesco} />
                                    )}
                                </div>
                            </Section>
                        )}

                        {/* Seção: Endereço formatado em texto corrido */}
                        <Section icon={MapPin} title="Endereço">
                            <div className="p-3 rounded-lg bg-[#F3E8F7]/60 text-sm space-y-1">
                                <p className="text-slate-900">
                                    {paciente.rua || '—'}
                                    {paciente.numero ? `, ${paciente.numero}` : ''}
                                    {paciente.complemento ? ` - ${paciente.complemento}` : ''}
                                </p>
                                <p className="text-slate-500">
                                    {[paciente.bairro, paciente.cidade, paciente.estado].filter(Boolean).join(' · ')}
                                    {paciente.cep ? ` · CEP ${paciente.cep}` : ''}
                                </p>
                            </div>
                        </Section>

                        {/* Seção: Responsável Legal (apenas para pacientes menores) */}
                        {paciente.tipo === 'menor' && paciente.responsavel && (
                            <Section icon={Users} title="Responsável Legal">
                                <div className="p-3 rounded-lg bg-[#F3E8F7]/60 grid grid-cols-2 gap-3 text-sm">
                                    <Field label="Nome" value={paciente.responsavel.nome} />
                                    <Field
                                        label="CPF"
                                        value={paciente.responsavel.cpf ? formatarCPF(paciente.responsavel.cpf) : 'Não informado'}
                                    />
                                    <Field
                                        label="Telefone"
                                        value={formatarTelefone(paciente.responsavel.telefone)}
                                    />
                                    <Field label="Grau de Parentesco" value={paciente.responsavel.grau_parentesco} />
                                </div>
                            </Section>
                        )}

                        {/* Seção: Socioeconômico */}
                        <Section icon={CreditCard} title="Socioeconômico">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <Field label="Renda Familiar" value={formatarRenda(paciente.renda_familiar)} />
                                <Field
                                    label="Cadastro Único"
                                    value={paciente.possui_cadastro_unico ? 'Sim' : 'Não'}
                                />
                            </div>
                        </Section>

                        {/* Seção: Acessibilidade */}
                        <Section icon={MdAccessible} title="Acessibilidade">
                            <div className="text-sm p-3 rounded-lg bg-[#F3E8F7]/60">
                                {paciente.possui_deficiencia ? (
                                    <>
                                        <p className="font-medium text-slate-900">Possui deficiência</p>
                                        {paciente.descricao_deficiencia && (
                                            <p className="text-slate-600 mt-1">{paciente.descricao_deficiencia}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-slate-500">Não declara deficiência.</p>
                                )}
                            </div>
                        </Section>

                        {/* Seção: Observações (exibida condicionalmente) */}
                        {paciente.observacoes && (
                            <Section icon={AlertCircle} title="Observações">
                                <div className="p-3 rounded-lg bg-[#F3E8F7]/60 text-sm text-slate-700">
                                    {paciente.observacoes}
                                </div>
                            </Section>
                        )}

                        {/* Ações de Atendimento, exibidas apenas se paciente estiver ativo */}
                        {isAtivo && (
                            <section className="space-y-3 pt-2 border-t border-slate-100">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Ações de Atendimento
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {/* Botão Iniciar atendimento */}
                                    {paciente.status_atendimento === 'fila_espera' && (
                                        <button
                                            onClick={handleIniciarAtendimento}
                                            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                                        >
                                            Iniciar atendimento
                                        </button>
                                    )}
                                    {/* Botão Encerrar atendimento */}
                                    {paciente.status_atendimento === 'em_atendimento' && (
                                        <button
                                            onClick={handleEncerrarAtendimento}
                                            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                                        >
                                            Encerrar atendimento
                                        </button>
                                    )}
                                    {/* Botão Retomar atendimento */}
                                    {paciente.status_atendimento === 'encerrado' && (
                                        <button
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
                                    onClick={onEditar}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                                >
                                    <PenLine className="w-4 h-4" /> Editar dados
                                </button>

                                {/* Botão Inativar (se ativo) ou Reativar (se inativo) */}
                                {isAtivo ? (
                                    <button
                                        onClick={onInativar}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                                    >
                                        <Archive className="w-4 h-4" /> Inativar paciente
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleReativarCadastro}
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors"
                                    >
                                        Reativar cadastro
                                    </button>
                                )}

                                {/* Botão Excluir paciente (desabilitado se não puder excluir) */}
                                <button
                                    onClick={onExcluir}
                                    disabled={!podeExcluir}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#9F64AF]/20 text-[#9F64AF] hover:bg-[#9F64AF] hover:text-white transition-colors ${
                                        !podeExcluir ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    <Trash2 className="w-4 h-4" /> Excluir paciente
                                </button>
                            </div>

                            {/* Explicação do motivo pelo qual o paciente não pode ser excluído */}
                            {!podeExcluir && (
                                <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <p>
                                        {paciente?.status_atendimento !== 'fila_espera'
                                            ? 'Para excluir, o paciente deve estar na fila de espera e sem consultas.'
                                            : 'Paciente possui consultas registradas e não pode ser excluído.'}
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </motion.div>
        </div>
    );
}