import type { PatientStatsProps } from "../../types/user";

export const PatientStats = ({
  nivel,
  xp,
  streak,
  themeColor,
}: PatientStatsProps) => (
  <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`block text-2xl font-black ${themeColor}`}>{nivel}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Nível
      </span>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`block text-2xl font-black ${themeColor}`}>{xp}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        XP
      </span>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="block text-2xl font-black text-orange-500">
        🔥 {streak}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Dias Seguidos
      </span>
    </div>
  </div>
);
