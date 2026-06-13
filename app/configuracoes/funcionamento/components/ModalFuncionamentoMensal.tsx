"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarRange,
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LiaBusinessTimeSolid } from "react-icons/lia";
import { MdErrorOutline } from "react-icons/md";
import { toast } from "sonner";
import type { AplicacaoMensalFuncionamento, Excecao } from "../types";
import { validarAplicacaoMensalFuncionamento } from "../utils/validacoesHorario";

interface OpcaoDropdown {
  key: string;
  label: string;
}

interface OpcaoDia extends OpcaoDropdown {
  dias: number[];
}

interface ModalFuncionamentoMensalProps {
  aberto: boolean;
  excecoes: Excecao[];
  onClose: () => void;
  onAplicar: (aplicacao: AplicacaoMensalFuncionamento) => void;
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const OPCOES_MESES: OpcaoDropdown[] = [
  { key: "todos", label: "Todos os meses futuros" },
  ...MESES.map((nome, indice) => ({ key: String(indice + 1), label: nome })),
];

const OPCOES_DIAS: OpcaoDia[] = [
  { key: "uteis", label: "Dias úteis (Seg-Sex)", dias: [1, 2, 3, 4, 5] },
  { key: "todos", label: "Todos os dias", dias: [0, 1, 2, 3, 4, 5, 6] },
  { key: "domingo", label: "Domingo", dias: [0] },
  { key: "segunda", label: "Segunda", dias: [1] },
  { key: "terca", label: "Terça", dias: [2] },
  { key: "quarta", label: "Quarta", dias: [3] },
  { key: "quinta", label: "Quinta", dias: [4] },
  { key: "sexta", label: "Sexta", dias: [5] },
  { key: "sabado", label: "Sábado", dias: [6] },
];

function CampoErro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p className="mt-1 flex items-start gap-1 text-xs text-red-600">
      <MdErrorOutline size={12} className="mt-0.5 shrink-0" />
      <span>{mensagem}</span>
    </p>
  );
}

