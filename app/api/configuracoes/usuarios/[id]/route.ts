import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";
import {
  listarPacientesVinculadosParaTransferencia,
  listarPsicologosAtivosTransferencia,
  obterResumoInativacaoUsuario,
} from "../inativacao-clinica.helpers";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

const MENSAGEM_CONSULTAS_FUTURAS =
  "Não é possível inativar enquanto houver consultas futuras vinculadas. Remaneje os atendimentos antes de continuar.";

interface AlterarStatusPayload {
  ativo?: boolean;
  transferir_admin_para_id?: number;
  inativar_clinica?: boolean;
  transferir_pacientes_para_id?: number;
  motivo_transferencia_pacientes?: string;
  observacoes_transferencia_pacientes?: string | null;
}

function normalizarTexto(valor?: string | null) {
  return String(valor || "").trim();
}

function parseUsuarioId(id: string) {
  const usuarioId = Number.parseInt(id, 10);
  return Number.isInteger(usuarioId) && usuarioId > 0 ? usuarioId : null;
}

async function obterUsuarioGerenciado(
  connection: ConexaoMySQL,
  usuarioId: number,
  clinicaId: number,
) {
  const [usuarios] = await connection.execute<RowDataPacket[]>(
    `SELECT u.id, u.nome, u.email, u.telefone, u.perfil_id,
            COALESCE(u.ativo, 1) AS ativo,
            u.clinica_id, c.responsavel_clinica_id
     FROM usuarios u
     INNER JOIN clinicas c ON c.id = u.clinica_id
     WHERE u.id = ? AND u.clinica_id = ?`,
    [usuarioId, clinicaId],
  );

  return usuarios[0] || null;
}

function usuarioEhResponsavel(usuario: RowDataPacket) {
  return (
    Boolean(usuario.responsavel_clinica_id) &&
    Number(usuario.id) === Number(usuario.responsavel_clinica_id)
  );
}

async function verificarVinculo(
  connection: ConexaoMySQL,
  tabela: string,
  coluna: string,
  where: string,
  params: Array<number | string>,
) {
  const [colunas] = await connection.execute<RowDataPacket[]>(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tabela, coluna],
  );

  if (colunas.length === 0) return false;

  const [vinculos] = await connection.execute<RowDataPacket[]>(
    `SELECT 1 FROM ${tabela} WHERE ${where} LIMIT 1`,
    params,
  );

  return vinculos.length > 0;
}

async function usuarioPossuiHistoricoClinico(
  connection: ConexaoMySQL,
  usuarioId: number,
  clinicaId: number,
) {
  const verificacoes = [
    {
      tabela: "consultas",
      coluna: "psicologo_id",
      where: "clinica_id = ? AND psicologo_id = ?",
      params: [clinicaId, usuarioId],
    },
    {
      tabela: "registros_clinicos",
      coluna: "psicologo_id",
      where: "clinica_id = ? AND psicologo_id = ?",
      params: [clinicaId, usuarioId],
    },
    {
      tabela: "registro_clinico_historico_edicoes",
      coluna: "psicologo_id",
      where:
        "psicologo_id = ? AND registro_clinico_id IN (SELECT id FROM registros_clinicos WHERE clinica_id = ?)",
      params: [usuarioId, clinicaId],
    },
  ];

  for (const verificacao of verificacoes) {
    const possuiVinculo = await verificarVinculo(
      connection,
      verificacao.tabela,
      verificacao.coluna,
      verificacao.where,
      verificacao.params,
    );

    if (possuiVinculo) return verificacao.tabela;
  }

  return null;
}

function dataHoraAtualLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  const horas = String(agora.getHours()).padStart(2, "0");
  const minutos = String(agora.getMinutes()).padStart(2, "0");
  const segundos = String(agora.getSeconds()).padStart(2, "0");
  return {
    data: `${ano}-${mes}-${dia}`,
    hora: `${horas}:${minutos}:${segundos}`,
  };
}

