"use client";

import { Bell, RefreshCw, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSidebar } from "@/app/context/SidebarContext";
import Sidebar from "@/app/inicio/components/Sidebar";
import { useAutenticacao } from "@/hooks/useAutenticacao";

import CabecalhoNotificacoes from "./components/CabecalhoNotificacoes";
import FiltrosNotificacoes, {
  type FiltroPeriodoNotificacoes,
  type FiltrosNotificacoesValores,
} from "./components/FiltrosNotificacoes";
import ListaNotificacoes from "./components/ListaNotificacoes";
import {
  useGerarNotificacoesConsultas,
  useGerarNotificacoesFeriados,
  useGerarNotificacoesOperacionais,
  useGerarNotificacoesPendentes,
  useMarcarNotificacaoComoLida,
  useMarcarNotificacaoComoNaoLida,
  useMarcarTodasNotificacoesComoLidas,
  useNotificacoes,
} from "./hooks/useNotificacoes";

const FILTROS_PADRAO: FiltrosNotificacoesValores = {
  leitura: "todas",
  periodo: "todos",
};

const DIA_EM_MS = 24 * 60 * 60 * 1000;

function obterPeriodoNotificacao(valor: string): FiltroPeriodoNotificacoes {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "anteriores";

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

export default function NotificacoesPage() {
  const { usuario, estaAutenticado, carregando, fazerLogout } =
    useAutenticacao();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [filtros, setFiltros] =
    useState<FiltrosNotificacoesValores>(FILTROS_PADRAO);

  useEffect(() => {
    if (!carregando && !estaAutenticado) {
      router.push("/");
    }
  }, [carregando, estaAutenticado, router]);

  const { data, isLoading, error, refetch } = useNotificacoes();
  const marcarLida = useMarcarNotificacaoComoLida();
  const marcarNaoLida = useMarcarNotificacaoComoNaoLida();
  const marcarTodasComoLidas = useMarcarTodasNotificacoesComoLidas();
  const gerarConsultas = useGerarNotificacoesConsultas();
  const gerarPendentes = useGerarNotificacoesPendentes();
  const gerarFeriados = useGerarNotificacoesFeriados();
  const gerarOperacionais = useGerarNotificacoesOperacionais();
  const geracaoInicialExecutada = useRef(false);
  const notificacoes = data?.notificacoes || [];
  const totais = data?.totais || { total: 0, nao_lidas: 0, lidas: 0 };
  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter((notificacao) => {
      if (filtros.leitura === "nao_lidas" && notificacao.lida) return false;
      if (filtros.leitura === "lidas" && !notificacao.lida) return false;
      if (
        filtros.periodo !== "todos" &&
        obterPeriodoNotificacao(notificacao.criado_em) !== filtros.periodo
      ) {
        return false;
      }

      return true;
    });
  }, [filtros, notificacoes]);

  useEffect(() => {
    if (carregando || !usuario || geracaoInicialExecutada.current) {
      return;
    }

    geracaoInicialExecutada.current = true;
    Promise.allSettled([
      gerarConsultas.mutateAsync(),
      gerarPendentes.mutateAsync(),
      gerarFeriados.mutateAsync(),
      gerarOperacionais.mutateAsync(),
    ]).finally(() => {
      refetch();
    });
  }, [
    carregando,
    gerarConsultas,
    gerarFeriados,
    gerarOperacionais,
    gerarPendentes,
    refetch,
    usuario,
  ]);

  if (carregando || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-8 pt-4">
          <div className="rounded-2xl border border-[#9F64AF]/20 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#F3EAF8]" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-72 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="h-20 animate-pulse rounded-2xl bg-[#F3EAF8]/70" />
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>

          <div className="h-10 w-44 animate-pulse rounded-xl bg-white/80 shadow-sm" />

          <div className="space-y-4">
            {Array.from(
              { length: 3 },
              (_, indice) => `notificacao-${indice}`,
            ).map((chave) => (
              <div
                key={chave}
                className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 animate-pulse rounded-xl bg-[#F3EAF8]" />
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <div className="h-5 w-14 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
                    </div>
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 w-2/5 animate-pulse rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!usuario) return null;

  const marginLeft = isCollapsed ? "ml-20" : "ml-64";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0]">
      <Sidebar
        perfilId={usuario.perfil_id || 1}
        onLogout={fazerLogout}
        usuario={usuario}
      />

      <div className={marginLeft}>
        <div className="px-8 pt-8 pb-2">
          <div className="flex items-start gap-3">
            <Bell className="mt-1 h-6 w-6 shrink-0 text-[#9F64AF]" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Notificações</h1>
              <p className="mt-1 text-sm text-gray-500">
                Avisos do seu usuário, organizados por leitura.
              </p>
            </div>
          </div>
        </div>

        <main className="px-8 pb-8">
          <div className="mx-auto max-w-5xl space-y-6 pt-4">
            <CabecalhoNotificacoes
              total={totais.total}
              naoLidas={totais.nao_lidas}
              lidas={totais.lidas}
            />

            <FiltrosNotificacoes filtros={filtros} onChange={setFiltros} />

            {error ? (
              <section className="rounded-2xl border border-[#9F64AF]/15 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#9F64AF]">
                    <TriangleAlert size={18} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-slate-800">
                      Não foi possível carregar as notificações
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Tente novamente em instantes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#9F64AF]/20 bg-white px-3 py-2 text-sm font-medium text-[#6F4E7A] shadow-sm transition hover:bg-[#F3EAF8]"
                  >
                    <RefreshCw size={14} />
                    Recarregar
                  </button>
                </div>
              </section>
            ) : (
              <ListaNotificacoes
                notificacoes={notificacoesFiltradas}
                onMarcarComoLida={(id) => marcarLida.mutate(id)}
                onMarcarComoNaoLida={(id) => marcarNaoLida.mutate(id)}
                onMarcarTodasComoLidas={() => marcarTodasComoLidas.mutate()}
                carregandoMarcarTodas={marcarTodasComoLidas.isPending}
                carregandoAcao={marcarLida.isPending || marcarNaoLida.isPending}
                filtroAtivo={
                  filtros.leitura !== "todas" || filtros.periodo !== "todos"
                    ? "filtrado"
                    : "todas"
                }
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
