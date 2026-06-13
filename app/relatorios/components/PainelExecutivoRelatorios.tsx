"use client";

import { FileSearch } from "lucide-react";
import type { ReactNode } from "react";
import type {
  AgendamentoFuturo,
  AtendimentosPsicologo,
  PacienteEspera,
  PacientesStatus,
} from "../types/relatorios.types";
import {
  Badge,
  formatarData,
  horaCurta,
  labelStatusConsulta,
  varianteStatusConsulta,
} from "./tabelaUtils";

interface PainelExecutivoRelatoriosProps {
  atendimentosPorPsicologo?: AtendimentosPsicologo[];
  pacientesStatus?: PacientesStatus | null;
  pacientesEspera?: PacienteEspera[];
  agendamentosFuturos?: AgendamentoFuturo[];
  isLoadingAtendimentos?: boolean;
  isLoadingPacientesStatus?: boolean;
  isLoadingPacientesEspera?: boolean;
  isLoadingAgendamentosFuturos?: boolean;
  acoes?: ReactNode;
}

function porcentagemFaltas(total: number, faltas: number) {
  if (!total) return "0.0%";
  return `${((faltas / total) * 100).toFixed(1)}%`;
}

function formatarStatus(status: string) {
  const mapa: Record<string, string> = {
    fila_espera: "Em espera",
    em_atendimento: "Em atendimento",
    encerrado: "Encerrado",
  };

  return mapa[status] || status.replaceAll("_", " ");
}

function EmptyStateCompacto({
  titulo,
  mensagem,
}: {
  titulo: string;
  mensagem: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-1 py-2 dark:border-[var(--ns-border)]">
      <FileSearch
        size={14}
        className="shrink-0 text-[#9F64AF] dark:text-[var(--ns-text-secondary)]"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-[var(--ns-text-primary)]">
          {titulo}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-[var(--ns-text-secondary)]">
          {mensagem}
        </p>
      </div>
    </div>
  );
}

function SkeletonLinhas({
  linhas,
  altura = "h-10",
}: {
  linhas: string[];
  altura?: string;
}) {
  return (
    <div className="space-y-2">
      {linhas.map((item) => (
        <div
          key={item}
          className={`${altura} animate-pulse rounded-lg bg-gray-100 dark:bg-[var(--ns-surface-soft)]`}
        />
      ))}
    </div>
  );
}

function CabecalhoResultado({ acoes }: { acoes?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-[var(--ns-text-secondary)]">
          Resultado do relatório
        </h2>
        <p className="mt-0.5 text-xs leading-snug text-slate-400 dark:text-[var(--ns-text-secondary)]">
          Conteúdo consolidado conforme o relatório e os filtros selecionados.
        </p>
      </div>
      {acoes ? <div className="shrink-0">{acoes}</div> : null}
    </div>
  );
}

function CabecalhoSecao({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-[var(--ns-text-primary)]">
          {titulo}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-[var(--ns-text-secondary)]">
          {descricao}
        </p>
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  );
}

function SecaoDocumento({
  titulo,
  descricao,
  acao,
  children,
  comDivisor = true,
}: {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
  children: ReactNode;
  comDivisor?: boolean;
}) {
  return (
    <section
      className={
        comDivisor
          ? "border-purple-100/60 border-t pt-6 dark:border-[var(--ns-border)]"
          : ""
      }
    >
      <CabecalhoSecao titulo={titulo} descricao={descricao} acao={acao} />
      {children}
    </section>
  );
}

