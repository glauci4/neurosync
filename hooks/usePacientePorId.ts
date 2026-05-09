// hooks/usePacientePorId.ts
// Hook para buscar os dados de um paciente específico via ID.
// Utiliza React Query com staleTime = 0 e refetchOnMount = true para garantir que, ao reabrir o modal, os dados estejam sempre atualizados.

import { useQuery } from '@tanstack/react-query';
import { useAutenticacao } from './useAutenticacao';

async function buscarPaciente(id: number, usuarioId: number) {
    const response = await fetch(`/api/pacientes/${id}?usuario_id=${usuarioId}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar paciente');
    }
    const data = await response.json();
    return data.data;
}

export function usePacientePorId(pacienteId: number | null) {
    const { usuario } = useAutenticacao();
    return useQuery({
        queryKey: ['paciente', pacienteId],
        queryFn: () => {
            if (!pacienteId) throw new Error('ID do paciente não informado');
            if (!usuario?.id) throw new Error('Usuário não autenticado');
            return buscarPaciente(pacienteId, usuario.id);
        },
        enabled: !!pacienteId && !!usuario?.id,
        staleTime: 0,          // Dados sempre são considerados obsoletos imediatamente
        refetchOnMount: true,  // Ao montar o componente, sempre refaz a requisição
        refetchOnWindowFocus: false,
        gcTime: 0,             // Limpa o cache ao desmontar (opcional)
    });
}