import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getConnection } from "@/lib/mysql";
import {
  type ConexaoMySQL,
  MENSAGEM_CONSULTA_REALIZADA_OBRIGATORIA,
  obterSessaoProntuario,
  validarAcessoClinicoPaciente,
  validarConsultaDaClinica,
  validarElegibilidadePacienteProntuario,
  validarPacienteDaClinica,
  validarPayloadProntuario,
  validarPsicologo,
} from "./utils";

export async function GET(request: Request) {
  let connection: ConexaoMySQL | undefined;

  try {
    connection = await getConnection();
    const sessao = await obterSessaoProntuario(connection);
    const erroPermissao = validarPsicologo(sessao);
    if (erroPermissao) {
      return Response.json({ error: erroPermissao }, { status: 403 });
    }
    const usuario = sessao as NonNullable<typeof sessao>;

    const { searchParams } = new URL(request.url);
    const pacienteId = Number(searchParams.get("paciente_id") || 0);
    const status = searchParams.get("status");
    const data = searchParams.get("data");
    const busca = searchParams.get("busca") || "";

    let where = `pe.clinica_id = ? AND pe.deleted_at IS NULL
      AND p.clinica_id = pe.clinica_id
      AND p.deleted_at IS NULL
      AND p.psicologo_responsavel_id = ?`;
    const params: Array<string | number> = [usuario.clinica_id, usuario.id];

    if (pacienteId) {
      where += " AND pe.paciente_id = ?";
      params.push(pacienteId);
    }
    if (status) {
      where += " AND pe.status = ?";
      params.push(status);
    }
    if (data) {
      where += " AND pe.data_registro = ?";
      params.push(data);
    }
    if (busca) {
      where += " AND p.nome LIKE ?";
      params.push(`%${busca}%`);
    }

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT pe.id, pe.clinica_id, pe.paciente_id, p.nome AS paciente_nome,
              p.ativo AS paciente_ativo,
              pe.psicologo_id, u.nome AS psicologo_nome, u.crp,
              pe.consulta_id, pe.data_registro, pe.tipo_atendimento,
              pe.conteudo, pe.status, pe.assinatura_url, pe.assinado_em,
              pe.finalizado_em, pe.criado_em, pe.atualizado_em,
              (
                SELECT phe.psicologo_id
                FROM registro_clinico_historico_edicoes phe
                WHERE phe.registro_clinico_id = pe.id
                ORDER BY phe.editado_em DESC, phe.id DESC
                LIMIT 1
              ) AS editado_por_id,
              (
                SELECT phe.nome_psicologo
                FROM registro_clinico_historico_edicoes phe
                WHERE phe.registro_clinico_id = pe.id
                ORDER BY phe.editado_em DESC, phe.id DESC
                LIMIT 1
              ) AS editado_por_nome,
              (
                SELECT phe.editado_em
                FROM registro_clinico_historico_edicoes phe
                WHERE phe.registro_clinico_id = pe.id
                ORDER BY phe.editado_em DESC, phe.id DESC
                LIMIT 1
              ) AS editado_em,
              (
                SELECT phe.assinatura_url
                FROM registro_clinico_historico_edicoes phe
                WHERE phe.registro_clinico_id = pe.id
                ORDER BY phe.editado_em DESC, phe.id DESC
                LIMIT 1
              ) AS assinatura_editor_url,
              (
                SELECT phe.crp_psicologo
                FROM registro_clinico_historico_edicoes phe
                WHERE phe.registro_clinico_id = pe.id
                ORDER BY phe.editado_em DESC, phe.id DESC
                LIMIT 1
              ) AS crp_editor
       FROM registros_clinicos pe
       INNER JOIN pacientes p ON p.id = pe.paciente_id
       INNER JOIN usuarios u ON u.id = pe.psicologo_id
       WHERE ${where}
       ORDER BY pe.data_registro DESC, pe.criado_em DESC`,
      params,
    );

    return Response.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro ao listar prontuários:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function POST(request: Request) {
  let connection: ConexaoMySQL | undefined;

  try {
    connection = await getConnection();
    const sessao = await obterSessaoProntuario(connection);
    const erroPermissao = validarPsicologo(sessao);
    if (erroPermissao) {
      return Response.json({ error: erroPermissao }, { status: 403 });
    }
    const usuario = sessao as NonNullable<typeof sessao>;

    const body = await request.json();
    const validacao = validarPayloadProntuario(body, Boolean(body.finalizar));
    if ("erro" in validacao) {
      return Response.json({ error: validacao.erro }, { status: 400 });
    }

    const pacienteValido = await validarPacienteDaClinica(
      connection,
      validacao.dados.paciente_id,
      usuario.clinica_id,
    );
    if (!pacienteValido) {
      return Response.json(
        { error: "Paciente não encontrado ou inativo" },
        { status: 400 },
      );
    }

    const erroElegibilidade = await validarElegibilidadePacienteProntuario(
      connection,
      validacao.dados.paciente_id,
      validacao.dados.consulta_id,
      usuario.clinica_id,
    );
    if (erroElegibilidade) {
      return Response.json({ error: erroElegibilidade }, { status: 400 });
    }

    const acessoPaciente = await validarAcessoClinicoPaciente(
      connection,
      validacao.dados.paciente_id,
      usuario,
    );
    if ("erro" in acessoPaciente) {
      return Response.json(
        { error: acessoPaciente.erro },
        { status: acessoPaciente.status },
      );
    }

    const consultaValida = await validarConsultaDaClinica(
      connection,
      validacao.dados.consulta_id,
      validacao.dados.paciente_id,
      usuario.clinica_id,
      usuario.id,
    );
    if (!consultaValida) {
      return Response.json(
        { error: MENSAGEM_CONSULTA_REALIZADA_OBRIGATORIA },
        { status: 400 },
      );
    }

    const status = body.finalizar ? "finalizado" : "rascunho";
    const [resultado] = await connection.execute<ResultSetHeader>(
      `INSERT INTO registros_clinicos (
        clinica_id, paciente_id, psicologo_id, consulta_id,
        data_registro, tipo_atendimento, conteudo, status, finalizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${body.finalizar ? "NOW()" : "NULL"})`,
      [
        usuario.clinica_id,
        validacao.dados.paciente_id,
        usuario.id,
        validacao.dados.consulta_id,
        validacao.dados.data_registro,
        validacao.dados.tipo_atendimento,
        validacao.dados.conteudo,
        status,
      ],
    );

    return Response.json({
      success: true,
      message: body.finalizar ? "Registro finalizado" : "Rascunho criado",
      id: resultado.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar evolução:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
