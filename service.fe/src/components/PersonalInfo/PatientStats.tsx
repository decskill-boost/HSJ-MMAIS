import type { PatientStatsProps } from "../../types/user";

export const PatientStats = ({
  nivel,
  xp,
  streak,
  themeColor,
}: PatientStatsProps) => (
  <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-4">
    <div className="rounded-2xl border-2 border-tinta bg-papel-claro p-4 shadow-vinheta">
      <span className={`block font-display text-2xl tracking-wide ${themeColor}`}>
        {nivel}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-aco">
        Nível
      </span>
    </div>
    <div className="rounded-2xl border-2 border-tinta bg-papel-claro p-4 shadow-vinheta">
      <span className={`block font-display text-2xl tracking-wide ${themeColor}`}>
        {xp}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-aco">
        XP
      </span>
    </div>
    <div className="rounded-2xl border-2 border-tinta bg-papel-claro p-4 shadow-vinheta">
      <span className="block font-display text-2xl tracking-wide text-turbo-escuro">
        ⚡ {streak}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-aco">
        Dias Ativos
      </span>
    </div>
  </div>
);
