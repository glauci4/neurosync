import { Suspense } from "react";
import AgendaPage from "./components/AgendaPage";

export default function Agenda() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
        </div>
      }
    >
      <AgendaPage />
    </Suspense>
  );
}
