"use client";

import {
  AlertCircle,
  ArrowRightLeft,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCheck,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  type CategoriaNotificacao,
  obterCategoriaNotificacao,
  obterDestinoNotificacao,
  obterRotuloCategoriaNotificacao,
} from "@/lib/notificacoes";

import type { Notificacao } from "../services/notificacoesService";

interface ListaNotificacoesProps {
  notificacoes: Notificacao[];
  onMarcarComoLida: (id: number) => void;
  onMarcarComoNaoLida: (id: number) => void;
  onMarcarTodasComoLidas?: () => void;
  carregandoMarcarTodas?: boolean;
  carregandoAcao?: boolean;
  filtroAtivo?: string;
}

type GrupoData = "hoje" | "ontem" | "semana" | "anteriores";

const ROTULOS_GRUPO: Record<GrupoData, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  semana: "Esta semana",
  anteriores: "Anteriores",
};

const DIA_EM_MS = 24 * 60 * 60 * 1000;

const CONFIG_CATEGORIA: Record<
  CategoriaNotificacao,
  {
    icone: typeof CalendarClock;
    classeBadge: string;
    classeIcone: string;
  }
> = {
  consulta: {
    icone: CalendarClock,
    classeBadge: "border border-sky-100 bg-sky-50 text-sky-700",
    classeIcone: "bg-sky-50 text-sky-600",
  },
  feriado: {
    icone: CalendarDays,
    classeBadge: "border border-amber-100 bg-amber-50 text-amber-700",
    classeIcone: "bg-amber-50 text-amber-600",
  },
  transferencia: {
    icone: ArrowRightLeft,
    classeBadge: "border border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700",
    classeIcone: "bg-fuchsia-50 text-fuchsia-600",
  },
  pendente: {
    icone: AlertCircle,
    classeBadge: "border border-rose-100 bg-rose-50 text-rose-700",
    classeIcone: "text-rose-600",
  },
  sistema: {
    icone: Bell,
    classeBadge: "border border-slate-200 bg-slate-100 text-slate-700",
    classeIcone: "bg-slate-100 text-slate-600",
  },
};

function obterRotuloCategoria(notificacao: Notificacao) {
  if (notificacao.tipo === "paciente_sem_responsavel") {
    return "NeuroSync";
  }

  return obterRotuloCategoriaNotificacao(
    obterCategoriaNotificacao(notificacao.tipo),
  );
}

function obterMensagemExibida(notificacao: Notificacao) {
  if (
    notificacao.tipo === "paciente_sem_responsavel" &&
    notificacao.titulo === "Paciente sem responsável"
  ) {
    const nomePaciente = notificacao.mensagem
      .split(":")
      .pop()
      ?.trim()
      .replace(/\.$/, "");
    if (nomePaciente) {
      return `O paciente ${nomePaciente} está em atendimento, mas ainda não possui psicólogo responsável definido.`;
    }
    return "Existe um paciente em atendimento sem psicólogo responsável definido.";
  }

  return notificacao.mensagem;
}

function formatarDataHora(valor: string) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function obterGrupoData(valor: string): GrupoData {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return "anteriores";
  }

  const hoje = new Date();
  const inicioHoje = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
  );
  const inicioData = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
  );
  const diferencaDias = Math.floor(
    (inicioHoje.getTime() - inicioData.getTime()) / DIA_EM_MS,
  );

  if (diferencaDias === 0) return "hoje";
  if (diferencaDias === 1) return "ontem";
  if (diferencaDias > 1 && diferencaDias <= 7) return "semana";
  return "anteriores";
}

