import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
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

function textoBruto(html: string) {
  const parser = new DOMParser();
  const documento = parser.parseFromString(html, "text/html");
  return documento.body;
}

function renderInlineChildren(node: ParentNode, prefixo: string): ReactNode[] {
  return Array.from(node.childNodes).flatMap((filho, indice) =>
    renderNode(filho, `${prefixo}-${indice}`),
  );
}

function renderNode(node: ChildNode, key: string): ReactNode[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const texto = node.textContent || "";
    return texto ? [texto] : [];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const elemento = node as HTMLElement;
  const tag = elemento.tagName.toLowerCase();

  if (tag === "br") {
    return ["\n"];
  }

  if (tag === "ul" || tag === "ol") {
    const ordenado = tag === "ol";
    const itens = Array.from(elemento.children).filter(
      (item) => item.tagName.toLowerCase() === "li",
    );

    return [
      <View
        key={key}
        style={{
          marginTop: 4,
          marginBottom: 6,
          paddingLeft: 8,
        }}
      >
        {itens.map((item, indice) => (
          <View
            key={`${key}-li-${indice}`}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 3,
            }}
          >
            <Text style={{ width: 14, fontSize: 10.5, color: "#374151" }}>
              {ordenado ? `${indice + 1}.` : "•"}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10.5, color: "#1f2937" }}>
                {renderInlineChildren(item, `${key}-li-${indice}`)}
              </Text>
              {Array.from(item.children)
                .filter((filho) => {
                  const filhoTag = filho.tagName.toLowerCase();
                  return filhoTag === "ul" || filhoTag === "ol";
                })
                .flatMap((filho, nestedIndex) =>
                  renderNode(filho, `${key}-li-${indice}-nested-${nestedIndex}`),
                )}
            </View>
          </View>
        ))}
      </View>,
    ];
  }

  const estilosTexto = {
    fontSize: 10.5,
    color: "#1f2937",
  };

  if (tag === "p" || tag === "div") {
    return [
      <Text key={key} style={{ ...estilosTexto, marginBottom: 4 }}>
        {renderInlineChildren(elemento, key)}
      </Text>,
    ];
  }

  if (tag === "strong" || tag === "b") {
    return [
      <Text key={key} style={{ ...estilosTexto, fontWeight: 700 }}>
        {renderInlineChildren(elemento, key)}
      </Text>,
    ];
  }

  if (tag === "em" || tag === "i") {
    return [
      <Text key={key} style={{ ...estilosTexto, fontStyle: "italic" }}>
        {renderInlineChildren(elemento, key)}
      </Text>,
    ];
  }

  if (tag === "u") {
    return [
      <Text key={key} style={{ ...estilosTexto, textDecoration: "underline" }}>
        {renderInlineChildren(elemento, key)}
      </Text>,
    ];
  }

  if (tag === "mark") {
    return [
      <Text key={key} style={{ ...estilosTexto, backgroundColor: "#FFF3B0" }}>
        {renderInlineChildren(elemento, key)}
      </Text>,
    ];
  }

  return renderInlineChildren(elemento, key);
}

function renderConteudoPdf(html: string) {
  const body = textoBruto(html);
  return Array.from(body.childNodes).flatMap((node, indice) =>
    renderNode(node, `conteudo-${indice}`),
  );
}

export default function RegistroClinicoPDFDocument({
  registro,
}: RegistroClinicoPDFDocumentProps) {
  const assinado = registro.status === "assinado";
  const conteudoHtml = registro.conteudo || "";
  const assinaturaData = assinado ? dataPtBr(registro.assinado_em) : "";
  const assinaturaHora = assinado ? horaPtBr(registro.assinado_em) : "";

  return (
    <Document title="Registro clínico" author="NeuroSync">
      <Page
        size="A4"
        style={{
          paddingTop: 28,
          paddingHorizontal: 32,
          paddingBottom: 30,
          fontFamily: "Helvetica",
          color: "#1f2937",
          fontSize: 10.5,
          lineHeight: 1.5,
        }}
      >
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: 700, color: "#5f2d6d" }}>
            Registro clínico
          </Text>
          <Text style={{ marginTop: 8, color: "#374151" }}>
            Paciente: {registro.paciente_nome}
          </Text>
          <Text style={{ marginTop: 2, color: "#374151" }}>
            Data: {dataPtBr(registro.data_registro)}
          </Text>
          <Text style={{ marginTop: 2, color: "#374151" }}>
            Tipo de atendimento: {tipoAtendimentoLabel(registro.tipo_atendimento)}
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "#d9c7e4",
            marginBottom: 16,
            width: "40%",
          }}
        />

        <View style={{ flexGrow: 1 }}>
          <Text style={{ fontSize: 10.5, color: "#6b7280" }}>
            Conteúdo do registro clínico:
          </Text>
          <View style={{ marginTop: 8 }}>
            {conteudoHtml ? (
              renderConteudoPdf(conteudoHtml)
            ) : (
              <Text style={{ color: "#1f2937" }}>
                Rascunho sem conteúdo registrado.
              </Text>
            )}
          </View>

          {assinado && (
            <View style={{ marginTop: 30, alignItems: "flex-end" }}>
              {registro.assinatura_url && (
                <Image
                  src={registro.assinatura_url}
                  style={{
                    width: 300,
                    height: 100,
                    objectFit: "contain",
                    marginBottom: 6,
                  }}
                />
              )}
              <View
                style={{
                  width: 220,
                  height: 1,
                  backgroundColor: "#d4c5df",
                  marginTop: 6,
                  marginBottom: 10,
                }}
              />
              <Text style={{ fontSize: 11.5, fontWeight: 700, color: "#2f2436" }}>
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
