"use client";

import { useState } from "react";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import AcessoNegadoUsuarios from "./components/AcessoNegadoUsuarios";
import FiltrosUsuariosSistema from "./components/FiltrosUsuariosSistema";
import ListaUsuariosSistema from "./components/ListaUsuariosSistema";
import UsuariosSistemaSkeleton from "./components/UsuariosSistemaSkeleton";
import { useInativarUsuarioSistema } from "./hooks/useInativarUsuarioSistema";
import { usePreviaInativacaoUsuario } from "./hooks/usePreviaInativacaoUsuario";
import { useReativarUsuarioSistema } from "./hooks/useReativarUsuarioSistema";
import { useUsuariosSistema } from "./hooks/useUsuariosSistema";
import ModalConfirmarInativacao from "./modals/ModalConfirmarInativacao";
import ModalInativarClinica from "./modals/ModalInativarClinica";
import ModalTransferirAdministracao from "./modals/ModalTransferirAdministracao";
import ModalTransferirEInativarUsuario from "./modals/ModalTransferirEInativarUsuario";
import type {
  FiltrosUsuariosSistema as FiltrosUsuariosSistemaState,
  PreviaInativacaoUsuario,
  UsuarioSistema,
} from "./types/usuariosSistema.types";

const filtrosIniciais: FiltrosUsuariosSistemaState = {
  busca: "",
  perfil: "todos",
  status: "todos",
};

