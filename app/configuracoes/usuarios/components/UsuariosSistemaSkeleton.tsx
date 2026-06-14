"use client";

export default function UsuariosSistemaSkeleton() {
  const itens = ["usuario-1", "usuario-2", "usuario-3", "usuario-4"];

  return (
    <div className="space-y-3">
      {itens.map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-xl border border-gray-100 bg-white/70 p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#F3EAF8]" />
            <div className="flex-1">
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="mt-3 h-3 w-80 max-w-full rounded bg-gray-100" />
            </div>
            <div className="hidden gap-2 md:flex">
              <div className="h-9 w-20 rounded-lg bg-gray-100" />
              <div className="h-9 w-24 rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
