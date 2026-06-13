// app/configuracoes/funcionamento/utils/calculos.ts
// Funções utilitárias para cálculos de horários

export function calcularMinutos(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  return h * 60 + m;
}

export function formatarMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}h${m > 0 ? m + "min" : ""}`;
}

