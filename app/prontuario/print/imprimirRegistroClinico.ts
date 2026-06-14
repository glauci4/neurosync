import type { RegistroClinico } from "../hooks/useProntuario";

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

export function imprimirRegistroClinico(registro: RegistroClinico) {
  const popup = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=980,height=780",
  );

  if (!popup) {
    throw new Error("Não foi possível abrir a janela de impressão.");
  }

  const conteudo =
    registro.conteudo || "<p>Rascunho sem conteúdo registrado.</p>";
  const assinaturaHtml =
    registro.status === "assinado"
      ? `
        <section class="assinatura">
          <div class="linha"></div>
          ${registro.assinatura_url ? `<img src="${registro.assinatura_url}" alt="Assinatura profissional" />` : ""}
          <p class="nome">${registro.psicologo_nome}</p>
          ${registro.crp ? `<p class="crp">CRP ${registro.crp}</p>` : ""}
          <p class="data">Assinado digitalmente em ${dataPtBr(registro.assinado_em)}${horaPtBr(registro.assinado_em) ? ` às ${horaPtBr(registro.assinado_em)}` : ""}</p>
        </section>
      `
      : "";

  popup.document.open();
  popup.document.write(`<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Registro clínico</title>
        <style>
          :root {
            color-scheme: light;
          }
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #1f2937;
            font-family: Inter, Arial, sans-serif;
          }
          body {
            padding: 28px;
          }
          .cabecalho {
            margin-bottom: 16px;
          }
          .titulo {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: #5f2d6d;
          }
          .subtitulo {
            margin: 6px 0 0;
            font-size: 13px;
            color: #6b7280;
          }
          .card {
            border: 1px solid #e9dff1;
            border-radius: 14px;
            background: #fcfafd;
            padding: 18px;
          }
          .registro {
            white-space: pre-wrap;
            line-height: 1.6;
            font-size: 14px;
          }
          .assinatura {
            margin-top: 18px;
          }
          .assinatura .linha {
            width: 220px;
            height: 1px;
            background: #d4c5df;
            margin-bottom: 14px;
          }
          .assinatura img {
            display: block;
            width: 260px;
            max-height: 90px;
            object-fit: contain;
            margin-bottom: 8px;
          }
          .assinatura .nome {
            margin: 0;
            font-size: 13px;
            font-weight: 700;
            color: #2f2436;
          }
          .assinatura .crp,
          .assinatura .data {
            margin: 2px 0 0;
            font-size: 12px;
            color: #6b7280;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <article>
          <header class="cabecalho">
            <h1 class="titulo">Registro clínico</h1>
            <p class="subtitulo">
              ${registro.paciente_nome} · ${dataPtBr(registro.data_registro)} · ${tipoAtendimentoLabel(registro.tipo_atendimento)}
            </p>
            <p class="subtitulo">
              ${registro.psicologo_nome}${registro.crp ? ` · CRP ${registro.crp}` : ""}
            </p>
          </header>
          <section class="card">
            <div class="registro">${conteudo}</div>
            ${assinaturaHtml}
          </section>
        </article>
      </body>
    </html>`);
  popup.document.close();

  popup.onload = () => {
    popup.focus();
    popup.print();
  };

  popup.onafterprint = () => {
    popup.close();
  };
}
