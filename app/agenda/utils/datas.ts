export function parseDateLocal(dataISO: string) {
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-").map(Number);
  return new Date(ano, mes - 1, dia, 12);
}

export function dataLocalMeioDia(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12);
}

export function dataLocalISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function getDiaSemanaLocal(data: Date | string) {
  const dataLocal =
    typeof data === "string" ? parseDateLocal(data) : dataLocalMeioDia(data);
  return dataLocal.getDay();
}
