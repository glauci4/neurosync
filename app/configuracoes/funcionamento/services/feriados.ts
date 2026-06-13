// app/configuracoes/funcionamento/services/feriados.ts
const BRASIL_API = "https://brasilapi.com.br/api";

interface FeriadoExterno {
  date: string;
  name: string;
  type: "national" | "state" | "municipal";
}

interface FeriadoNacionalResponse {
  date?: string;
  name?: string;
}

interface FeriadoMunicipalResponse {
  startDate?: string;
  name?: Array<{ text?: string }>;
}

export async function getCodigoIBGE(cep: string): Promise<string | null> {
  const res = await fetch(`${BRASIL_API}/cep/v2/${cep.replace(/\D/g, "")}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.city_ibge_code || data.ibge || null;
}

export async function getCodigoIBGEPorCidade(
  cidade: string,
  uf: string,
): Promise<string | null> {
  const res = await fetch(
    `https://brasilapi.com.br/api/ibge/municipios/v1/${uf}?q=${encodeURIComponent(cidade)}`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0]?.codigo_ibge || null;
}

export async function getFeriadosNacionais(
  ano: number,
): Promise<FeriadoExterno[]> {
  const res = await fetch(`${BRASIL_API}/feriados/v1/${ano}`);
  if (!res.ok) throw new Error("Erro ao buscar feriados nacionais");
  const data = (await res.json()) as FeriadoNacionalResponse[];
  return data.map((f) => ({
    date: f.date || "",
    name: f.name || "Feriado nacional",
    type: "national" as const,
  }));
}

export async function getFeriadosMunicipais(
  ano: number,
  codigoIBGE: string,
  uf: string,
): Promise<FeriadoExterno[]> {
  try {
    const subdivId = `BR-${uf.toUpperCase()}-${codigoIBGE}`;
    const url = `https://openholidaysapi.org/PublicHolidays?countryIsoCode=BR&languageIsoCode=PT&validFrom=${ano}-01-01&validTo=${ano}-12-31&subdivisionCode=${subdivId}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as FeriadoMunicipalResponse[];
    return data.map((f) => ({
      date: f.startDate || "",
      name: f.name?.[0]?.text || "Feriado municipal",
      type: "municipal" as const,
    }));
  } catch {
    return [];
  }
}

export async function getCepPorCnpj(cnpj: string): Promise<string | null> {
  const res = await fetch(`${BRASIL_API}/cnpj/v1/${cnpj.replace(/\D/g, "")}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.cep || null;
}
