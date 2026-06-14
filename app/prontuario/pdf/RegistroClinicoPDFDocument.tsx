import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RegistroClinico } from "../hooks/useProntuario";

interface RegistroClinicoPDFDocumentProps {
  registro: RegistroClinico;
}

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
  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function horaPtBr(valor?: string | null) {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function tipoAtendimentoLabel(tipo: string) {
  return TIPOS_ATENDIMENTO[tipo] || tipo;
}

function textoLimpo(html: string) {
  const parser = new DOMParser();
  const documento = parser.parseFromString(html, "text/html");
  return documento.body.innerText.trim();
}

export default function RegistroClinicoPDFDocument({
  registro,
}: RegistroClinicoPDFDocumentProps) {
  const assinado = registro.status === "assinado";
  const conteudo = registro.conteudo ? textoLimpo(registro.conteudo) : "";
  const assinaturaData = assinado ? dataPtBr(registro.assinado_em) : "";
  const assinaturaHora = assinado ? horaPtBr(registro.assinado_em) : "";

  return (
    <Document title="Registro clínico" author="NeuroSync">
      <Page
        size="A4"
        style={{
          padding: 28,
          fontFamily: "Helvetica",
          color: "#1f2937",
          fontSize: 10.5,
          lineHeight: 1.45,
        }}
      >
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 700, color: "#5f2d6d" }}>
            Registro clínico
          </Text>
          <Text style={{ marginTop: 6, color: "#6b7280" }}>
            {registro.paciente_nome} · {dataPtBr(registro.data_registro)} ·{" "}
            {tipoAtendimentoLabel(registro.tipo_atendimento)}
          </Text>
          <Text style={{ marginTop: 3, color: "#6b7280" }}>
            {registro.psicologo_nome}
            {registro.crp ? ` · CRP ${registro.crp}` : ""}
          </Text>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#e9dff1",
            borderRadius: 14,
            padding: 16,
            backgroundColor: "#fcfafd",
          }}
        >
          {conteudo ? (
            <Text>{conteudo}</Text>
          ) : (
            <Text style={{ color: "#6b7280" }}>
              Rascunho sem conteúdo registrado.
            </Text>
          )}

          {assinado && (
            <View style={{ marginTop: 18, paddingTop: 14 }}>
              <View
                style={{
                  width: 220,
                  height: 1,
                  backgroundColor: "#d4c5df",
                  marginBottom: 14,
                }}
              />
              {registro.assinatura_url && (
                <Image
                  src={registro.assinatura_url}
                  style={{
                    width: 260,
                    height: 90,
                    objectFit: "contain",
                    marginBottom: 8,
                  }}
                />
              )}
              <Text
                style={{ fontSize: 11.5, fontWeight: 700, color: "#2f2436" }}
              >
                {registro.psicologo_nome}
              </Text>
              {registro.crp && (
                <Text style={{ marginTop: 2, fontSize: 10, color: "#6b7280" }}>
                  CRP {registro.crp}
                </Text>
              )}
              <Text style={{ marginTop: 10, fontSize: 9.5, color: "#6b7280" }}>
                Assinado digitalmente em {assinaturaData}
                {assinaturaHora ? ` às ${assinaturaHora}` : ""}
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