function TabelaDocumento({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

function CabecalhoTabela({ children }: { children: ReactNode }) {
  return (
    <thead className="border-purple-100/70 border-y bg-[#FBF7FF] text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)] dark:text-[var(--ns-text-secondary)]">
      {children}
    </thead>
  );
}

function CorpoTabela({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-gray-100 dark:divide-[var(--ns-border)]">
      {children}
    </tbody>
  );
}

function StatusPacienteBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[#9F64AF]/15 bg-[#FBF7FF] px-2.5 py-1 text-xs font-semibold text-[#7B4FA3] dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)] dark:text-[var(--ns-text-primary)]">
      {children}
    </span>
  );
}

function PacientesSituacao({
  pacientesStatus,
}: {
  pacientesStatus: PacientesStatus;
}) {
  const situacoes = [
    { label: "Ativos", valor: pacientesStatus.ativos },
    { label: "Inativos", valor: pacientesStatus.inativos },
    { label: "Em espera", valor: pacientesStatus.fila_espera },
    { label: "Em atendimento", valor: pacientesStatus.em_atendimento },
    { label: "Encerrados", valor: pacientesStatus.encerrados },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
      {situacoes.map((item) => (
        <div
          key={item.label}
          className="flex min-h-[64px] min-w-0 flex-col justify-center gap-1 rounded-xl border border-[#9F64AF]/10 bg-[#FBF7FF] px-3.5 py-2 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)]"
        >
          <span className="truncate text-xs font-medium text-slate-500 dark:text-[var(--ns-text-secondary)]">
            {item.label}
          </span>
          <strong className="text-lg font-semibold leading-none text-[#7B4FA3] dark:text-[var(--ns-text-primary)]">
            {item.valor}
          </strong>
        </div>
      ))}
    </div>
  );
}

export default function PainelExecutivoRelatorios({
  atendimentosPorPsicologo = [],
  pacientesStatus,
  pacientesEspera = [],
  agendamentosFuturos = [],
  isLoadingAtendimentos = false,
  isLoadingPacientesStatus = false,
  isLoadingPacientesEspera = false,
  isLoadingAgendamentosFuturos = false,
  acoes,
}: PainelExecutivoRelatoriosProps) {
  const atendimentosVisiveis = atendimentosPorPsicologo.slice(0, 6);
  const pacientesEsperaVisiveis = pacientesEspera.slice(0, 6);
  const agendamentosVisiveis = agendamentosFuturos.slice(0, 6);

  return (
    <section className="rounded-2xl border border-[#9F64AF]/15 bg-white/80 p-5 pb-8 shadow-sm backdrop-blur-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="space-y-5">
        <CabecalhoResultado acoes={acoes} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.27fr)_minmax(0,1fr)]">
          <SecaoDocumento
            titulo="Atendimentos por psicólogo"
            descricao="Consultas registradas no período selecionado."
            comDivisor={false}
          >
            {isLoadingAtendimentos ? (
              <SkeletonLinhas
                linhas={["linha-a", "linha-b", "linha-c", "linha-d"]}
              />
            ) : atendimentosVisiveis.length === 0 ? (
              <EmptyStateCompacto
                titulo="Nenhum atendimento encontrado"
                mensagem="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
              />
            ) : (
              <TabelaDocumento>
                <CabecalhoTabela>
                  <tr>
                    <th className="w-[52%] py-3 pr-4 pl-3">Psicólogo</th>
                    <th className="w-[16%] px-3 py-3 text-center">
                      Atendimentos
                    </th>
                    <th className="w-[16%] px-3 py-3 text-center">Faltas</th>
                    <th className="w-[16%] px-3 py-3 text-center">Taxa</th>
                  </tr>
                </CabecalhoTabela>
                <CorpoTabela>
                  {atendimentosVisiveis.map((item) => (
                    <tr key={item.psicologo_id}>
                      <td className="py-3 pr-4 pl-3 align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                        <span
                          className="block max-w-[320px] truncate font-medium text-slate-800 dark:text-[var(--ns-text-primary)]"
                          title={item.psicologo_nome}
                        >
                          {item.psicologo_nome}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                        {item.total}
                      </td>
                      <td className="px-3 py-3 text-center align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                        {item.faltas}
                      </td>
                      <td className="px-3 py-3 text-center align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                        {porcentagemFaltas(item.total, item.faltas)}
                      </td>
                    </tr>
                  ))}
                </CorpoTabela>
              </TabelaDocumento>
            )}
          </SecaoDocumento>

          <SecaoDocumento
            titulo="Pacientes por situação"
            descricao="Distribuição geral dos pacientes da clínica."
            comDivisor={false}
          >
            {isLoadingPacientesStatus ? (
              <SkeletonLinhas
                altura="h-8"
                linhas={["linha-1", "linha-2", "linha-3"]}
              />
            ) : pacientesStatus ? (
              <PacientesSituacao pacientesStatus={pacientesStatus} />
            ) : (
              <EmptyStateCompacto
                titulo="Nenhum paciente encontrado"
                mensagem="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
              />
            )}
          </SecaoDocumento>
        </div>

        <SecaoDocumento
          titulo="Agendamentos futuros"
          descricao="Próximas consultas agendadas para o período selecionado."
        >
          {isLoadingAgendamentosFuturos ? (
            <SkeletonLinhas linhas={["ag-1", "ag-2", "ag-3", "ag-4"]} />
          ) : agendamentosVisiveis.length === 0 ? (
            <EmptyStateCompacto
              titulo="Nenhum agendamento encontrado"
              mensagem="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
            />
          ) : (
            <TabelaDocumento>
              <CabecalhoTabela>
                <tr>
                  <th className="py-2.5 pr-4">Data</th>
                  <th className="px-3 py-2.5">Horário</th>
                  <th className="px-3 py-2.5">Paciente</th>
                  <th className="px-3 py-2.5">Psicólogo</th>
                  <th className="px-3 py-2.5">Sala</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </CabecalhoTabela>
              <CorpoTabela>
                {agendamentosVisiveis.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-4 align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                      {formatarData(item.data_consulta)}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                      {horaCurta(item.horario_inicio)} -{" "}
                      {horaCurta(item.horario_fim)}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                      <span
                        className="block max-w-[220px] truncate text-slate-800 dark:text-[var(--ns-text-primary)]"
                        title={item.paciente_nome}
                      >
                        {item.paciente_nome}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                      <span
                        className="block max-w-[220px] truncate text-slate-800 dark:text-[var(--ns-text-primary)]"
                        title={item.psicologo_nome}
                      >
                        {item.psicologo_nome}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                      <span
                        className="block max-w-[180px] truncate text-slate-800 dark:text-[var(--ns-text-primary)]"
                        title={item.sala_nome}
                      >
                        {item.sala_nome}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                      <Badge variant={varianteStatusConsulta(item.status)}>
                        {labelStatusConsulta(item.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </CorpoTabela>
            </TabelaDocumento>
          )}
        </SecaoDocumento>

        <SecaoDocumento
          titulo="Pacientes em espera"
          descricao="Lista dos pacientes aguardando atendimento."
        >
          {isLoadingPacientesEspera ? (
            <SkeletonLinhas linhas={["espera-1", "espera-2", "espera-3"]} />
          ) : pacientesEsperaVisiveis.length === 0 ? (
            <EmptyStateCompacto
              titulo="Nenhum paciente em espera encontrado"
              mensagem="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
            />
          ) : (
            <TabelaDocumento>
              <CabecalhoTabela>
                <tr>
                  <th className="py-2.5 pr-4">Paciente</th>
                  <th className="px-3 py-2.5">Cadastro</th>
                  <th className="px-3 py-2.5">Responsável</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </CabecalhoTabela>
              <CorpoTabela>
                {pacientesEsperaVisiveis.map((paciente) => (
                  <tr key={paciente.id}>
                    <td className="py-2.5 pr-4 align-middle">
                      <span
                        className="block max-w-[260px] truncate font-medium text-slate-800 dark:text-[var(--ns-text-primary)]"
                        title={paciente.nome}
                      >
                        {paciente.nome}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                      {formatarData(paciente.criado_em)}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-700 dark:text-[var(--ns-text-secondary)]">
                      <span
                        className="block max-w-[240px] truncate"
                        title={
                          paciente.psicologo_responsavel_nome ||
                          "Sem responsável"
                        }
                      >
                        {paciente.psicologo_responsavel_nome ||
                          "Sem responsável"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <StatusPacienteBadge>
                        {formatarStatus(paciente.status_atendimento)}
                      </StatusPacienteBadge>
                    </td>
                  </tr>
                ))}
              </CorpoTabela>
            </TabelaDocumento>
          )}
        </SecaoDocumento>
      </div>
    </section>
  );
}

