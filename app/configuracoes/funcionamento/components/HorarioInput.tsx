// app/configuracoes/funcionamento/components/HorarioInput.tsx
import { MdErrorOutline } from "react-icons/md";

interface HorarioInputProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  erro?: string;
}

export default function HorarioInput({
  value,
  disabled,
  onChange,
  erro,
}: HorarioInputProps) {
  const isEmpty = !value || value === "00:00"; // ← trata "00:00" como vazio

  return (
    <div className="relative inline-block w-[96px] min-w-[96px] flex-shrink-0">
      <input
        type="time"
        value={isEmpty ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="--:--"
        className={`w-full h-8 px-2.5 border rounded-lg text-[12px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#9F64AF]/30 focus:border-[#9F64AF] transition disabled:bg-gray-100 ${
          erro ? "border-red-300" : "border-[#9F64AF]/20"
        } ${isEmpty ? "text-transparent" : "text-gray-900"} bg-white`}
      />
      {isEmpty && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-[12px] select-none">
          --:--
        </span>
      )}
      {erro && (
        <div className="absolute z-10 left-0 top-full mt-0.5 bg-red-50 text-red-500 text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
          <MdErrorOutline size={12} />
          {erro}
        </div>
      )}
    </div>
  );
}
