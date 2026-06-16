// app/configuracoes/funcionamento/components/CardHorarioDia.tsx
// Componente que exibe um dia da semana com seus horários e intervalo.
// Inclui um botão "Copiar" que abre um dropdown com opções de cópia para outros dias da semana.
// O dropdown é renderizado via portal (document.body) e usa position: fixed com cálculo
// dinâmico baseado na posição do botão na viewport, garantindo que nunca seja cortado.
// Ao desativar o switch, todos os campos de horário e intervalo são limpos imediatamente.

import { motion } from "framer-motion";
import { Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LiaBusinessTimeSolid } from "react-icons/lia";
import type { Horario } from "../types";
import { validarIntervalo } from "../utils/validacoesHorario";
import HorarioInput from "./HorarioInput";

interface CardHorarioDiaProps {
  dia: string;
  curto: string;
  diaIdx: number;
  horario: Horario;
  disabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  mensalAplicado?: boolean;
  temMensalNoDia?: boolean;
  onChange: (field: keyof Horario, value: unknown) => void;
  onCopiarPara: (destinos: number[]) => void;
  diasSemana: string[];
}

// Remove o sufixo "-feira" do nome do dia (ex: "Segunda-feira" → "Segunda")
const removerFeira = (nome: string): string => nome.replace(/-feira$/i, "");

// Abreviação de 3 letras para exibição no dropdown
const abreviar = (nome: string): string => {
  const map: Record<string, string> = {
    Segunda: "Seg",
    Terça: "Ter",
    Quarta: "Qua",
    Quinta: "Qui",
    Sexta: "Sex",
    Sábado: "Sáb",
    Domingo: "Dom",
  };
  return map[nome] || nome.substring(0, 3);
};

function formatarHorario(valor?: string | null) {
  return valor?.trim() || "--:--";
}

