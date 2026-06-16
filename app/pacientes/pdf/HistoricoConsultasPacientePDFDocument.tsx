import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
  obterAgendaStatusConfig,
  obterStatusConsultaExibicao,
} from "@/app/agenda/constants/agendaStatusConfig";
import type { HistoricoConsultasPacientePrintConfig } from "../types/historicoConsultas";

const TIPOS_ATENDIMENTO: Record<string, string> = {
  triagem: "Triagem",
  psicoterapia: "Psicoterapia",
  devolutiva: "Devolutiva",
  avaliacao: "Avaliação",
  orientacao: "Orientação",
  retorno: "Retorno",
  alta: "Alta",
  outro: "Outro",
};

function dataPtBr(valor?: string | null) {
  if (!valor) return "";
  const dataIso = String(valor).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) {
    const [ano, mes, dia] = dataIso.split("-").map(Number);
    const dataLocal = new Date(ano, mes - 1, dia);
    return new Intl.DateTimeFormat("pt-BR").format(dataLocal);
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function horaPtBr(valor?: string | null) {
  if (!valor) return "";
  const [hora = "00", minuto = "00"] = String(valor).slice(0, 5).split(":");
  return `${hora}:${minuto}`;
}

function tipoAtendimentoLabel(tipo: string, outro?: string | null) {
  if (tipo === "outro" && outro) return outro;
  return TIPOS_ATENDIMENTO[tipo] || tipo;
}

export default function HistoricoConsultasPacientePDFDocument({
  pacienteNome,
  consultas,
}: HistoricoConsultasPacientePrintConfig) {
  return (
    <Document title={`Histórico de consultas - ${pacienteNome}`}>
      <Page
        size="A4"
        style={{
          paddingTop: 28,
          paddingHorizontal: 32,
          paddingBottom: 30,
          fontFamily: "Helvetica",
          color: "#1f2937",
          fontSize: 10.5,
          lineHeight: 1.45,
        }}
      >
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: 700, color: "#5f2d6d" }}>
            Histórico de consultas
          </Text>
          <Text style={{ marginTop: 6, color: "#374151" }}>
            Paciente: {pacienteNome}
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "#d9c7e4",
            marginBottom: 14,
            width: "42%",
          }}
        />

        <Text style={{ marginBottom: 10, fontSize: 10, color: "#6b7280" }}>
          Consultas em ordem da mais recente para a mais antiga.
        </Text>

        {consultas.length === 0 ? (
          <Text style={{ color: "#4b5563" }}>
            Nenhuma consulta registrada para este paciente.
          </Text>
        ) : (
          consultas.map((consulta) => {
            const statusConsulta = obterAgendaStatusConfig(
              obterStatusConsultaExibicao(consulta),
            );

            return (
              <View
                key={consulta.id}
                style={{
                  marginBottom: 11,
                  paddingBottom: 9,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee7f3",
                }}
              >
                <Text
                  style={{ fontSize: 10.5, fontWeight: 700, color: "#1f2937" }}
                >
                  {dataPtBr(consulta.data_consulta)} ·{" "}
                  {horaPtBr(consulta.horario_inicio)} às{" "}
                  {horaPtBr(consulta.horario_fim)}
                </Text>
                <Text style={{ marginTop: 3, fontSize: 9.5, color: "#4b5563" }}>
                  {tipoAtendimentoLabel(
                    consulta.tipo_atendimento,
                    consulta.tipo_outro,
                  )}{" "}
                  · {statusConsulta.texto}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 9.5, color: "#4b5563" }}>
                  Psicólogo: {consulta.psicologo_nome || "Não informado"}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 9.5, color: "#4b5563" }}>
                  Sala: {consulta.sala_nome || "Não informada"}
                </Text>
              </View>
            );
          })
        )}
      </Page>
    </Document>
  );
}
