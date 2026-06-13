"use client";

import type { ReactNode } from "react";

interface CardFiltrosRelatorioProps {
  children: ReactNode;
}

export default function CardFiltrosRelatorio({
  children,
}: CardFiltrosRelatorioProps) {
  return (
    <section className="rounded-2xl border border-[#9F64AF]/15 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)] sm:p-5">
      {children}
    </section>
  );
}