export default function CardHorarioDia({
  dia,
  diaIdx,
  horario,
  disabled,
  isFirst,
  isLast,
  mensalAplicado = false,
  temMensalNoDia = false,
  onChange,
  onCopiarPara,
  diasSemana,
}: CardHorarioDiaProps) {
  const [possuiIntervalo, setPossuiIntervalo] = useState(
    !!horario.intervalo_inicio || !!horario.intervalo_fim,
  );
  const [erros, setErros] = useState<Record<string, string | undefined>>({});
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [interagiu, setInteragiu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const diaLimpo = removerFeira(dia);
  const outrosDias = Array.from({ length: 7 }, (_, i) => i).filter(
    (i) => i !== diaIdx,
  );

  useEffect(() => {
    setPossuiIntervalo(!!horario.intervalo_inicio || !!horario.intervalo_fim);
  }, [horario.intervalo_inicio, horario.intervalo_fim]);

  // Fecha dropdown ao clicar fora ou pressionar ESC
  useEffect(() => {
    if (!menuAberto) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuAberto(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuAberto(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [menuAberto]);

  // Calcula a posição do dropdown quando ele abre (coordenadas relativas à viewport)
  useEffect(() => {
    if (!menuAberto || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 176; // w-44 = 176px
    const margin = 10; // margem da borda da tela

    let left = rect.left;
    // Ajuste horizontal: não ultrapassa a borda direita
    if (left + dropdownWidth > window.innerWidth - margin) {
      left = window.innerWidth - dropdownWidth - margin;
    }
    if (left < margin) left = margin;

    // Posição vertical: 5px abaixo do botão (coordenada relativa à viewport)
    const top = rect.bottom + 5;

    setDropdownPosition({ top, left });
  }, [menuAberto]);

  useEffect(() => {
    if (!interagiu) return;
    setErros(
      validarIntervalo(
        horario.hora_inicio,
        horario.hora_fim,
        horario.intervalo_inicio,
        horario.intervalo_fim,
        horario.ativo,
      ),
    );
  }, [
    horario.hora_inicio,
    horario.hora_fim,
    horario.intervalo_inicio,
    horario.intervalo_fim,
    horario.ativo,
    interagiu,
  ]);

  const handleFieldChange = (field: keyof Horario, value: unknown) => {
    setInteragiu(true);
    onChange(field, value);
  };

  const handleIntervaloToggle = (checked: boolean) => {
    setInteragiu(true);
    setPossuiIntervalo(checked);
    if (!checked) {
      onChange("intervalo_inicio", null);
      onChange("intervalo_fim", null);
    }
  };

  const handleCopiar = (destinos: number[]) => {
    onCopiarPara(destinos);
    setMenuAberto(false);
  };

  return (
    <motion.div
      layout
      className={`transition-colors ${horario.ativo ? "bg-white" : "bg-gray-50/70"} ${
        isFirst ? "rounded-t-xl" : ""
      } ${isLast ? "rounded-b-xl" : ""}`}
    >
      <div className="grid grid-cols-[minmax(92px,110px)_44px_minmax(0,1fr)_max-content] items-center gap-x-1.5 gap-y-0 px-3.5 py-3 min-h-[66px]">
        {/* Nome do dia */}
        <div className="flex items-center min-w-0">
          <span
            className={`font-semibold text-sm truncate ${horario.ativo ? "text-gray-900" : "text-gray-500"}`}
          >
            {diaLimpo}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center">
          {!mensalAplicado && (
            <span
              className={`inline-flex min-w-[42px] justify-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                horario.ativo
                  ? "bg-[#F3EAF8] text-[#6F3A82]"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {horario.ativo ? "Aberto" : "Fechado"}
            </span>
          )}
        </div>

        {/* Controles */}
        <div className="flex min-w-0 flex-nowrap items-center gap-x-1 gap-y-0 overflow-visible">
          {mensalAplicado ? (
            <span className="rounded-full bg-[#F9F5FF] px-3 py-1 text-xs font-semibold text-[#6F3A82]">
              Funcionamento definido por aplicação mensal
            </span>
          ) : disabled ? (
            horario.ativo ? (
              <div className="flex flex-nowrap items-center gap-x-1 text-sm text-gray-700">
                <span className="shrink-0 whitespace-nowrap rounded-lg border border-[#9F64AF]/15 bg-white px-2 py-1 font-semibold text-gray-800">
                  {formatarHorario(horario.hora_inicio)}
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-gray-500">
                  até
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-lg border border-[#9F64AF]/15 bg-white px-2 py-1 font-semibold text-gray-800">
                  {formatarHorario(horario.hora_fim)}
                </span>
                {horario.intervalo_inicio || horario.intervalo_fim ? (
                  <span
                    title={`Intervalo ${formatarHorario(horario.intervalo_inicio)} até ${formatarHorario(horario.intervalo_fim)}`}
                    className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[#F3EAF8] px-2 py-0.5 text-[10px] font-semibold text-[#6F3A82]"
                  >
                    <LiaBusinessTimeSolid size={11} />
                    <span>Intervalo</span>
                    <span className="text-gray-500">
                      {formatarHorario(horario.intervalo_inicio)}–{" "}
                      {formatarHorario(horario.intervalo_fim)}
                    </span>
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                Sem expediente cadastrado
              </span>
            )
          ) : horario.ativo ? (
            <>
              {/* Switch Ativo/Inativo */}
              <label className="relative inline-flex flex-shrink-0 items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={horario.ativo}
                  onChange={(e) => {
                    const ativo = e.target.checked;
                    onChange("ativo", ativo);
                    if (!ativo) {
                      // Limpeza imediata de todos os campos e estados ao desativar
                      setErros({});
                      setInteragiu(false);
                      setPossuiIntervalo(false);
                      onChange("hora_inicio", "");
                      onChange("hora_fim", "");
                      onChange("intervalo_inicio", null);
                      onChange("intervalo_fim", null);
                    }
                  }}
                  disabled={disabled}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#9F64AF]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#9F64AF]" />
              </label>

              <HorarioInput
                value={horario.hora_inicio}
                disabled={disabled}
                onChange={(v) => handleFieldChange("hora_inicio", v)}
                erro={erros.hora_inicio}
              />
              <span className="text-gray-700 text-[11px] font-semibold whitespace-nowrap flex-shrink-0">
                até
              </span>
              <HorarioInput
                value={horario.hora_fim}
                disabled={disabled}
                onChange={(v) => handleFieldChange("hora_fim", v)}
                erro={erros.hora_fim}
              />

              <div className="hidden sm:block h-5 w-px bg-[#9F64AF]/15 mx-0.5 flex-shrink-0" />

              <label
                title="Intervalo"
                className="inline-flex shrink-0 items-center gap-1 cursor-pointer select-none whitespace-nowrap"
              >
                <input
                  type="checkbox"
                  checked={possuiIntervalo}
                  onChange={(e) => handleIntervaloToggle(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 focus:ring-2 focus:ring-[#9F64AF]/30 focus:ring-offset-0 cursor-pointer accent-[#9F64AF]"
                />
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold leading-none ${possuiIntervalo ? "text-[#6F3A82]" : "text-gray-600"}`}
                >
                  <LiaBusinessTimeSolid size={11} />
                  <span>Intervalo</span>
                </span>
              </label>

              <div
                className={`flex flex-nowrap items-center gap-x-1 gap-y-0 overflow-visible transition-all duration-200 ${possuiIntervalo ? "opacity-100" : "hidden opacity-0"}`}
              >
                <HorarioInput
                  value={horario.intervalo_inicio || ""}
                  disabled={disabled}
                  onChange={(v) =>
                    handleFieldChange("intervalo_inicio", v || null)
                  }
                  erro={erros.intervalo_inicio}
                />
                <span className="text-gray-700 text-[11px] font-semibold whitespace-nowrap flex-shrink-0">
                  até
                </span>
                <HorarioInput
                  value={horario.intervalo_fim || ""}
                  disabled={disabled}
                  onChange={(v) =>
                    handleFieldChange("intervalo_fim", v || null)
                  }
                  erro={erros.intervalo_fim}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 min-h-[34px]">
              <label className="relative inline-flex flex-shrink-0 items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={horario.ativo}
                  onChange={(e) => {
                    const ativo = e.target.checked;
                    onChange("ativo", ativo);
                    if (!ativo) {
                      setErros({});
                      setInteragiu(false);
                      setPossuiIntervalo(false);
                      onChange("hora_inicio", "");
                      onChange("hora_fim", "");
                      onChange("intervalo_inicio", null);
                      onChange("intervalo_fim", null);
                    }
                  }}
                  disabled={disabled}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#9F64AF]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#9F64AF]" />
              </label>
              <span className="text-gray-400 text-xs italic">
                {temMensalNoDia
                  ? "Definido por aplicação mensal"
                  : "Sem horários"}
              </span>
            </div>
          )}
        </div>

        {/* Botão Copiar com dropdown (renderizado via portal) */}
        {!mensalAplicado && horario.ativo && !disabled && (
          <div className="relative shrink-0 justify-self-end">
            <button
              type="button"
              ref={buttonRef}
              onClick={() => setMenuAberto(!menuAberto)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-600 hover:text-[#9F64AF] hover:bg-[#F3EAF8] rounded-lg transition-colors whitespace-nowrap ml-1"
            >
              <Copy size={11} /> Copiar
            </button>

            {menuAberto &&
              createPortal(
                <div
                  ref={menuRef}
                  className="fixed z-[9999] w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1"
                  style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                  }}
                >
                  {/* Triângulo apontando para o botão (posicionado à esquerda) */}
                  <div className="absolute -top-2 left-4 w-3 h-3 bg-white rotate-45 border-l border-t border-gray-100" />

                  <button
                    type="button"
                    onClick={() => handleCopiar(outrosDias)}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#F3E8F7] hover:text-[#9F64AF] transition-colors border-b border-gray-100"
                  >
                    Todos os dias
                  </button>

                  {outrosDias.map((i) => {
                    const nomeDia = removerFeira(diasSemana[i]);
                    const abrev = abreviar(nomeDia);
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleCopiar([i])}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#F3E8F7] hover:text-[#9F64AF] transition-colors"
                      >
                        {abrev} ({nomeDia})
                      </button>
                    );
                  })}
                </div>,
                document.body,
              )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