function ItemNotificacao({
  notificacao,
  onMarcarComoLida,
  onMarcarComoNaoLida,
  carregandoAcao,
}: {
  notificacao: Notificacao;
  onMarcarComoLida: (id: number) => void;
  onMarcarComoNaoLida: (id: number) => void;
  carregandoAcao?: boolean;
}) {
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const lida = notificacao.lida;
  const categoria = obterCategoriaNotificacao(notificacao.tipo);
  const configCategoria = CONFIG_CATEGORIA[categoria];
  const IconeCategoria = configCategoria.icone;
  const destino = obterDestinoNotificacao(
    notificacao.tipo,
    notificacao.entidade_tipo,
  );
  const rotuloCategoria = obterRotuloCategoria(notificacao);

  useEffect(() => {
    if (!menuAberto) return;

    function fecharAoClicarFora(evento: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(evento.target as Node)) {
        setMenuAberto(false);
      }
    }

    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [menuAberto]);

  function abrirNotificacao() {
    if (!destino) return;
    if (!lida) {
      onMarcarComoLida(notificacao.id);
    }
    setMenuAberto(false);
    router.push(destino);
  }

  function alternarLeitura() {
    if (lida) {
      onMarcarComoNaoLida(notificacao.id);
    } else {
      onMarcarComoLida(notificacao.id);
    }
    setMenuAberto(false);
  }

  return (
    <article
      className={`rounded-2xl border px-3.5 py-2 shadow-sm transition ${
        lida
          ? "border-slate-200 bg-white/75"
          : "border-[#D9BCE8] bg-[#F9F5FB]/70"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${configCategoria.classeIcone}`}
        >
          <IconeCategoria size={16} />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {!lida ? (
              <span className="h-2 w-2 rounded-full bg-[#9F64AF]" />
            ) : null}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${configCategoria.classeBadge}`}
            >
              {rotuloCategoria}
            </span>
            <span className="text-[11px] text-gray-200">•</span>
            <span className="text-[11px] text-gray-400">
              {formatarDataHora(notificacao.criado_em)}
            </span>
          </div>

          <div className="space-y-0.5">
            <h3 className="line-clamp-1 text-sm font-semibold text-gray-800">
              {notificacao.titulo}
            </h3>
            <p className="text-sm leading-5 text-gray-600 sm:line-clamp-2">
              {obterMensagemExibida(notificacao)}
            </p>
          </div>
        </div>

        <div
          ref={menuRef}
          className="relative flex shrink-0 justify-end sm:w-10"
        >
          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/80 hover:text-[#6F4E7A]"
            aria-expanded={menuAberto}
            aria-label="Abrir ações da notificação"
          >
            <MoreHorizontal size={17} />
          </button>

          {menuAberto ? (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[#9F64AF]/15 bg-white py-1 text-sm shadow-lg">
              {destino ? (
                <button
                  type="button"
                  onClick={abrirNotificacao}
                  className="flex w-full items-center px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-[#F3EAF8] hover:text-[#6F4E7A]"
                >
                  Abrir
                </button>
              ) : null}
              <button
                type="button"
                onClick={alternarLeitura}
                disabled={carregandoAcao}
                className="flex w-full items-center px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-[#F3EAF8] hover:text-[#6F4E7A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {lida ? "Marcar como não lida" : "Marcar como lida"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function renderizarSecao(
  titulo: string,
  notificacoes: Notificacao[],
  onMarcarComoLida: (id: number) => void,
  onMarcarComoNaoLida: (id: number) => void,
  onMarcarTodasComoLidas?: () => void,
  carregandoMarcarTodas?: boolean,
  carregandoAcao?: boolean,
) {
  if (notificacoes.length === 0) return null;

  const agrupadas = notificacoes.reduce<Record<GrupoData, Notificacao[]>>(
    (acumulador, notificacao) => {
      const grupo = obterGrupoData(notificacao.criado_em);
      acumulador[grupo].push(notificacao);
      return acumulador;
    },
    {
      hoje: [],
      ontem: [],
      semana: [],
      anteriores: [],
    },
  );

  const gruposComItens = (
    Object.entries(ROTULOS_GRUPO) as Array<[GrupoData, string]>
  ).filter(([chave]) => agrupadas[chave].length > 0);

  if (gruposComItens.length === 0) return null;

  return (
    <section className="space-y-1.5">
      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full ${
            titulo === "Não lidas" ? "bg-[#9F64AF]" : "bg-slate-400"
          }`}
        />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {titulo}
        </h3>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {notificacoes.length}
        </span>
        <div className="h-px flex-1 bg-slate-200/80" />
      </div>

      <div className="space-y-2.5">
        {gruposComItens.map(([grupo, rotulo]) => (
          <div
            key={grupo}
            className="rounded-2xl border border-slate-200 bg-white/70 p-2 shadow-sm"
          >
            <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {rotulo}
                </span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {agrupadas[grupo].length}
                </span>
              </div>
              <div className="h-px flex-1 bg-slate-100" />
              {titulo === "Não lidas" &&
              grupo === "hoje" &&
              onMarcarTodasComoLidas ? (
                <button
                  type="button"
                  onClick={onMarcarTodasComoLidas}
                  disabled={carregandoMarcarTodas}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#6F4E7A] transition hover:bg-[#F3EAF8] hover:text-[#5F2D6D] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCheck size={13} />
                  Marcar todas como lidas
                </button>
              ) : null}
            </div>

            <div className="space-y-2">
              {agrupadas[grupo].map((notificacao) => (
                <ItemNotificacao
                  key={notificacao.id}
                  notificacao={notificacao}
                  onMarcarComoLida={onMarcarComoLida}
                  onMarcarComoNaoLida={onMarcarComoNaoLida}
                  carregandoAcao={carregandoAcao}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ListaNotificacoes({
  notificacoes,
  onMarcarComoLida,
  onMarcarComoNaoLida,
  onMarcarTodasComoLidas,
  carregandoMarcarTodas,
  carregandoAcao,
  filtroAtivo,
}: ListaNotificacoesProps) {
  const agrupadas = useMemo(
    () => ({
      naoLidas: notificacoes
        .filter((notificacao) => !notificacao.lida)
        .slice()
        .sort(
          (a, b) =>
            new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
        ),
      lidas: notificacoes
        .filter((notificacao) => notificacao.lida)
        .slice()
        .sort(
          (a, b) =>
            new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
        ),
    }),
    [notificacoes],
  );

  if (notificacoes.length === 0) {
    return (
      <section className="rounded-2xl border border-[#9F64AF]/15 bg-white/80 p-10 text-center shadow-sm backdrop-blur-sm">
        <Bell className="mx-auto mb-4 h-8 w-8 text-[#9F64AF]" />
        <h3 className="text-base font-semibold text-gray-800">
          Nenhuma notificação encontrada
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          {filtroAtivo && filtroAtivo !== "todas"
            ? "Ajuste os filtros para ver outras notificações."
            : "As notificações do seu usuário aparecerão aqui quando houver novos avisos."}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {renderizarSecao(
        "Não lidas",
        agrupadas.naoLidas,
        onMarcarComoLida,
        onMarcarComoNaoLida,
        onMarcarTodasComoLidas,
        carregandoMarcarTodas,
        carregandoAcao,
      )}
      {renderizarSecao(
        "Lidas",
        agrupadas.lidas,
        onMarcarComoLida,
        onMarcarComoNaoLida,
        onMarcarTodasComoLidas,
        carregandoMarcarTodas,
        carregandoAcao,
      )}
    </div>
  );
}