export default function UsuariosSistemaPage({
  podeGerenciar,
}: {
  podeGerenciar?: boolean;
}) {
  const { usuario, carregando: authLoading } = useAutenticacao();
  const [filtros, setFiltros] =
    useState<FiltrosUsuariosSistemaState>(filtrosIniciais);
  const [acaoStatus, setAcaoStatus] = useState<{
    usuario: UsuarioSistema | null;
    reativar: boolean;
  }>({ usuario: null, reativar: false });
  const [usuarioInativacaoCritica, setUsuarioInativacaoCritica] =
    useState<UsuarioSistema | null>(null);
  const [previsaoInativacao, setPrevisaoInativacao] =
    useState<PreviaInativacaoUsuario | null>(null);
  const [usuarioTransferencia, setUsuarioTransferencia] =
    useState<UsuarioSistema | null>(null);
  const [inativarClinica, setInativarClinica] = useState(false);
  const [novoAdminId, setNovoAdminId] = useState<number | null>(null);

  const podeGerenciarEfetivo = Boolean(
    usuario?.isResponsavelClinica ?? usuario?.isAdminClinica,
  );
  const usuariosQuery = useUsuariosSistema(filtros, podeGerenciarEfetivo);
  const previsualizarInativacao = usePreviaInativacaoUsuario();
  const inativarUsuario = useInativarUsuarioSistema();
  const reativarUsuario = useReativarUsuarioSistema();

  const usuarios = usuariosQuery.data?.data || [];
  const erro = usuariosQuery.error;
  const podeGerenciarFinal =
    typeof podeGerenciar === "boolean" ? podeGerenciar : podeGerenciarEfetivo;
  const outrosPsicologosAtivos = podeGerenciarEfetivo
    ? usuarios.filter(
        (item) => item.ativo && item.perfil_id === 2 && item.id !== usuario?.id,
      )
    : [];
  const usuarioAtualId = usuario?.id ?? null;
  const acessoNegado =
    erro instanceof Error &&
    (erro.message.includes("inativo") ||
      erro.message.includes("Não autenticado"));

  if (authLoading) {
    return (
      <div className="rounded-2xl border border-[#9F64AF]/15 bg-white/80 p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">Carregando usuários...</p>
      </div>
    );
  }

  if (!podeGerenciarEfetivo) {
    return <AcessoNegadoUsuarios />;
  }

  async function iniciarInativacao(usuarioAlvo: UsuarioSistema) {
    try {
      const previa = await previsualizarInativacao.mutateAsync(usuarioAlvo.id);
      setPrevisaoInativacao(previa);

      if (previa.deve_transferir_pacientes) {
        setUsuarioInativacaoCritica(usuarioAlvo);
        setAcaoStatus({ usuario: null, reativar: false });
        return;
      }

      if (previa.usuario.isResponsavelClinica) {
        const psicologosDisponiveis = usuarios.filter(
          (item) =>
            item.ativo && item.perfil_id === 2 && item.id !== usuarioAlvo.id,
        );
        setNovoAdminId(psicologosDisponiveis[0]?.id || null);
        setUsuarioTransferencia(usuarioAlvo);
        setAcaoStatus({ usuario: null, reativar: false });
        return;
      }

      setAcaoStatus({ usuario: usuarioAlvo, reativar: false });
    } catch {
      // o hook já exibe o feedback; mantém a tela estável
    }
  }

  function confirmarStatus() {
    if (!acaoStatus.usuario) return;
    const ehAutoInativacao =
      !acaoStatus.reativar &&
      Boolean(usuario?.isResponsavelClinica ?? usuario?.isAdminClinica) &&
      usuarioAtualId !== null &&
      usuarioAtualId === acaoStatus.usuario.id;

    if (ehAutoInativacao && outrosPsicologosAtivos.length > 0) {
      setNovoAdminId(outrosPsicologosAtivos[0]?.id || null);
      setUsuarioTransferencia(acaoStatus.usuario);
      setAcaoStatus({ usuario: null, reativar: false });
      return;
    }

    if (ehAutoInativacao && outrosPsicologosAtivos.length === 0) {
      setInativarClinica(true);
      setUsuarioTransferencia(acaoStatus.usuario);
      setAcaoStatus({ usuario: null, reativar: false });
      return;
    }

    const mutation = acaoStatus.reativar ? reativarUsuario : inativarUsuario;
    mutation.mutate(acaoStatus.usuario.id, {
      onSuccess: () => setAcaoStatus({ usuario: null, reativar: false }),
    });
  }

  function confirmarTransferencia() {
    if (!usuarioTransferencia || !novoAdminId) return;
    inativarUsuario.mutate(
      {
        id: usuarioTransferencia.id,
        transferir_admin_para_id: novoAdminId,
      },
      {
        onSuccess: () => {
          setUsuarioTransferencia(null);
          setNovoAdminId(null);
        },
      },
    );
  }

  function confirmarInativacaoClinica() {
    if (!usuarioTransferencia) return;
    inativarUsuario.mutate(
      {
        id: usuarioTransferencia.id,
        inativar_clinica: true,
      },
      {
        onSuccess: () => {
          setUsuarioTransferencia(null);
          setInativarClinica(false);
        },
      },
    );
  }

  function confirmarInativacaoCritica(payload: {
    transferir_pacientes_para_id: number;
    motivo_transferencia_pacientes: string;
    observacoes_transferencia_pacientes?: string | null;
    transferir_admin_para_id?: number | null;
  }) {
    if (!usuarioInativacaoCritica) return;

    inativarUsuario.mutate(
      {
        id: usuarioInativacaoCritica.id,
        transferir_pacientes_para_id: payload.transferir_pacientes_para_id,
        motivo_transferencia_pacientes: payload.motivo_transferencia_pacientes,
        observacoes_transferencia_pacientes:
          payload.observacoes_transferencia_pacientes,
        transferir_admin_para_id: payload.transferir_admin_para_id ?? undefined,
      },
      {
        onSuccess: () => {
          setUsuarioInativacaoCritica(null);
          setPrevisaoInativacao(null);
        },
      },
    );
  }

  if (acessoNegado) {
    return <AcessoNegadoUsuarios />;
  }

  return (
    <section>
      <FiltrosUsuariosSistema
        filtros={filtros}
        total={usuarios.length}
        acaoDireita={null}
        onChange={setFiltros}
      />

      {usuariosQuery.isLoading ? <UsuariosSistemaSkeleton /> : null}

      {!usuariosQuery.isLoading && erro ? (
        <div className="rounded-2xl border border-rose-100 bg-white/80 p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-rose-600">
            Não foi possível carregar os usuários do sistema.
          </p>
          <button
            type="button"
            onClick={() => usuariosQuery.refetch()}
            className="mt-3 rounded-xl bg-[#9F64AF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B]"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {!usuariosQuery.isLoading && !erro ? (
        <ListaUsuariosSistema
          usuarios={usuarios}
          filtros={filtros}
          onInativar={(usuario) => iniciarInativacao(usuario)}
          onReativar={(usuario) => setAcaoStatus({ usuario, reativar: true })}
          podeGerenciar={podeGerenciarFinal}
          usuarioAtualId={usuarioAtualId}
        />
      ) : null}

      {podeGerenciarFinal ? (
        <ModalConfirmarInativacao
          aberto={Boolean(acaoStatus.usuario)}
          usuario={acaoStatus.usuario}
          reativar={acaoStatus.reativar}
          confirmando={inativarUsuario.isPending || reativarUsuario.isPending}
          onClose={() => setAcaoStatus({ usuario: null, reativar: false })}
          onConfirm={confirmarStatus}
        />
      ) : null}

      <ModalTransferirEInativarUsuario
        aberto={Boolean(usuarioInativacaoCritica)}
        usuario={usuarioInativacaoCritica}
        previa={previsaoInativacao}
        confirmando={inativarUsuario.isPending}
        onClose={() => {
          setUsuarioInativacaoCritica(null);
          setPrevisaoInativacao(null);
        }}
        onConfirm={confirmarInativacaoCritica}
      />

      <ModalTransferirAdministracao
        aberto={Boolean(usuarioTransferencia) && !inativarClinica}
        usuarios={usuarios.filter(
          (item) =>
            item.ativo &&
            item.perfil_id === 2 &&
            item.id !== usuarioTransferencia?.id,
        )}
        selecionadoId={novoAdminId}
        onSelecionar={setNovoAdminId}
        confirmando={inativarUsuario.isPending}
        onClose={() => {
          setUsuarioTransferencia(null);
          setNovoAdminId(null);
        }}
        onConfirm={confirmarTransferencia}
      />

      <ModalInativarClinica
        aberto={inativarClinica}
        confirmando={inativarUsuario.isPending}
        onClose={() => {
          setInativarClinica(false);
          setUsuarioTransferencia(null);
        }}
        onConfirm={confirmarInativacaoClinica}
      />
    </section>
  );
}
