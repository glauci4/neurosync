"use client";

import type { ReactNode } from "react";

export default function AcoesRelatorio({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex w-auto flex-wrap items-center justify-end gap-2">
      {children}
    </div>
  );
}