function ComboboxFiltro({
  value,
  onChange,
  options,
  pesquisavel = true,
}: {
  value: string;
  onChange: (valor: string) => void;
  options: OpcaoDropdown[];
  pesquisavel?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const labelAtual = options.find((opcao) => opcao.key === value)?.label || "";
  const filtradas = useMemo(
    () =>
      options.filter((opcao) =>
        opcao.label.toLowerCase().includes(busca.toLowerCase()),
      ),
    [busca, options],
  );

  useEffect(() => {
    const fecharAoClicarFora = (evento: MouseEvent) => {
      if (ref.current && !ref.current.contains(evento.target as Node))
        setAberto(false);
    };
    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] hover:border-[#9F64AF] transition-colors"
      >
        <span className={labelAtual ? "font-medium" : "text-gray-400"}>
          {labelAtual || "Selecione"}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-2 flex max-h-56 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm"
          onPointerDown={(evento) => evento.stopPropagation()}
        >
          {pesquisavel && (
            <div className="mb-2 flex shrink-0 items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Pesquisar..."
                className="w-full bg-transparent text-sm text-gray-700 outline-none"
              />
            </div>
          )}

          <div className="dropdown-scroll min-h-0 flex-1 overflow-y-auto pr-1">
            {filtradas.map((opcao) => (
              <button
                key={opcao.key}
                type="button"
                onClick={() => {
                  onChange(opcao.key);
                  setAberto(false);
                  setBusca("");
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-left text-sm transition ${
                  value === opcao.key
                    ? "bg-[#F3EAF8] text-[#9F64AF]"
                    : "text-gray-700 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {opcao.label}
                  </span>
                </span>
                {value === opcao.key && (
                  <Check size={15} className="shrink-0 text-[#9F64AF]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModalFuncionamentoMensal({
  aberto,
  excecoes,
  onClose,
  onAplicar,
}: ModalFuncionamentoMensalProps) {
  const anoAtual = new Date().getFullYear();
  const mesAtual = String(new Date().getMonth() + 1);
  const [renderizadoNoCliente, setRenderizadoNoCliente] = useState(false);
  const [opcaoMes, setOpcaoMes] = useState(mesAtual);
  const [opcaoDias, setOpcaoDias] = useState("uteis");
  const [anoTexto, setAnoTexto] = useState(String(anoAtual));
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [temIntervalo, setTemIntervalo] = useState(false);
  const [intervaloInicio, setIntervaloInicio] = useState("");
  const [intervaloFim, setIntervaloFim] = useState("");
  const [tentouAplicar, setTentouAplicar] = useState(false);
  const [tocado, setTocado] = useState({
    ano: false,
    horaInicio: false,
    horaFim: false,
    intervaloInicio: false,
    intervaloFim: false,
  });

  useEffect(() => {
    setRenderizadoNoCliente(true);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const fecharComEsc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fecharComEsc);
    return () => document.removeEventListener("keydown", fecharComEsc);
  }, [aberto, onClose]);

  useEffect(() => {
    if (!aberto) return;
    setOpcaoMes(mesAtual);
    setOpcaoDias("uteis");
    setAnoTexto(String(anoAtual));
    setHoraInicio("");
    setHoraFim("");
    setTemIntervalo(false);
    setIntervaloInicio("");
    setIntervaloFim("");
    setTentouAplicar(false);
    setTocado({
      ano: false,
      horaInicio: false,
      horaFim: false,
      intervaloInicio: false,
      intervaloFim: false,
    });
  }, [aberto, anoAtual, mesAtual]);

  const aplicacao = useMemo<AplicacaoMensalFuncionamento>(() => {
    const opcaoDia =
      OPCOES_DIAS.find((opcao) => opcao.key === opcaoDias) || OPCOES_DIAS[0];
    const ano = Number.parseInt(anoTexto, 10);

    return {
      mes: opcaoMes === "todos" ? null : Number.parseInt(opcaoMes, 10),
      ano: Number.isNaN(ano) ? 0 : ano,
      dias_semana: opcaoDia.dias,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      intervalo_inicio: temIntervalo ? intervaloInicio : null,
      intervalo_fim: temIntervalo ? intervaloFim : null,
    };
  }, [
    anoTexto,
    horaFim,
    horaInicio,
    intervaloFim,
    intervaloInicio,
    opcaoDias,
    opcaoMes,
    temIntervalo,
  ]);

  const resultadoValidacao = useMemo(
    () => validarAplicacaoMensalFuncionamento(aplicacao, excecoes, anoAtual),
    [aplicacao, excecoes, anoAtual],
  );

  const possuiErros = Object.keys(resultadoValidacao.erros).length > 0;
  const mostrarErros = tentouAplicar || Object.values(tocado).some(Boolean);

  const handleAplicar = () => {
    setTentouAplicar(true);
    if (possuiErros) {
      toast.error(
        "Corrija os campos destacados antes de aplicar o funcionamento mensal.",
        {
          icon: <MdErrorOutline size={16} className="text-red-600" />,
          className: "border-red-200 bg-red-50 text-red-600",
        },
      );
      return;
    }

    if (resultadoValidacao.avisos.length > 0) {
      toast.info(resultadoValidacao.avisos[0], {
        icon: <AlertTriangle size={16} className="text-amber-600" />,
        className: "border-amber-200 bg-amber-50 text-amber-800",
      });
    }

    onAplicar(aplicacao);
    onClose();
  };

  if (!renderizadoNoCliente) return null;

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Modal de aplicar funcionamento mensal"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          tabIndex={-1}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-[#9F64AF]/20 bg-white shadow-2xl"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 rounded-t-2xl">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-[#9F64AF] hover:bg-[#F3EAF8] rounded-lg transition"
                type="button"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 pr-8">
                <CalendarRange size={18} className="text-[#9F64AF]" />
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Aplicar funcionamento mensal
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Aplica os horários configurados nesta semana ao mês
                    selecionado.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="block text-xs font-medium text-gray-800 mb-1">
                    Período
                  </div>
                  <ComboboxFiltro
                    value={opcaoMes}
                    onChange={setOpcaoMes}
                    options={OPCOES_MESES}
                    pesquisavel={false}
                  />
                  <CampoErro
                    mensagem={
                      mostrarErros ? resultadoValidacao.erros.mes : undefined
                    }
                  />
                </div>

                <div>
                  <div className="block text-xs font-medium text-gray-800 mb-1">
                    Ano
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={anoTexto}
                    onChange={(evento) =>
                      setAnoTexto(
                        evento.target.value.replace(/\D/g, "").slice(0, 4),
                      )
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] transition-colors ${
                      mostrarErros && resultadoValidacao.erros.ano
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    onBlur={() => setTocado((prev) => ({ ...prev, ano: true }))}
                  />
                  <CampoErro
                    mensagem={
                      mostrarErros ? resultadoValidacao.erros.ano : undefined
                    }
                  />
                </div>
              </div>

              <div>
                <div className="block text-xs font-medium text-gray-800 mb-1">
                  Aplicar nos dias
                </div>
                <ComboboxFiltro
                  value={opcaoDias}
                  onChange={setOpcaoDias}
                  options={OPCOES_DIAS.map(({ key, label }) => ({
                    key,
                    label,
                  }))}
                  pesquisavel={false}
                />
                <CampoErro
                  mensagem={
                    mostrarErros
                      ? resultadoValidacao.erros.dias_semana
                      : undefined
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="block text-xs font-medium text-gray-800 mb-1">
                    Início
                  </div>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(evento) => setHoraInicio(evento.target.value)}
                    onBlur={() =>
                      setTocado((prev) => ({ ...prev, horaInicio: true }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] transition-colors ${
                      mostrarErros && resultadoValidacao.erros.hora_inicio
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <CampoErro
                    mensagem={
                      mostrarErros
                        ? resultadoValidacao.erros.hora_inicio
                        : undefined
                    }
                  />
                </div>

                <div>
                  <div className="block text-xs font-medium text-gray-800 mb-1">
                    Fim
                  </div>
                  <input
                    type="time"
                    value={horaFim}
                    onChange={(evento) => setHoraFim(evento.target.value)}
                    onBlur={() =>
                      setTocado((prev) => ({ ...prev, horaFim: true }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] transition-colors ${
                      mostrarErros && resultadoValidacao.erros.hora_fim
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <CampoErro
                    mensagem={
                      mostrarErros
                        ? resultadoValidacao.erros.hora_fim
                        : undefined
                    }
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={temIntervalo}
                  onChange={(evento) => {
                    setTemIntervalo(evento.target.checked);
                    if (!evento.target.checked) {
                      setIntervaloInicio("");
                      setIntervaloFim("");
                    }
                  }}
                  className="rounded border-gray-300 focus:ring-[#9F64AF] focus:ring-offset-0 accent-[#9F64AF]"
                />
                <span
                  className={`text-xs font-medium ${temIntervalo ? "text-[#9F64AF]" : "text-gray-600"}`}
                >
                  <LiaBusinessTimeSolid size={12} className="inline mr-1" />{" "}
                  Intervalo
                </span>
              </label>

              {temIntervalo && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="block text-xs font-medium text-gray-800 mb-1">
                      Início do intervalo
                    </div>
                    <input
                      type="time"
                      value={intervaloInicio}
                      onChange={(evento) =>
                        setIntervaloInicio(evento.target.value)
                      }
                      onBlur={() =>
                        setTocado((prev) => ({
                          ...prev,
                          intervaloInicio: true,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] transition-colors ${
                        mostrarErros &&
                        resultadoValidacao.erros.intervalo_inicio
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    <CampoErro
                      mensagem={
                        mostrarErros
                          ? resultadoValidacao.erros.intervalo_inicio
                          : undefined
                      }
                    />
                  </div>

                  <div>
                    <div className="block text-xs font-medium text-gray-800 mb-1">
                      Fim do intervalo
                    </div>
                    <input
                      type="time"
                      value={intervaloFim}
                      onChange={(evento) =>
                        setIntervaloFim(evento.target.value)
                      }
                      onBlur={() =>
                        setTocado((prev) => ({ ...prev, intervaloFim: true }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] transition-colors ${
                        mostrarErros && resultadoValidacao.erros.intervalo_fim
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    <CampoErro
                      mensagem={
                        mostrarErros
                          ? resultadoValidacao.erros.intervalo_fim
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}

              {tentouAplicar &&
                (resultadoValidacao.erros.periodo ||
                  resultadoValidacao.erros.conflitos ||
                  resultadoValidacao.avisos.length > 0) && (
                  <div className="space-y-2">
                    {(resultadoValidacao.erros.periodo ||
                      resultadoValidacao.erros.conflitos) && (
                      <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <MdErrorOutline
                          size={14}
                          className="mt-0.5 shrink-0 text-red-500"
                        />
                        <span>
                          {resultadoValidacao.erros.periodo ||
                            resultadoValidacao.erros.conflitos}
                        </span>
                      </div>
                    )}

                    {resultadoValidacao.avisos.length > 0 && (
                      <div className="space-y-2">
                        {resultadoValidacao.avisos.map((aviso) => (
                          <div
                            key={aviso}
                            className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                          >
                            <AlertTriangle
                              size={14}
                              className="mt-0.5 shrink-0"
                            />
                            <span>{aviso}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white/95 backdrop-blur-sm px-6 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAplicar}
                className="inline-flex items-center gap-2 rounded-lg bg-[#9F64AF] px-4 py-2 text-sm text-white transition hover:bg-[#8B509B]"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Mantém a rolagem e o comportamento visual iguais aos filtros do sistema.
