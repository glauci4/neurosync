import { RxGear } from "react-icons/rx";

interface CabecalhoNotificacoesProps {
  total: number;
  naoLidas: number;
  lidas: number;
}

export default function CabecalhoNotificacoes({
  total,
  naoLidas,
  lidas,
}: CabecalhoNotificacoesProps) {
  return (
    <section className="rounded-2xl border border-[#9F64AF]/20 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex items-start gap-2">
        <RxGear
          size={16}
          className="mt-1 shrink-0 animate-spin text-[#9F64AF]"
        />
        <div>
          <h2 className="text-sm font-semibold text-gray-800">
            Resumo operacional
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Indicadores principais das notificações internas.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-col">
            <p className="text-xs text-gray-500">Total</p>
            <p className="mt-1 text-base font-semibold text-gray-800">
              {total}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <p className="text-xs text-gray-500">Não lidas</p>
          <p className="mt-1 text-base font-semibold text-[#9F64AF]">
            {naoLidas}
          </p>
        </div>

        <div className="flex min-w-0 flex-col">
          <p className="text-xs text-gray-500">Lidas</p>
          <p className="mt-1 text-base font-semibold text-slate-800">{lidas}</p>
        </div>
      </div>
    </section>
  );
}
