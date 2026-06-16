import {
  type AgendaStatus,
  obterAgendaStatusConfig,
} from "../constants/agendaStatusConfig";

interface AgendaEventoCardProps {
  view: "mes" | "semana" | "dia";
  horario: string;
  paciente: string;
  sala: string;
  status: AgendaStatus;
  tipoAtendimento?: string;
}

function primeiroNome(nome: string): string {
  return nome.split(" ")[0] ?? nome;
}

export default function AgendaEventoCard({
  view,
  horario,
  paciente,
  sala,
  status,
  tipoAtendimento,
}: AgendaEventoCardProps) {
  const config = obterAgendaStatusConfig(status);
  const Icone = config.icone;
  const compacto = view === "mes";

  if (view === "semana") {
    return (
      <div
        className="flex h-full min-w-0 flex-col justify-center gap-0 overflow-hidden text-left leading-none"
        title={`${horario} - ${paciente} - ${sala} - ${config.texto}`}
      >
        <div className="flex min-w-0 items-baseline gap-0.5">
          <span className="shrink-0 text-[0.6rem] font-bold">{horario}</span>
          <span className="min-w-0 truncate text-[0.6rem] font-semibold">
            {primeiroNome(paciente)}
          </span>
        </div>
        <span className="min-w-0 truncate text-[0.5rem] opacity-60">{sala}</span>
      </div>
    );
  }

  if (compacto) {
    return (
      <div
        className="flex min-w-0 flex-col gap-0.5 text-left leading-tight"
        title={`${horario} - ${paciente}${tipoAtendimento ? ` - ${tipoAtendimento}` : ""}`}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 font-semibold">{horario}</span>
          <span className="min-w-0 truncate">{paciente}</span>
        </div>
        {tipoAtendimento && (
          <span className="min-w-0 truncate text-[0.58rem] font-medium opacity-85">
            {tipoAtendimento}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-w-0 flex-col justify-center gap-1.5 text-left leading-tight"
      title={`${horario} - ${paciente} - ${sala} - ${config.texto}`}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <Icone size={12} className="shrink-0" />
        <span className="shrink-0 font-semibold">{horario}</span>
        <span className="min-w-0 truncate font-semibold">{paciente}</span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="min-w-0 truncate text-[11px] opacity-90">{sala}</span>
        <span
          className={`min-w-0 overflow-hidden truncate rounded-full border px-1.5 py-0.5 text-[10px] font-semibold transition ${config.badge}`}
        >
          {config.texto}
        </span>
      </div>
    </div>
  );
}