async function psicologoPossuiConsultasFuturas(
  connection: ConexaoMySQL,
  usuarioId: number,
  clinicaId: number,
) {
  const agora = dataHoraAtualLocal();
  const [consultas] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM consultas
     WHERE clinica_id = ? AND psicologo_id = ? AND deleted_at IS NULL
       AND status IN ('agendado', 'remarcado')
       AND (
         data_consulta > ?
         OR (data_consulta = ? AND horario_fim >= ?)
       )
     LIMIT 1`,
    [clinicaId, usuarioId, agora.data, agora.data, agora.hora],
  );

  return consultas.length > 0;
}

async function listarPsicologosAtivos(
  connection: ConexaoMySQL,
  clinicaId: number,
  excluirUsuarioId: number,
) {
  return listarPsicologosAtivosTransferencia(
    connection,
    clinicaId,
    excluirUsuarioId,
  );
}

async function transferirPacientesParaNovoResponsavel(
  connection: ConexaoMySQL,
  clinicaId: number,
  psicologoOrigemId: number,
  psicologoDestinoId: number,
  transferidoPorId: number,
  motivo: string,
  observacoes?: string | null,
) {
  const pacientes = await listarPacientesVinculadosParaTransferencia(
    connection,
    clinicaId,
    psicologoOrigemId,
  );

  if (pacientes.length === 0) {
    return 0;
  }

  await connection.execute(
    `UPDATE pacientes
     SET psicologo_responsavel_id = ?,
         psicologo_responsavel_atribuido_em = NOW(),
         psicologo_responsavel_atribuido_por_id = ?
     WHERE clinica_id = ?
       AND deleted_at IS NULL
       AND psicologo_responsavel_id = ?`,
    [psicologoDestinoId, transferidoPorId, clinicaId, psicologoOrigemId],
  );

  const valores = pacientes
    .map(
      (_paciente) => "(?, ?, ?, ?, ?, ?, 'transferencia_por_inativacao', ?, ?)",
    )
    .join(", ");

  const params: Array<number | string | null> = [];
  for (const paciente of pacientes) {
    params.push(
      clinicaId,
      paciente.paciente_id,
      psicologoOrigemId,
      psicologoDestinoId,
      paciente.consulta_id_origem,
      transferidoPorId,
      motivo,
      observacoes || null,
    );
  }

  await connection.execute(
    `INSERT INTO paciente_acompanhamento_historico (
       clinica_id,
       paciente_id,
       psicologo_origem_id,
       psicologo_destino_id,
       consulta_id_origem,
       transferido_por_id,
       tipo_evento,
       motivo,
       observacoes
     ) VALUES ${valores}`,
    params,
  );

  return pacientes.length;
}

async function validarPsicologoDestinoAtivo(
  connection: ConexaoMySQL,
  clinicaId: number,
  psicologoDestinoId: number,
) {
  const [psicologoDestino] = await connection.execute<RowDataPacket[]>(
    `SELECT id, nome
     FROM usuarios
     WHERE id = ?
       AND clinica_id = ?
       AND perfil_id = 2
       AND COALESCE(ativo, 1) = 1
     LIMIT 1`,
    [psicologoDestinoId, clinicaId],
  );

  return psicologoDestino.length > 0;
}

async function transferirConsultasFuturas(
  connection: ConexaoMySQL,
  clinicaId: number,
  psicologoOrigemId: number,
  psicologoDestinoId: number,
) {
  const agora = dataHoraAtualLocal();
  const [resultado] = await connection.execute<ResultSetHeader>(
    `UPDATE consultas
     SET psicologo_id = ?
     WHERE clinica_id = ?
       AND psicologo_id = ?
       AND deleted_at IS NULL
       AND status IN ('agendado', 'remarcado')
       AND (
         data_consulta > ?
         OR (data_consulta = ? AND horario_fim >= ?)
       )`,
    [
      psicologoDestinoId,
      clinicaId,
      psicologoOrigemId,
      agora.data,
      agora.data,
      agora.hora,
    ],
  );

  return resultado.affectedRows;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const usuarioId = parseUsuarioId(id);
  if (!usuarioId) {
    return Response.json({ error: "Usuário inválido" }, { status: 400 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const usuario = await obterUsuarioGerenciado(
      connection,
      usuarioId,
      acesso.usuario.clinica_id,
    );
    if (!usuario) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const resumo =
      Number(usuario.perfil_id) === 2
        ? await obterResumoInativacaoUsuario(
            connection,
            usuarioId,
            acesso.usuario.clinica_id,
          )
        : {
            pacientes_ativos_vinculados: 0,
            pacientes_espera_vinculados: 0,
            agendamentos_futuros: 0,
            prontuarios_vinculados: 0,
            total_pacientes_vinculados: 0,
          };

    const psicologosTransferencia = await listarPsicologosAtivos(
      connection,
      acesso.usuario.clinica_id,
      usuarioId,
    );

    const deveTransferirPacientes =
      Number(usuario.perfil_id) === 2 &&
      (Number(resumo.total_pacientes_vinculados) > 0 ||
        Number(resumo.agendamentos_futuros) > 0);
    const deveTransferirAdministracao =
      usuarioEhResponsavel(usuario) && psicologosTransferencia.length > 0;

    return Response.json({
      success: true,
      data: {
        usuario: {
          id: Number(usuario.id),
          nome: String(usuario.nome || ""),
          perfil_id: Number(usuario.perfil_id),
          ativo: Boolean(usuario.ativo),
          isResponsavelClinica: usuarioEhResponsavel(usuario),
        },
        resumo,
        deve_transferir_pacientes: deveTransferirPacientes,
        deve_transferir_administracao: deveTransferirAdministracao,
        deve_inativar_clinica:
          usuarioEhResponsavel(usuario) && psicologosTransferencia.length === 0,
        psicologos_transferencia: psicologosTransferencia,
      },
    });
  } catch (error) {
    console.error("Erro ao obter prévia de inativação:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const usuarioId = parseUsuarioId(id);
  if (!usuarioId) {
    return Response.json({ error: "Usuário inválido" }, { status: 400 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const body: AlterarStatusPayload = await request.json();
    if (typeof body.ativo !== "boolean") {
      return Response.json(
        { error: "Status do usuário inválido" },
        { status: 400 },
      );
    }

    const transferirPacientesId = Number(
      body.transferir_pacientes_para_id || 0,
    );
    const transferirAdminId = Number(body.transferir_admin_para_id || 0);
    const motivoTransferencia = normalizarTexto(
      body.motivo_transferencia_pacientes,
    );
    const observacoesTransferencia = normalizarTexto(
      body.observacoes_transferencia_pacientes,
    );

    const usuario = await obterUsuarioGerenciado(
      connection,
      usuarioId,
      acesso.usuario.clinica_id,
    );
    if (!usuario) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const selfInativando =
      !body.ativo && Number(usuario.id) === acesso.usuario.id;
    const responsavelAtual = usuarioEhResponsavel(usuario);
    const isPsicologo = Number(usuario.perfil_id) === 2;
    const resumoInativacao = isPsicologo
      ? await obterResumoInativacaoUsuario(
          connection,
          usuarioId,
          acesso.usuario.clinica_id,
        )
      : {
          pacientes_ativos_vinculados: 0,
          pacientes_espera_vinculados: 0,
          agendamentos_futuros: 0,
          prontuarios_vinculados: 0,
          total_pacientes_vinculados: 0,
        };
    const precisaTransferirPacientes =
      isPsicologo && Number(resumoInativacao.total_pacientes_vinculados) > 0;
    const precisaTransferirConsultas =
      isPsicologo && Number(resumoInativacao.agendamentos_futuros) > 0;
    const precisaTransferenciaOperacional =
      precisaTransferirPacientes || precisaTransferirConsultas;
    const psicologosAtivos = await listarPsicologosAtivos(
      connection,
      acesso.usuario.clinica_id,
      usuarioId,
    );
    const podeFecharClinicaSemTransferencia =
      !body.ativo &&
      selfInativando &&
      responsavelAtual &&
      psicologosAtivos.length === 0 &&
      Boolean(body.inativar_clinica);

    if (
      !podeFecharClinicaSemTransferencia &&
      !body.ativo &&
      precisaTransferenciaOperacional &&
      !transferirPacientesId
    ) {
      return Response.json(
        {
          error:
            "É necessário transferir pacientes e/ou consultas futuras antes de inativar este psicólogo.",
          code: "TRANSFERIR_PACIENTES",
          resumo_inativacao: resumoInativacao,
          usuarios_transferencia: psicologosAtivos,
        },
        { status: 409 },
      );
    }

    if (
      !body.ativo &&
      precisaTransferenciaOperacional &&
      transferirPacientesId === usuarioId
    ) {
      return Response.json(
        {
          error:
            "Selecione um psicólogo diferente para receber os pacientes e atendimentos futuros",
        },
        { status: 400 },
      );
    }

    if (
      !body.ativo &&
      precisaTransferenciaOperacional &&
      !motivoTransferencia
    ) {
      return Response.json(
        { error: "Informe um motivo para a transferência" },
        { status: 400 },
      );
    }

    if (!body.ativo && responsavelAtual) {
      if (psicologosAtivos.length > 0) {
        if (!transferirAdminId) {
          return Response.json(
            {
              error:
                "Selecione um psicólogo ativo para assumir a administração da clínica.",
              code: "TRANSFERIR_ADMIN",
              usuarios_transferencia: psicologosAtivos,
            },
            { status: 409 },
          );
        }

        const novoAdmin = psicologosAtivos.find(
          (item) => item.id === transferirAdminId,
        );
        if (!novoAdmin) {
          return Response.json(
            {
              error:
                "Selecione um psicólogo ativo para assumir a administração da clínica.",
              code: "TRANSFERIR_ADMIN",
              usuarios_transferencia: psicologosAtivos,
            },
            { status: 409 },
          );
        }

        await connection.beginTransaction();
        try {
          if (
            precisaTransferenciaOperacional &&
            !podeFecharClinicaSemTransferencia
          ) {
            if (
              !(await validarPsicologoDestinoAtivo(
                connection,
                acesso.usuario.clinica_id,
                transferirPacientesId,
              ))
            ) {
              await connection.rollback();
              return Response.json(
                {
                  error:
                    "O psicólogo selecionado não pertence à clínica, está inativo ou não possui permissão para acompanhamento clínico.",
                },
                { status: 400 },
              );
            }

            if (precisaTransferirPacientes) {
              await transferirPacientesParaNovoResponsavel(
                connection,
                acesso.usuario.clinica_id,
                usuarioId,
                transferirPacientesId,
                acesso.usuario.id,
                motivoTransferencia,
                observacoesTransferencia || null,
              );
            }

            if (precisaTransferirConsultas) {
              await transferirConsultasFuturas(
                connection,
                acesso.usuario.clinica_id,
                usuarioId,
                transferirPacientesId,
              );
            }
          }

          await connection.execute(
            `UPDATE clinicas
             SET responsavel_clinica_id = ?
             WHERE id = ?`,
            [transferirAdminId, acesso.usuario.clinica_id],
          );

          await connection.execute(
            `UPDATE usuarios
             SET ativo = CASE WHEN id = ? THEN 0 ELSE ativo END
             WHERE clinica_id = ?`,
            [usuarioId, acesso.usuario.clinica_id],
          );

          await connection.commit();
          return Response.json({
            success: true,
            message: "Administração transferida e conta inativada",
          });
        } catch (error) {
          await connection.rollback();
          throw error;
        }
      }

      if (!selfInativando) {
        return Response.json(
          {
            error:
              "Não há outro psicólogo ativo disponível para assumir a responsabilidade da clínica.",
            code: "TRANSFERIR_ADMIN_INDISPONIVEL",
          },
          { status: 409 },
        );
      }

      if (!body.inativar_clinica) {
        return Response.json(
          {
            error:
              "Você é o único psicólogo administrador ativo. Ao inativar seu perfil, todas as contas da clínica serão desativadas e o acesso ao sistema será encerrado para esta clínica.",
            code: "INATIVAR_CLINICA",
          },
          { status: 409 },
        );
      }

      await connection.beginTransaction();
      try {
        if (
          precisaTransferenciaOperacional &&
          !podeFecharClinicaSemTransferencia
        ) {
          if (
            !(await validarPsicologoDestinoAtivo(
              connection,
              acesso.usuario.clinica_id,
              transferirPacientesId,
            ))
          ) {
            await connection.rollback();
            return Response.json(
              {
                error:
                  "O psicólogo selecionado não pertence à clínica, está inativo ou não possui permissão para acompanhamento clínico.",
              },
              { status: 400 },
            );
          }

          if (precisaTransferirPacientes) {
            await transferirPacientesParaNovoResponsavel(
              connection,
              acesso.usuario.clinica_id,
              usuarioId,
              transferirPacientesId,
              acesso.usuario.id,
              motivoTransferencia,
              observacoesTransferencia || null,
            );
          }

          if (precisaTransferirConsultas) {
            await transferirConsultasFuturas(
              connection,
              acesso.usuario.clinica_id,
              usuarioId,
              transferirPacientesId,
            );
          }
        }

        await connection.execute(
          `UPDATE usuarios
           SET ativo = 0
           WHERE clinica_id = ?`,
          [acesso.usuario.clinica_id],
        );

        await connection.execute(
          `UPDATE clinicas
           SET responsavel_clinica_id = NULL
           WHERE id = ?`,
          [acesso.usuario.clinica_id],
        );

        await connection.commit();
        return Response.json({
          success: true,
          message: "Clínica inativada com sucesso",
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    if (!body.ativo && !responsavelAtual && precisaTransferenciaOperacional) {
      if (
        !(await validarPsicologoDestinoAtivo(
          connection,
          acesso.usuario.clinica_id,
          transferirPacientesId,
        ))
      ) {
        return Response.json(
          {
            error:
              "O psicólogo selecionado não pertence à clínica, está inativo ou não possui permissão para acompanhamento clínico.",
          },
          { status: 400 },
        );
      }

      await connection.beginTransaction();
      try {
        if (precisaTransferirPacientes) {
          await transferirPacientesParaNovoResponsavel(
            connection,
            acesso.usuario.clinica_id,
            usuarioId,
            transferirPacientesId,
            acesso.usuario.id,
            motivoTransferencia,
            observacoesTransferencia || null,
          );
        }

        if (precisaTransferirConsultas) {
          await transferirConsultasFuturas(
            connection,
            acesso.usuario.clinica_id,
            usuarioId,
            transferirPacientesId,
          );
        }

        const [resultado] = await connection.execute<ResultSetHeader>(
          `UPDATE usuarios
           SET ativo = 0
           WHERE id = ? AND clinica_id = ?`,
          [usuarioId, acesso.usuario.clinica_id],
        );

        if (resultado.affectedRows === 0) {
          await connection.rollback();
          return Response.json(
            { error: "Usuário não encontrado" },
            { status: 404 },
          );
        }

        await connection.commit();
        return Response.json({
          success: true,
          message: "Vínculos transferidos e usuário inativado",
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    if (
      !body.ativo &&
      Number(usuario.perfil_id) === 2 &&
      (await psicologoPossuiConsultasFuturas(
        connection,
        usuarioId,
        acesso.usuario.clinica_id,
      ))
    ) {
      return Response.json(
        { error: MENSAGEM_CONSULTAS_FUTURAS },
        { status: 409 },
      );
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      `UPDATE usuarios
       SET ativo = ?
       WHERE id = ? AND clinica_id = ?`,
      [body.ativo ? 1 : 0, usuarioId, acesso.usuario.clinica_id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: body.ativo ? "Usuário reativado" : "Usuário inativado",
    });
  } catch (error) {
    console.error("Erro ao alterar status do usuário:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const usuarioId = parseUsuarioId(id);
  if (!usuarioId) {
    return Response.json({ error: "Usuário inválido" }, { status: 400 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const acesso = await validarAcessoClinica(connection, { admin: true });
    if (!acesso.ok) {
      return Response.json({ error: acesso.error }, { status: acesso.status });
    }

    const usuario = await obterUsuarioGerenciado(
      connection,
      usuarioId,
      acesso.usuario.clinica_id,
    );
    if (!usuario) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (Number(usuario.id) === acesso.usuario.id) {
      return Response.json(
        {
          error: "O responsável institucional não pode excluir a própria conta",
        },
        { status: 403 },
      );
    }

    if (usuarioEhResponsavel(usuario)) {
      return Response.json(
        {
          error:
            "O responsável institucional da clínica não pode ser excluído por esta tela.",
        },
        { status: 403 },
      );
    }

    const tabelaComHistorico = await usuarioPossuiHistoricoClinico(
      connection,
      usuarioId,
      acesso.usuario.clinica_id,
    );
    if (tabelaComHistorico) {
      return Response.json(
        {
          error:
            "Este usuário possui histórico clínico vinculado e não pode ser excluído. Inative o acesso para preservar os registros.",
          tabela: tabelaComHistorico,
        },
        { status: 409 },
      );
    }

    const [resultado] = await connection.execute<ResultSetHeader>(
      "DELETE FROM usuarios WHERE id = ? AND clinica_id = ?",
      [usuarioId, acesso.usuario.clinica_id],
    );

    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, message: "Usuário excluído" });
  } catch (error) {
    console.error("Erro ao excluir usuário do sistema:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
