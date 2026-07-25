import type { PatientStatsProps } from "../../types/user";

const numero = "block font-display text-3xl tracking-wide";
const rotulo = "mt-0.5 block text-[11px] font-bold uppercase tracking-wider text-aco";

export const PatientStats = ({ nivel, xp, streak }: PatientStatsProps) => (
  <div className="mt-4 grid w-full max-w-md grid-cols-3 gap-3 sm:gap-4">
    <div className="painel painel-fino entrada-pop p-3 sm:p-4">
      <span className={`${numero} text-cobalto`}>{nivel}</span>
      <span className={rotulo}>Nível</span>
    </div>
    <div className="painel painel-fino entrada-pop-2 p-3 sm:p-4">
      <span className={`${numero} text-cobalto`}>{xp}</span>
      <span className={rotulo}>XP</span>
    </div>
    <div className="painel painel-fino entrada-pop-3 p-3 sm:p-4">
      <span className={`${numero} text-turbo-escuro`}>
        <span aria-hidden="true">⚡</span> {streak}
      </span>
      <span className={rotulo}>Dias seguidos</span>
    </div>
  </div>
);
