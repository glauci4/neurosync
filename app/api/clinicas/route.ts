import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { consultarDadosEmpresaPorCnpj } from "@/app/api/consulta-cnpj/service";
import { validarAcessoClinica } from "@/lib/auth/permissoesClinica";
import { getConnection } from "@/lib/mysql";
import { validarCRP, validarEmail } from "@/lib/validacoes";

type ConexaoMySQL = Awaited<ReturnType<typeof getConnection>>;

interface Sessao {
  id: number;
  email: string;
  clinica_id: number;
}

interface PayloadClinica {
  nome_fantasia?: string;
  razao_social?: string;
  nome_sidebar?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  site?: string | null;
  descricao_institucional?: string | null;
  crp_clinica?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  responsavel_tecnico_nome?: string | null;
  responsavel_tecnico_crp?: string | null;
  responsavel_tecnico_cargo?: string | null;
  permitir_multiplos_psicologos?: boolean;
  permitir_compartilhamento_prontuario?: boolean;
  exigir_assinatura_evolucoes?: boolean;
  bloquear_edicao_apos_assinatura?: boolean;
  tempo_maximo_edicao_evolucao?: number | null;
  habilitar_auditoria_clinica?: boolean;
}

async function obterSessao(): Promise<Sessao | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("usuario_neurosync");
  if (!cookie) return null;

  try {
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

async function obterColunas(connection: ConexaoMySQL, tabela: string) {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SHOW COLUMNS FROM ${tabela}`,
  );
  return new Set(rows.map((row) => String(row.Field)));
}

function selecionarColuna(
  colunas: Set<string>,
  coluna: string,
  alias = coluna,
  fallback = "NULL",
) {
  return colunas.has(coluna)
    ? `c.${coluna} AS ${alias}`
    : `${fallback} AS ${alias}`;
}

function normalizarNumeros(valor?: string | null) {
  return String(valor || "").replace(/\D/g, "");
}

function validarTelefone(valor?: string | null) {
  const numeros = normalizarNumeros(valor);
  return numeros.length === 10 || numeros.length === 11;
}

function validarCep(valor?: string | null) {
  return normalizarNumeros(valor).length === 8;
}

function validarSite(valor?: string | null) {
  if (!valor || !valor.trim()) return true;
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(valor.trim());
}

function textoPreenchido(valor: unknown) {
  return Boolean(valor && String(valor).trim());
}

function textoPlaceholder(valor: unknown) {
  return (
    String(valor || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "") === "clinica a definir"
  );
}

function aplicarSeVazioOuPlaceholder<T extends Record<string, unknown>>(
  destino: T,
  campo: keyof T,
  valor: unknown,
) {
  if (!textoPreenchido(valor)) return;
  if (!textoPreenchido(destino[campo]) || textoPlaceholder(destino[campo])) {
    destino[campo] = valor as T[keyof T];
  }
}

async function consultarDadosCnpj(cnpj: string) {
  const cnpjLimpo = normalizarNumeros(cnpj);
  if (cnpjLimpo.length !== 14) return null;

  try {
    const dados = await consultarDadosEmpresaPorCnpj(cnpjLimpo);
    return {
      razao_social: dados.razao_social,
      nome_fantasia: dados.nome_fantasia,
      endereco: dados.logradouro,
      numero: dados.numero,
      bairro: dados.bairro,
      cidade: dados.cidade,
      estado: dados.estado,
      cep: dados.cep,
      telefone: dados.telefone,
      email: dados.email,
    };
  } catch (error) {
    console.warn("Não foi possível enriquecer clínica pelo CNPJ:", error);
    return null;
  }
}

async function enriquecerComCnpj<T extends Record<string, unknown>>(data: T) {
  const dadosCnpj = await consultarDadosCnpj(String(data.cnpj || ""));
  if (!dadosCnpj) return data;

  aplicarSeVazioOuPlaceholder(data, "razao_social", dadosCnpj.razao_social);
  aplicarSeVazioOuPlaceholder(
    data,
    "nome_fantasia",
    dadosCnpj.nome_fantasia || dadosCnpj.razao_social,
  );
  aplicarSeVazioOuPlaceholder(
    data,
    "nome_sidebar",
    dadosCnpj.nome_fantasia || dadosCnpj.razao_social,
  );
  aplicarSeVazioOuPlaceholder(data, "telefone", dadosCnpj.telefone);
  aplicarSeVazioOuPlaceholder(data, "email", dadosCnpj.email);
  aplicarSeVazioOuPlaceholder(data, "endereco", dadosCnpj.endereco);
  aplicarSeVazioOuPlaceholder(data, "numero", dadosCnpj.numero);
  aplicarSeVazioOuPlaceholder(data, "bairro", dadosCnpj.bairro);
  aplicarSeVazioOuPlaceholder(data, "cidade", dadosCnpj.cidade);
  aplicarSeVazioOuPlaceholder(data, "estado", dadosCnpj.estado);
  aplicarSeVazioOuPlaceholder(data, "cep", dadosCnpj.cep);

  return data;
}

function formatarResposta(
  row: Record<string, unknown>,
  podeEditar: boolean,
  permissaoBasica = true,
) {
  const cnpj = String(row.cnpj || "");
  const telefone = String(row.telefone || "");
  const whatsapp = String(row.whatsapp || "");
  const cep = String(row.cep || "");

  const data = {
    id: Number(row.id),
    cnpj,
    nome_fantasia: String(row.nome_fantasia || ""),
    razao_social: String(row.razao_social || ""),
    nome_sidebar: String(row.nome_sidebar || row.nome_fantasia || ""),
    telefone: telefone || null,
    whatsapp: whatsapp || null,
    email: String(row.email || ""),
    site: String(row.site || ""),
    descricao_institucional: String(row.descricao_institucional || ""),
    crp_clinica: String(row.crp_clinica || ""),
    endereco: String(row.endereco || ""),
    numero: String(row.numero || ""),
    complemento: String(row.complemento || ""),
    bairro: String(row.bairro || ""),
    cidade: String(row.cidade || ""),
    estado: String(row.estado || ""),
    cep,
    logo_url: row.logo_url ? String(row.logo_url) : null,
    favicon_url: row.favicon_url ? String(row.favicon_url) : null,
    responsavel_tecnico_nome: row.responsavel_tecnico_nome
      ? String(row.responsavel_tecnico_nome)
      : null,
    responsavel_tecnico_crp: row.responsavel_tecnico_crp
      ? String(row.responsavel_tecnico_crp)
      : null,
    responsavel_tecnico_assinatura_url: row.responsavel_tecnico_assinatura_url
      ? String(row.responsavel_tecnico_assinatura_url)
      : null,
    responsavel_tecnico_cargo: row.responsavel_tecnico_cargo
      ? String(row.responsavel_tecnico_cargo)
      : null,
    permitir_multiplos_psicologos: Boolean(row.permitir_multiplos_psicologos),
    permitir_compartilhamento_prontuario: Boolean(
      row.permitir_compartilhamento_prontuario,
    ),
    exigir_assinatura_evolucoes: Boolean(row.exigir_assinatura_evolucoes),
    bloquear_edicao_apos_assinatura: Boolean(
      row.bloquear_edicao_apos_assinatura,
    ),
    tempo_maximo_edicao_evolucao: row.tempo_maximo_edicao_evolucao
      ? Number(row.tempo_maximo_edicao_evolucao)
      : null,
    habilitar_auditoria_clinica: Boolean(row.habilitar_auditoria_clinica),
    permite_edicao: podeEditar,
    pode_visualizar_basico: permissaoBasica,
  };

  const total = [
    data.nome_fantasia,
    data.razao_social,
    data.telefone,
    data.email,
    data.endereco,
    data.numero,
    data.bairro,
    data.cidade,
    data.estado,
    data.cep,
    data.logo_url,
    data.responsavel_tecnico_nome,
    data.responsavel_tecnico_crp,
    data.responsavel_tecnico_cargo,
  ].filter((valor) => Boolean(valor && String(valor).trim())).length;

  const totalConfiguracoes = [
    data.permitir_multiplos_psicologos,
    data.permitir_compartilhamento_prontuario,
    data.exigir_assinatura_evolucoes,
    data.bloquear_edicao_apos_assinatura,
    data.habilitar_auditoria_clinica,
  ].filter(Boolean).length;

  return {
    ...data,
    total_campos_configurados: total,
    total_campos_pendentes: 14 - total,
    total_configuracoes_ativas: totalConfiguracoes,
  };
}

async function _validarPermissaoEdicao(
  connection: ConexaoMySQL,
  usuarioId: number,
  clinicaId: number,
) {
  const [usuarios] = await connection.execute<RowDataPacket[]>(
    "SELECT perfil_id FROM usuarios WHERE id = ? AND clinica_id = ?",
    [usuarioId, clinicaId],
  );

  if (usuarios.length === 0) {
    return { ok: false, status: 404, error: "Usuário não encontrado" };
  }

  const [clinicas] = await connection.execute<RowDataPacket[]>(
    "SELECT responsavel_clinica_id FROM clinicas WHERE id = ?",
    [clinicaId],
  );

  if (clinicas.length === 0) {
    return { ok: false, status: 404, error: "Clínica não encontrada" };
  }

  const podeEditar =
    Number(usuarios[0].perfil_id) === 2 &&
    Number(clinicas[0].responsavel_clinica_id) === Number(usuarioId);

  return { ok: true, podeEditar };
}

export async function GET() {
  const sessao = await obterSessao();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const colunasClinicas = await obterColunas(connection, "clinicas");
    const colunasConsulta = [
      "id",
      "cnpj",
      "nome_fantasia",
      "razao_social",
      selecionarColuna(colunasClinicas, "nome_sidebar"),
      selecionarColuna(colunasClinicas, "telefone"),
      selecionarColuna(colunasClinicas, "whatsapp"),
      selecionarColuna(colunasClinicas, "email"),
      selecionarColuna(colunasClinicas, "site"),
      selecionarColuna(colunasClinicas, "descricao_institucional"),
      selecionarColuna(colunasClinicas, "crp_clinica"),
      selecionarColuna(colunasClinicas, "endereco"),
      selecionarColuna(colunasClinicas, "numero"),
      selecionarColuna(colunasClinicas, "complemento"),
      selecionarColuna(colunasClinicas, "bairro"),
      selecionarColuna(colunasClinicas, "cidade"),
      selecionarColuna(colunasClinicas, "estado"),
      selecionarColuna(colunasClinicas, "cep"),
      selecionarColuna(colunasClinicas, "logo_url"),
      selecionarColuna(colunasClinicas, "favicon_url"),
      selecionarColuna(colunasClinicas, "responsavel_tecnico_nome"),
      selecionarColuna(colunasClinicas, "responsavel_tecnico_crp"),
      selecionarColuna(colunasClinicas, "responsavel_tecnico_assinatura_url"),
      selecionarColuna(colunasClinicas, "responsavel_tecnico_cargo"),
      selecionarColuna(colunasClinicas, "permitir_multiplos_psicologos"),
      selecionarColuna(colunasClinicas, "permitir_compartilhamento_prontuario"),
      selecionarColuna(colunasClinicas, "exigir_assinatura_evolucoes"),
      selecionarColuna(colunasClinicas, "bloquear_edicao_apos_assinatura"),
      selecionarColuna(colunasClinicas, "tempo_maximo_edicao_evolucao"),
      selecionarColuna(colunasClinicas, "habilitar_auditoria_clinica"),
    ].join(",\n      ");

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT ${colunasConsulta}
       FROM clinicas c
       WHERE c.id = ?`,
      [sessao.clinica_id],
    );

    if (rows.length === 0) {
      return Response.json(
        { error: "Clínica não encontrada" },
        { status: 404 },
      );
    }

    const permissao = await validarAcessoClinica(connection);
    if (!permissao.ok) {
      return Response.json(
        { error: permissao.error },
        { status: permissao.status },
      );
    }

    const data = await enriquecerComCnpj(
      formatarResposta(rows[0], Boolean(permissao.usuario.isAdminClinica)),
    );
    return Response.json({
      success: true,
      data,
      permissoes: {
        podeVisualizarBasico: true,
        podeEditar: permissao.usuario.isAdminClinica,
        isAdmin: permissao.usuario.isAdminClinica,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar clínica:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function PUT(request: Request) {
  const sessao = await obterSessao();
  if (!sessao) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  let connection: ConexaoMySQL | undefined;
  try {
    connection = await getConnection();
    const permissao = await validarAcessoClinica(connection, { admin: true });
    if (!permissao.ok) {
      return Response.json(
        { error: permissao.error },
        { status: permissao.status },
      );
    }
    if (!permissao.usuario.isAdminClinica) {
      return Response.json(
        {
          error:
            "Apenas o psicólogo administrador da clínica pode editar estas informações.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as PayloadClinica;
    const atualizacoes: string[] = [];
    const valores: Array<string | number | null> = [];

    const adicionarCampo = (campo: keyof PayloadClinica, valor: unknown) => {
      if (typeof valor === "undefined") return;
      const chaveBanco =
        campo === "responsavel_tecnico_nome"
          ? "responsavel_tecnico_nome"
          : campo;
      atualizacoes.push(`${String(chaveBanco)} = ?`);
      valores.push(valor as string | number | null);
    };

    if (body.nome_fantasia !== undefined) {
      const valor = String(body.nome_fantasia).trim();
      if (!valor) {
        return Response.json(
          { error: "Nome fantasia é obrigatório" },
          { status: 400 },
        );
      }
      adicionarCampo("nome_fantasia", valor);
    }

    if (body.razao_social !== undefined) {
      const valor = String(body.razao_social).trim();
      if (!valor) {
        return Response.json(
          { error: "Razão social é obrigatória" },
          { status: 400 },
        );
      }
      adicionarCampo("razao_social", valor);
    }

    if (body.nome_sidebar !== undefined) {
      adicionarCampo("nome_sidebar", body.nome_sidebar?.trim() || null);
    }

    if (body.telefone !== undefined) {
      const valor = body.telefone ? normalizarNumeros(body.telefone) : "";
      if (valor && !validarTelefone(valor)) {
        return Response.json({ error: "Telefone inválido" }, { status: 400 });
      }
      adicionarCampo("telefone", valor || null);
    }

    if (body.whatsapp !== undefined) {
      const valor = body.whatsapp ? normalizarNumeros(body.whatsapp) : "";
      if (valor && !validarTelefone(valor)) {
        return Response.json({ error: "WhatsApp inválido" }, { status: 400 });
      }
      adicionarCampo("whatsapp", valor || null);
    }

    if (body.email !== undefined) {
      const valor = String(body.email).trim().toLowerCase();
      if (valor && !validarEmail(valor)) {
        return Response.json({ error: "E-mail inválido" }, { status: 400 });
      }
      adicionarCampo("email", valor || null);
    }

    if (body.site !== undefined) {
      const valor = body.site?.trim() || null;
      if (valor && !validarSite(valor)) {
        return Response.json({ error: "Site inválido" }, { status: 400 });
      }
      adicionarCampo("site", valor);
    }

    if (body.descricao_institucional !== undefined) {
      adicionarCampo(
        "descricao_institucional",
        body.descricao_institucional?.trim() || null,
      );
    }

    if (body.crp_clinica !== undefined) {
      const valor = body.crp_clinica?.trim() || null;
      if (valor && !validarCRP(valor)) {
        return Response.json(
          { error: "CRP da clínica inválido" },
          { status: 400 },
        );
      }
      adicionarCampo("crp_clinica", valor);
    }

    if (body.endereco !== undefined) {
      adicionarCampo("endereco", body.endereco?.trim() || null);
    }
    if (body.numero !== undefined) {
      adicionarCampo("numero", body.numero?.trim() || null);
    }
    if (body.complemento !== undefined) {
      adicionarCampo("complemento", body.complemento?.trim() || null);
    }
    if (body.bairro !== undefined) {
      adicionarCampo("bairro", body.bairro?.trim() || null);
    }
    if (body.cidade !== undefined) {
      adicionarCampo("cidade", body.cidade?.trim() || null);
    }
    if (body.estado !== undefined) {
      adicionarCampo("estado", body.estado?.trim().toUpperCase() || null);
    }
    if (body.cep !== undefined) {
      const valor = body.cep ? normalizarNumeros(body.cep) : "";
      if (valor && !validarCep(valor)) {
        return Response.json({ error: "CEP inválido" }, { status: 400 });
      }
      adicionarCampo("cep", valor || null);
    }

    if (body.responsavel_tecnico_nome !== undefined) {
      adicionarCampo(
        "responsavel_tecnico_nome",
        body.responsavel_tecnico_nome?.trim() || null,
      );
    }
    if (body.responsavel_tecnico_crp !== undefined) {
      const valor = body.responsavel_tecnico_crp?.trim() || null;
      if (valor && !validarCRP(valor)) {
        return Response.json(
          { error: "CRP do responsável inválido" },
          { status: 400 },
        );
      }
      adicionarCampo("responsavel_tecnico_crp", valor);
    }
    if (body.responsavel_tecnico_cargo !== undefined) {
      adicionarCampo(
        "responsavel_tecnico_cargo",
        body.responsavel_tecnico_cargo?.trim() || null,
      );
    }

    const camposBooleanos: Array<keyof PayloadClinica> = [
      "permitir_multiplos_psicologos",
      "permitir_compartilhamento_prontuario",
      "exigir_assinatura_evolucoes",
      "bloquear_edicao_apos_assinatura",
      "habilitar_auditoria_clinica",
    ];

    for (const campo of camposBooleanos) {
      if (typeof body[campo] !== "undefined") {
        adicionarCampo(campo, body[campo] ? 1 : 0);
      }
    }

    if (typeof body.tempo_maximo_edicao_evolucao !== "undefined") {
      const valor =
        body.tempo_maximo_edicao_evolucao === null
          ? null
          : Number(body.tempo_maximo_edicao_evolucao);
      if (valor !== null && (Number.isNaN(valor) || valor < 0)) {
        return Response.json(
          { error: "Tempo máximo de edição inválido" },
          { status: 400 },
        );
      }
      adicionarCampo("tempo_maximo_edicao_evolucao", valor);
    }

    if (atualizacoes.length === 0) {
      return Response.json(
        { error: "Nenhum campo informado para atualização" },
        { status: 400 },
      );
    }

    const sql = `UPDATE clinicas SET ${atualizacoes.join(", ")} WHERE id = ?`;
    valores.push(sessao.clinica_id);

    const [resultado] = await connection.execute<ResultSetHeader>(sql, valores);
    if (resultado.affectedRows === 0) {
      return Response.json(
        { error: "Clínica não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Clínica atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar clínica:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

