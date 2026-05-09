// app/hooks/useConsultaCep.ts
// Hook personalizado para consultar CEP usando TanStack Query

import { useQuery } from '@tanstack/react-query';

interface DadosCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  ibge: string;
}

async function buscarCep(cep: string): Promise<DadosCep> {
  const cepNumeros = cep.replace(/\D/g, '');
  
  if (cepNumeros.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }
  
  const response = await fetch(`/api/consulta-cep?cep=${cepNumeros}`);
  
  if (!response.ok) {
    const erro = await response.json();
    throw new Error(erro.error || 'Erro ao consultar CEP');
  }
  
  return response.json();
}

export function useConsultaCep(cep: string) {
  return useQuery({
    queryKey: ['cep', cep],
    queryFn: () => buscarCep(cep),
    // Só executa quando o CEP tem 8 dígitos 
    enabled: cep.replace(/\D/g, '').length === 8,
    staleTime: 10 * 60 * 1000, // CEP fica em cache por 10 minutos
  });
}