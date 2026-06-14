"use client";

import { CORES_RELATORIOS, formatarNumero } from "../utils/graficos";

type Valor = string | number;

interface RelatorioChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: Valor;
    name?: string;
    dataKey?: string;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string | number;
}

export default function RelatorioChartTooltip({
  active,
  payload,
  label,
}: RelatorioChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const titulo = typeof label === "string" ? label : String(label || "");
  const payloadBase = payload[0]?.payload || {};
  const horasOcupadas = payloadBase.horas_ocupadas;
  const capacidadePeriodoHoras = payloadBase.capacidade_periodo_horas;
  const percentualOcupacao = payloadBase.percentual_ocupacao;

  return (
    <div className="rounded-2xl border border-[#E8DBF2] bg-white px-3 py-2.5 shadow-xl">
      {titulo ? (
        <p className="max-w-[220px] truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {titulo}
        </p>
      ) : null}
      <div className="mt-1.5 space-y-1">
        {payload.map((item) => {
          const valor =
            typeof item.value === "number"
              ? formatarNumero(item.value)
              : String(item.value ?? "-");
          return (
            <div
              key={`${item.dataKey}-${item.name}`}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    (item.color as string | undefined) || CORES_RELATORIOS.roxo,
                }}
              />
              <span className="text-gray-500">{item.name || item.dataKey}</span>
              <strong className="ml-auto text-[#5F2D6D]">{valor}</strong>
            </div>
          );
        })}
        {typeof percentualOcupacao === "number" ? (
          <div className="pt-1 text-[11px] text-gray-500">
            Ocupação:{" "}
            <strong className="text-[#5F2D6D]">
              {formatarNumero(percentualOcupacao)}%
            </strong>
          </div>
        ) : null}
        {typeof horasOcupadas === "number" ? (
          <div className="text-[11px] text-gray-500">
            Horas utilizadas:{" "}
            <strong className="text-[#5F2D6D]">
              {formatarNumero(horasOcupadas)}h
            </strong>
          </div>
        ) : null}
        {typeof capacidadePeriodoHoras === "number" ? (
          <div className="text-[11px] text-gray-500">
            Capacidade do período:{" "}
            <strong className="text-[#5F2D6D]">
              {formatarNumero(capacidadePeriodoHoras)}h
            </strong>
          </div>
        ) : null}
      </div>
    </div>
  );
}
