// hooks/useBuscarPaciente.ts
// Hook para buscar os detalhes de um paciente específico, útil para formulários de edição

import { useQuery } from '@tanstack/react-query';
import { useAutenticacao } from './useAutenticacao';

interface PacienteDetalhes {
    id: number;
    nome: string;
    data_nascimento: string;
    data_nascimento_formatada: string;
    idade: number;
    genero: string;
    raca_etnia: string;
    cpf: string | null;
    telefone: string;
    telefone_alternativo: string | null;
    email: string | null;
    tipo: 'adulto' | 'menor';
    possui_deficiencia: boolean;
    descricao_deficiencia: string | null;
    renda_familiar: number | null;
    possui_cadastro_unico: boolean;
    cep: string | null;
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    observacoes: string | null;
    ativo: boolean;
    criado_em: string;
    atualizado_em: string;
}

async function buscarPaciente(id: number, usuarioId: number): Promise<PacienteDetalhes> {
    const response = await fetch(`/api/pacientes/${id}?usuario_id=${usuarioId}`);
    const resultado = await response.json();
    
    if (!response.ok) {
        throw new Error(resultado.error || 'Erro ao buscar paciente');
    }
    
    return resultado.data;
}

export function useBuscarPaciente(id: number) {
    const { usuario } = useAutenticacao();
    
    return useQuery({
        queryKey: ['paciente', id],
        queryFn: () => {
            if (!usuario?.id) {
                throw new Error('Usuário não autenticado');
            }
            return buscarPaciente(id, usuario.id);
        },
        enabled: !!usuario?.id && !!id,
        staleTime: 5 * 60 * 1000,
    });
}