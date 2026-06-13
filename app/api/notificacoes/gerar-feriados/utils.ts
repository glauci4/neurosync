import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getFeriadosNacionais } from "@/app/configuracoes/funcionamento/services/feriados";
import type { ConexaoMySQL } from "@/lib/auth/validarAcesso";
import { obterRotuloTipoNotificacao } from "@/lib/notificacoes";

interface LinhaUsuarioAtivo extends RowDataPacket {
  id: number;
}

interface FeriadoOficial {
  date: string;
  name: string;
}

interface FeriadoNotificacao {
  tipo: "feriado_30_dias" | "feriado_7_dias";
  dias: number;
}

const TIPOS_FERIADO: FeriadoNotificacao[] = [
  { tipo: "feriado_30_dias", dias: 30 },
  { tipo: "feriado_7_dias", dias: 7 },
];

function formatarDataISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function obterDataReferenciaDias(dias: number) {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() + dias);
  return formatarDataISO(data);
}

function obterChaveEntidadeFeriado(data: string) {
  return Number(data.replaceAll("-", ""));
}

async function listarUsuariosAtivos(
  connection: ConexaoMySQL,
  clinicaId: number,
) {
  const [usuarios] = await connection.execute<RowDataPacket[]>(
    `SELECT id
       FROM usuarios
      WHERE clinica_id = ?
        AND COALESCE(ativo, 1) = 1`,
    [clinicaId],
  );

  return usuarios as LinhaUsuarioAtivo[];
}

async function listarFeriadosOficiais(): Promise<FeriadoOficial[]> {
  const anoAtual = new Date().getFullYear();
  const anos = [anoAtual, anoAtual + 1];
  const feriadosPorAno = await Promise.allSettled(
    anos.map((ano) => getFeriadosNacionais(ano)),
  );

  const feriados = feriadosPorAno.flatMap((resultado) =>
    resultado.status === "fulfilled" ? resultado.value : [],
  );

  const mapa = new Map<string, FeriadoOficial>();
  for (const feriado of feriados) {
    if (!feriado.date) continue;
    mapa.set(feriado.date, feriado);
  }

  return [...mapa.values()];
}

async function inserirNotificacaoFeriadoSeNaoExistir(
  connection: ConexaoMySQL,
  params: {
    clinicaId: number;
    usuarioId: number;
    tipo: "feriado_30_dias" | "feriado_7_dias";
    titulo: string;
    mensagem: string;
    entidadeId: number;
  },
) {
  const [resultado] = await connection.execute<ResultSetHeader>(
    `INSERT INTO notificacoes (
        clinica_id,
        usuario_id,
        tipo,
        titulo,
        mensagem,
        entidade_tipo,
        entidade_id,
        lida,
        criado_em
      )
      SELECT ?, ?, ?, ?, ?, 'feriado', ?, 0, NOW()
       FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1
          FROM notificacoes
         WHERE clinica_id = ?
           AND usuario_id = ?
           AND tipo = ?
           AND entidade_tipo = 'feriado'
           AND entidade_id = ?
      )`,
    [
      params.clinicaId,
      params.usuarioId,
      params.tipo,
      params.titulo,
      params.mensagem,
      params.entidadeId,
      params.clinicaId,
      params.usuarioId,
      params.tipo,
      params.entidadeId,
    ],
  );

  return resultado.affectedRows;
}

export async function gerarNotificacoesFeriados(
  connection: ConexaoMySQL,
  clinicaId: number,
) {
  const usuarios = await listarUsuariosAtivos(connection, clinicaId);
  const feriadosOficiais = await listarFeriadosOficiais();

  let totalCriadas = 0;
  const resultados: Record<string, number> = {
    feriado_30_dias: 0,
    feriado_7_dias: 0,
  };

  for (const configuracao of TIPOS_FERIADO) {
    const dataReferencia = obterDataReferenciaDias(configuracao.dias);
    const feriado = feriadosOficiais.find(
      (item) => item.date === dataReferencia,
    );
    if (!feriado) continue;

    const dataFormatada = new Intl.DateTimeFormat("pt-BR").format(
      new Date(`${feriado.date}T00:00:00`),
    );
    const titulo = obterRotuloTipoNotificacao(configuracao.tipo);
    const mensagem = `Feriado em ${configuracao.dias} dias: ${feriado.name} — ${dataFormatada}.`;
    const entidadeId = obterChaveEntidadeFeriado(feriado.date);
    let criadasPorTipo = 0;

    for (const usuario of usuarios) {
      criadasPorTipo += await inserirNotificacaoFeriadoSeNaoExistir(
        connection,
        {
          clinicaId,
          usuarioId: Number(usuario.id),
          tipo: configuracao.tipo,
          titulo,
          mensagem,
          entidadeId,
        },
      );
    }
    resultados[configuracao.tipo] = criadasPorTipo;
    totalCriadas += criadasPorTipo;
  }

  return {
    feriado_30_dias: resultados.feriado_30_dias,
    feriado_7_dias: resultados.feriado_7_dias,
    total: totalCriadas,
  };
}

