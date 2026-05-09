// app/pacientes/components/edicao/FormularioEdicaoAdulto.tsx
// Formulário de edição para paciente adulto.
// Validações herdadas de DadosPaciente (inclui e-mail, telefones, CPF, endereço, etc.).
// Contato de emergência é validado separadamente, com erro abaixo do campo Telefone (via erroTelefoneExterno).

'use client';

import { useState, useRef } from 'react';
import DadosPaciente, { DadosPacienteRef } from '@/app/pacientes/novo/formulario/components/DadosPaciente';
import ContatoEmergencia from '@/app/pacientes/novo/formulario/components/ContatoEmergencia';
import { MdErrorOutline } from 'react-icons/md';

interface PacienteEdicaoBase {
    id: number;
    nome: string;
    data_nascimento: string;
    genero: string;
    raca_etnia: string;
    cpf: string | null;
    telefone: string;
    telefone_alternativo: string | null;
    email: string | null;
    tipo: 'adulto' | 'menor';
    possui_deficiencia: number | boolean;
    descricao_deficiencia: string | null;
    renda_familiar: number | null;
    possui_cadastro_unico: number | boolean;
    cep: string | null;
    logradouro: string | null;
    rua?: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    observacoes: string | null;
    ativo: boolean;
    sem_numero?: boolean;
}

interface Props {
    paciente: PacienteEdicaoBase;
    onSubmit: (dados: any) => void;
    isPending: boolean;
}

function calcularIdade(dataNascimento: string): number {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}

export default function FormularioEdicaoAdulto({ paciente, onSubmit, isPending }: Props) {
    const pacienteRef = useRef<DadosPacienteRef>(null);
    const dataFormatada = paciente.data_nascimento ? paciente.data_nascimento.split('T')[0] : '';

    const [formData, setFormData] = useState({
        tipo: 'adulto',
        nome: paciente.nome,
        data_nascimento: dataFormatada,
        genero: paciente.genero,
        raca_etnia: paciente.raca_etnia,
        cpf: paciente.cpf || '',
        telefone: paciente.telefone,
        telefone_alternativo: paciente.telefone_alternativo || '',
        email: paciente.email || '',
        possui_deficiencia: !!paciente.possui_deficiencia,
        descricao_deficiencia: paciente.descricao_deficiencia || '',
        renda_familiar: paciente.renda_familiar?.toString() || '',
        possui_cadastro_unico: !!paciente.possui_cadastro_unico,
        cep: paciente.cep || '',
        rua: paciente.logradouro || paciente.rua || '',
        numero: paciente.numero || '',
        complemento: paciente.complemento || '',
        bairro: paciente.bairro || '',
        cidade: paciente.cidade || '',
        estado: paciente.estado || '',
        observacoes: paciente.observacoes || '',
        sem_numero: paciente.sem_numero || false,
    });

    const [contatoEmergencia, setContatoEmergencia] = useState({ nome: '', telefone: '', parentesco: '' });
    const [erroContato, setErroContato] = useState('');
    const [erroIdade, setErroIdade] = useState('');

    const validarIdade = (): boolean => {
        const idade = calcularIdade(formData.data_nascimento);
        if (idade < 18) {
            setErroIdade('Paciente adulto deve ter 18 anos ou mais');
            return false;
        }
        setErroIdade('');
        return true;
    };

    const validarContato = (): boolean => {
        if (contatoEmergencia.nome) {
            const telefoneNumeros = contatoEmergencia.telefone?.replace(/\D/g, '');
            if (!telefoneNumeros || telefoneNumeros.length < 10) {
                setErroContato('Telefone do contato de emergência é obrigatório quando o nome é informado');
                return false;
            }
        }
        setErroContato('');
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const pacienteValido = pacienteRef.current?.validar() ?? false;
        const idadeValida = validarIdade();
        const contatoValido = validarContato();

        if (!pacienteValido || !idadeValida || !contatoValido) return;

        let contatoParaEnvio = undefined;
        if (contatoEmergencia.nome) contatoParaEnvio = contatoEmergencia;

        const dadosEnvio = {
            ...formData,
            data_nascimento: formData.data_nascimento,
            cep: formData.cep ? formData.cep.replace(/\D/g, '') : null,
            renda_familiar: formData.renda_familiar ? parseFloat(formData.renda_familiar) : null,
            contato_emergencia: contatoParaEnvio,
            ativo: paciente.ativo,
        };
        onSubmit(dadosEnvio);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 space-y-6">
            <DadosPaciente
                ref={pacienteRef}
                formData={formData}
                setFormData={setFormData}
                tipo="adulto"
                telefoneObrigatorio={true}
                telefoneAlternativoObrigatorio={false}
                erroIdade={erroIdade}
            />

            {/* Contato de emergência usando a prop erroTelefoneExterno (padrão do componente) */}
            <ContatoEmergencia
                contato={contatoEmergencia}
                setContato={setContatoEmergencia}
                erroTelefoneExterno={erroContato}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => window.history.back()} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2 bg-[#9F64AF] text-white rounded-lg hover:bg-[#8B509B] transition disabled:opacity-50"
                >
                    {isPending ? 'Salvando...' : 'Salvar alterações'}
                </button>
            </div>
        </form>
    );
}