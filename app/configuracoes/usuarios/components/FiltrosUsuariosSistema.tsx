"use client";

import {
  BrushCleaning,
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  FiltroPerfilUsuario,
  FiltroStatusUsuario,
  FiltrosUsuariosSistema as FiltrosUsuariosSistemaValores,
} from "../types/usuariosSistema.types";

interface FiltrosUsuariosSistemaProps {
  filtros: FiltrosUsuariosSistemaValores;
  total: number;
  acaoDireita?: ReactNode;
  onChange: (filtros: FiltrosUsuariosSistemaValores) => void;
}

const perfis: Array<{ valor: FiltroPerfilUsuario; label: string }> = [
  { valor: "todos", label: "Todos" },
  { valor: "psicologo", label: "Psicólogos" },
  { valor: "secretaria", label: "Secretárias" },
];

const status: Array<{ valor: FiltroStatusUsuario; label: string }> = [
  { valor: "todos", label: "Todos" },
  { valor: "ativo", label: "Ativos" },
  { valor: "inativo", label: "Inativos" },
];

function contadorUsuarios(total: number) {
  if (total === 0) return "Nenhum usuário";
  return `${total} ${total === 1 ? "usuário" : "usuários"}`;
}

function labelSelecionado<T extends string>(
  opcoes: Array<{ valor: T; label: string }>,
  valor: T,
) {
  return opcoes.find((opcao) => opcao.valor === valor)?.label || "Todos";
}

export default function FiltrosUsuariosSistema({
  filtros,
  total,
  acaoDireita,
  onChange,
}: FiltrosUsuariosSistemaProps) {
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState<"status" | "perfil" | null>(
    null,
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const temFiltroAplicado =
    filtros.perfil !== "todos" || filtros.status !== "todos";
  const filtrosAtivos = [
    filtros.perfil !== "todos",
    filtros.status !== "todos",
  ].filter(Boolean).length;

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      const caminhoEvento = event.composedPath();
      if (
        cardRef.current &&
        !caminhoEvento.includes(cardRef.current) &&
        botaoRef.current &&
        !caminhoEvento.includes(botaoRef.current)
      ) {
        setFiltroAberto(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!filtroAberto) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFiltroAberto(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filtroAberto]);

  function selecionarStatus(valor: FiltroStatusUsuario) {
    onChange({ ...filtros, status: valor });
    setSecaoAberta(null);
  }

  function selecionarPerfil(valor: FiltroPerfilUsuario) {
    onChange({ ...filtros, perfil: valor });
    setSecaoAberta(null);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-[380px] max-w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={filtros.busca}
            onChange={(evento) =>
              onChange({ ...filtros, busca: evento.target.value })
            }
            placeholder="Buscar por nome ou e-mail..."
            className="h-10 w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF]"
          />
        </div>

        <div className={`relative ${filtroAberto ? "z-[9999]" : ""}`}>
          <button
            ref={botaoRef}
            type="button"
            onClick={() => setFiltroAberto((aberto) => !aberto)}
            className={`rounded-xl border p-2.5 transition ${
              temFiltroAplicado || filtroAberto
                ? "border-[#9F64AF]/30 bg-[#F3E8F7] text-[#9F64AF]"
                : "border-gray-300 text-gray-600 hover:bg-[#F3E8F7] hover:text-[#9F64AF]"
            }`}
            title="Filtrar usuários"
            aria-label="Filtrar usuários"
          >
            <SlidersHorizontal size={18} />
          </button>

          {filtroAberto ? (
            <div
              ref={cardRef}
              className="absolute left-0 z-[9999] mt-3 w-80 overflow-visible rounded-2xl border border-[#9F64AF]/15 bg-white/95 shadow-2xl backdrop-blur-sm"
              role="dialog"
              aria-label="Filtros de usuários do sistema"
              onPointerDown={(evento) => evento.stopPropagation()}
            >
              <div className="absolute -top-2 left-4">
                <div className="h-4 w-4 rotate-45 border-l border-t border-[#9F64AF]/15 bg-white/95" />
              </div>

              <div className="border-[#F3EAF8] border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Filtrar usuários
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Selecione quais usuários deseja visualizar
                </p>
              </div>

              <div className="space-y-2 p-2.5">
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setSecaoAberta((secao) =>
                        secao === "status" ? null : "status",
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#F3E8F7]"
                    aria-expanded={secaoAberta === "status"}
                  >
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                        Status
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-medium text-gray-700">
                        {labelSelecionado(status, filtros.status)}
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-gray-400 transition ${
                        secaoAberta === "status" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {secaoAberta === "status" ? (
                    <div className="mt-1 space-y-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
                      {status.map((item) => {
                        const ativo = filtros.status === item.valor;
                        return (
                          <button
                            key={item.valor}
                            type="button"
                            onClick={() => selecionarStatus(item.valor)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                              ativo
                                ? "bg-[#F3E8F7] text-[#9F64AF]"
                                : "text-gray-700 hover:bg-[#F3E8F7] hover:text-[#9F64AF]"
                            }`}
                          >
                            <span>{item.label}</span>
                            {ativo ? (
                              <Check size={15} className="text-[#9F64AF]" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="border-[#F3EAF8] border-t pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSecaoAberta((secao) =>
                        secao === "perfil" ? null : "perfil",
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#F3E8F7]"
                    aria-expanded={secaoAberta === "perfil"}
                  >
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                        Perfil
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-medium text-gray-700">
                        {labelSelecionado(perfis, filtros.perfil)}
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-gray-400 transition ${
                        secaoAberta === "perfil" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {secaoAberta === "perfil" ? (
                    <div className="mt-1 space-y-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
                      {perfis.map((item) => {
                        const ativo = filtros.perfil === item.valor;
                        return (
                          <button
                            key={item.valor}
                            type="button"
                            onClick={() => selecionarPerfil(item.valor)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                              ativo
                                ? "bg-[#F3E8F7] text-[#9F64AF]"
                                : "text-gray-700 hover:bg-[#F3E8F7] hover:text-[#9F64AF]"
                            }`}
                          >
                            <span>{item.label}</span>
                            {ativo ? (
                              <Check size={15} className="text-[#9F64AF]" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between border-[#F3EAF8] border-t px-4 py-3">
                <span className="text-xs text-gray-400">
                  {filtrosAtivos} {filtrosAtivos === 1 ? "filtro" : "filtros"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...filtros, perfil: "todos", status: "todos" })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                >
                  <BrushCleaning size={13} />
                  Limpar filtros
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <span className="whitespace-nowrap text-sm text-gray-500">
          {contadorUsuarios(total)}
        </span>
      </div>

      {acaoDireita}
    </div>
  );
}
