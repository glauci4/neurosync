import { useQuery } from "@tanstack/react-query";
import { getFeriadosNacionais } from "../services/feriados";

export function useFeriados(
  ano: number,
  _cnpj: string,
  _cidade?: string,
  _uf?: string,
) {
  const nacionais = useQuery({
    queryKey: ["feriados-nacionais", ano],
    queryFn: () => getFeriadosNacionais(ano),
    staleTime: 24 * 60 * 60 * 1000,
  });

  return { nacionais };
}
