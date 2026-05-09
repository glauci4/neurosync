// hooks/useVerificarCpf.ts
import { useQuery } from '@tanstack/react-query';
import { useAutenticacao } from './useAutenticacao';

async function verificarCpf(cpf: string, clinicaId: number, pacienteId?: number): Promise<boolean> {
    const url = new URL('/api/pacientes/verificar-cpf', window.location.origin);
    url.searchParams.set('cpf', cpf);
    url.searchParams.set('clinica_id', clinicaId.toString());
    if (pacienteId) url.searchParams.set('paciente_id', pacienteId.toString());

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.exists;
}

export function useVerificarCpf(cpf: string, pacienteId?: number) {
    const { usuario } = useAutenticacao();
    const clinicaId = usuario?.clinica_id;

    // Só executa a query se o CPF tiver 11 dígitos e a clínica estiver definida
    const cpfNumeros = cpf.replace(/\D/g, '');
    const shouldFetch = !!clinicaId && cpfNumeros.length === 11;

    return useQuery({
        queryKey: ['verificar-cpf', cpfNumeros, clinicaId, pacienteId],
        queryFn: () => verificarCpf(cpfNumeros, clinicaId!, pacienteId),
        enabled: shouldFetch,
        staleTime: 1000, // cache curto para evitar várias chamadas
        refetchOnWindowFocus: false,
    });
}