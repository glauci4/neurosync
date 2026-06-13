import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { ClinicaData } from "@/app/configuracoes/clinica/types";
import type {
  FiltrosRelatorios,
  RelatorioPrintConfig,
} from "../types/relatorios.types";
import { relatorioPdfStyles as styles } from "./relatorioPdfStyles";

export interface RelatorioPdfUsuario {
  nome: string;
  crp?: string | null;
  assinatura_profissional_url?: string | null;
}

interface RelatorioPDFDocumentProps {
  relatorio: RelatorioPrintConfig;
  clinica?: ClinicaData | null;
  filtros: FiltrosRelatorios;
  usuario: RelatorioPdfUsuario;
}

function dataPtBr(valor?: string | null) {
  if (!valor) return "";
  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function periodoTexto(filtros: FiltrosRelatorios) {
  if (filtros.data_inicio && filtros.data_fim) {
    return `${dataPtBr(filtros.data_inicio)} a ${dataPtBr(filtros.data_fim)}`;
  }
  if (filtros.data_inicio)
    return `A partir de ${dataPtBr(filtros.data_inicio)}`;
  if (filtros.data_fim) return `Até ${dataPtBr(filtros.data_fim)}`;
  return "Todos os registros disponíveis";
}

function enderecoClinica(clinica?: ClinicaData | null) {
  if (!clinica) return "";
  const linha1 = [clinica.endereco, clinica.numero].filter(Boolean).join(", ");
  const linha2 = [clinica.bairro, clinica.cidade, clinica.estado]
    .filter(Boolean)
    .join(" - ");

  return [linha1, linha2].filter(Boolean).join(" · ");
}

function texto(valor: unknown) {
  if (valor === null || typeof valor === "undefined" || valor === "") {
    return "-";
  }
  return String(valor);
}

function textoCompacto(valor: unknown) {
  if (valor === null || typeof valor === "undefined" || valor === "") {
    return "";
  }
  return String(valor);
}

function ehResumoOperacional(secao: RelatorioPrintConfig["secoes"][number]) {
  const colunas = secao.colunas.map((coluna) => coluna.toLowerCase());
  return (
    secao.titulo.toLowerCase().includes("resumo") ||
    (colunas.length === 2 &&
      colunas.includes("indicador") &&
      colunas.includes("valor"))
  );
}

function linhasPorPagina(
  linhas: RelatorioPrintConfig["secoes"][number]["linhas"],
) {
  return linhas.slice(0, 120);
}

function mensagemVazia(secao: RelatorioPrintConfig["secoes"][number]) {
  const titulo = secao.titulo.toLowerCase();

  if (titulo.includes("pacientes em espera")) {
    return "Nenhum paciente em espera encontrado para os filtros aplicados.";
  }

  if (titulo.includes("agendamentos futuros")) {
    return "Nenhum agendamento futuro encontrado para os filtros aplicados.";
  }

  return "Nenhum dado encontrado para os filtros aplicados.";
}

function renderTabelaCompacta(secao: RelatorioPrintConfig["secoes"][number]) {
  if (secao.linhas.length === 0) {
    return <Text style={styles.emptyExecutive}>{mensagemVazia(secao)}</Text>;
  }

  return (
    <View style={styles.compactTable}>
      <View style={styles.compactTableHeader}>
        {secao.colunas.map((coluna) => (
          <Text key={coluna} style={styles.compactTableCellHeader}>
            {coluna}
          </Text>
        ))}
      </View>
      {linhasPorPagina(secao.linhas).map((linha, index) => (
        <View key={`${secao.titulo}-${index}`} style={styles.compactTableRow}>
          {secao.colunas.map((coluna) => (
            <Text key={coluna} style={styles.compactTableCell}>
              {textoCompacto(linha[coluna])}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function RelatorioPDFDocument({
  relatorio,
  clinica,
  filtros,
  usuario,
}: RelatorioPDFDocumentProps) {
  const dataEmissao = new Date();
  const emitidoEm = new Intl.DateTimeFormat("pt-BR").format(dataEmissao);
  const horarioEmissao = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dataEmissao);
  const nomeFantasia =
    clinica?.nome_fantasia || clinica?.razao_social || "Clínica NeuroSync";
  const razaoSocial = clinica?.razao_social || nomeFantasia;
  const ehPainelExecutivo =
    relatorio.titulo.toLowerCase() === "painel executivo";

  return (
    <Document title={relatorio.titulo} author="NeuroSync">
      <Page
        size="A4"
        style={
          ehPainelExecutivo ? [styles.page, styles.pageExecutive] : styles.page
        }
      >
        <View
          style={
            ehPainelExecutivo
              ? [styles.header, styles.headerExecutive]
              : styles.header
          }
        >
          <View style={styles.clinicInfo}>
            <View
              style={
                ehPainelExecutivo
                  ? [styles.logoBox, styles.logoBoxExecutive]
                  : styles.logoBox
              }
            >
              {clinica?.logo_url ? (
                <Image
                  src={clinica.logo_url}
                  style={
                    ehPainelExecutivo
                      ? [styles.logoImage, styles.logoImageExecutive]
                      : styles.logoImage
                  }
                />
              ) : (
                <Text style={styles.logoFallback}>
                  {nomeFantasia.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View>
              <Text
                style={
                  ehPainelExecutivo
                    ? [styles.clinicTitle, styles.clinicTitleExecutive]
                    : styles.clinicTitle
                }
              >
                {nomeFantasia}
              </Text>
              <Text
                style={
                  ehPainelExecutivo
                    ? [styles.clinicText, styles.clinicTextExecutive]
                    : styles.clinicText
                }
              >
                Razão social: {razaoSocial}
              </Text>
              <Text
                style={
                  ehPainelExecutivo
                    ? [styles.clinicText, styles.clinicTextExecutive]
                    : styles.clinicText
                }
              >
                CNPJ: {clinica?.cnpj || "Não informado"}
              </Text>
              {enderecoClinica(clinica) ? (
                <Text
                  style={
                    ehPainelExecutivo
                      ? [styles.clinicText, styles.clinicTextExecutive]
                      : styles.clinicText
                  }
                >
                  Endereço: {enderecoClinica(clinica)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View
          style={
            ehPainelExecutivo
              ? [styles.reportIntro, styles.reportIntroExecutive]
              : styles.reportIntro
          }
        >
          <Text style={styles.eyebrow}>Relatório oficial</Text>
          <Text
            style={
              ehPainelExecutivo
                ? [styles.reportTitle, styles.reportTitleExecutive]
                : styles.reportTitle
            }
          >
            {relatorio.titulo}
          </Text>
          <Text style={styles.filterText}>
            Filtros aplicados: {periodoTexto(filtros)}
          </Text>
        </View>

        {relatorio.secoes.map((secao) => {
          if (ehPainelExecutivo) {
            return (
              <View
                key={secao.titulo}
                style={[styles.section, styles.sectionExecutive]}
              >
                <Text
                  style={[styles.sectionTitle, styles.sectionTitleExecutive]}
                >
                  {secao.titulo}
                </Text>
                {renderTabelaCompacta(secao)}
              </View>
            );
          }

          return (
            <View key={secao.titulo} style={styles.section}>
              <Text style={styles.sectionTitle}>{secao.titulo}</Text>
              {secao.linhas.length === 0 ? (
                <Text style={styles.empty}>
                  Nenhum dado encontrado para os filtros aplicados.
                </Text>
              ) : ehResumoOperacional(secao) ? (
                <View style={styles.summaryGrid}>
                  {secao.linhas.map((linha, index) => {
                    const colunas = Object.keys(linha);
                    const label = texto(
                      typeof linha.label !== "undefined"
                        ? linha.label
                        : colunas[0],
                    );
                    const valor = texto(
                      typeof linha.valor !== "undefined"
                        ? linha.valor
                        : (linha[colunas[1]] ?? linha[colunas[0]]),
                    );

                    return (
                      <View
                        key={`${secao.titulo}-${index}`}
                        style={styles.summaryCard}
                      >
                        <Text style={styles.summaryLabel}>{label}</Text>
                        <Text style={styles.summaryValue}>{valor}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    {secao.colunas.map((coluna) => (
                      <Text key={coluna} style={styles.tableCellHeader}>
                        {coluna}
                      </Text>
                    ))}
                  </View>
                  {linhasPorPagina(secao.linhas).map((linha, index) => (
                    <View
                      key={`${secao.titulo}-${index}`}
                      style={styles.tableRow}
                    >
                      {secao.colunas.map((coluna) => (
                        <Text key={coluna} style={styles.tableCell}>
                          {texto(linha[coluna])}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {ehPainelExecutivo ? (
          <View style={styles.executiveSignatureBlock} wrap={false}>
            {usuario.assinatura_profissional_url ? (
              <>
                <Image
                  src={usuario.assinatura_profissional_url}
                  style={styles.executiveSignature}
                />
                <View style={styles.executiveSignatureLine} />
              </>
            ) : (
              <View style={styles.executiveSignaturePlaceholder} />
            )}
            <Text style={styles.executiveSignatureName}>{usuario.nome}</Text>
            {usuario.crp ? (
              <Text style={styles.executiveSignatureMeta}>
                CRP: {usuario.crp}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View
          style={ehPainelExecutivo ? styles.footerExecutive : styles.footer}
          fixed
          wrap={false}
        >
          {ehPainelExecutivo ? (
            <>
              <View>
                <Text style={styles.footerTextExecutive}>
                  Documento gerado pelo NeuroSync
                </Text>
                <Text style={styles.footerTextExecutive}>
                  Documento confidencial
                </Text>
              </View>
              <View>
                <Text style={styles.footerTextExecutiveRight}>
                  Emitido em {emitidoEm} às {horarioEmissao} por {usuario.nome}
                </Text>
                <Text
                  style={styles.footerTextExecutiveRight}
                  render={({ pageNumber, totalPages }) =>
                    `Página ${pageNumber} de ${totalPages}`
                  }
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.footerTitle}>
                Documento gerado pelo NeuroSync
              </Text>
              <Text style={styles.footerLine}>
                Emitido em {emitidoEm} às {horarioEmissao} por {usuario.nome}
              </Text>
              {usuario.assinatura_profissional_url ? (
                <Image
                  src={usuario.assinatura_profissional_url}
                  style={styles.signature}
                />
              ) : (
                <View style={styles.signaturePlaceholder} />
              )}
              {usuario.crp ? (
                <Text style={styles.crpLine}>CRP: {usuario.crp}</Text>
              ) : null}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}

