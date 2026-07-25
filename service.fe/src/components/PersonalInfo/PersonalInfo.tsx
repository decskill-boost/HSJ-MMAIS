import { Navigate } from "react-router-dom";
import AvatarHeroi from "./AvatarHeroi";
import ClinicalStaffStats from "./ClinicalStaffStats";
import { PatientStats } from "./PatientStats";
import { useLayoutContext } from "../../routes/layoutContext";
import { useTituloPagina } from "../../hooks/useTituloPagina";

/**
 * Número de série do cartão, estável e próprio de cada herói — antes era
 * «001» para toda a gente. Não é classificação, é a matrícula da carta.
 */
const numeroHeroi = (id: string) => {
  let soma = 0;
  for (const caracter of id) {
    soma = (soma * 31 + caracter.charCodeAt(0)) % 999;
  }
  return String(soma + 1).padStart(3, "0");
};

export const PersonalInfo = () => {
  const { user, aCarregar } = useLayoutContext();
  useTituloPagina("O meu perfil");

  // Enquanto a sessão guardada está a ser restaurada não se pode concluir nada
  // sobre o utilizador — sem esta espera, um refresh atirava-o para o login.
  if (aCarregar) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12">
        <span className="animate-flutuar text-4xl" aria-hidden="true">
          ⚡
        </span>
        <p className="font-bold text-aco" role="status">
          A carregar o teu perfil…
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isClinico = user.tipo_utilizador === "corpo_clinico";

  // Tema por tipo de utilizador: Cobalto (QG clínico) ou Raio (Academia) —
  // brandbook Heróis, cap. 07.
  const tema = isClinico
    ? {
        legenda: "legenda legenda-cobalto",
        cracha: "border-cobalto/40 bg-cobalto/10 text-cobalto",
        papel: "Corpo Clínico",
      }
    : {
        legenda: "legenda",
        cracha: "border-raio bg-raio/25 text-tinta",
        papel: "Herói em treino",
      };

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10 text-center sm:py-12">
      {isClinico ? (
        <>
          <div className="entrada-pop flex justify-center">
            {user.url_foto_perfil ? (
              <img
                src={user.url_foto_perfil}
                alt=""
                className="painel painel-fino h-28 w-28 rounded-2xl object-cover"
              />
            ) : (
              <div className="painel painel-fino flex h-28 w-28 items-end justify-center overflow-hidden rounded-2xl bg-cobalto-nevoa">
                <AvatarHeroi variante="clinico" />
              </div>
            )}
          </div>
          <h1 className="mt-4 font-display text-3xl tracking-wide text-tinta">
            {user.nome}
          </h1>
          <p className="text-sm font-bold text-aco">{user.email}</p>
        </>
      ) : (
        <>
          {/* O perfil da criança é um cartão colecionável, não uma ficha. */}
          <div className="entrada-pop fundo-cartao painel painel-alto relative w-60 -rotate-2 overflow-hidden p-3 pb-2.5">
            <div
              className="fundo-reticula pointer-events-none absolute inset-0 opacity-50"
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between px-1">
              <span className="font-display text-xs tracking-[.14em] text-raio [text-shadow:1.5px_1.5px_0_#141F3C]">
                Herói nº {numeroHeroi(user.id_user)}
              </span>
              <span className="font-display text-xs tracking-[.14em] text-papel [text-shadow:1.5px_1.5px_0_#141F3C]">
                MMAIS+
              </span>
            </div>
            <div className="relative mx-auto mt-1 h-40 w-40">
              {user.url_foto_perfil ? (
                <img
                  src={user.url_foto_perfil}
                  alt=""
                  className="h-full w-full rounded-xl border-2 border-tinta object-cover"
                />
              ) : (
                <AvatarHeroi variante="crianca" />
              )}
            </div>
            <h1 className="painel painel-fino relative mt-1.5 rounded-lg px-2 py-1.5">
              <span className="block font-display text-xl leading-tight tracking-wide text-tinta">
                {user.nome}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-aco">
                Herói em treino · Nível {user.nivel}
              </span>
            </h1>
          </div>
          <p className="mt-4 text-sm font-bold text-aco">{user.email}</p>
        </>
      )}

      {isClinico ? (
        <>
          <h2 className={`${tema.legenda} mt-10`}>O seu acesso</h2>
          <ClinicalStaffStats />
        </>
      ) : (
        <>
          <h2 className={`${tema.legenda} mt-10`}>Os teus números</h2>
          <PatientStats
            nivel={user.nivel}
            xp={user.xp}
            streak={user.streak_atual}
          />
        </>
      )}

      <h2 className={`${tema.legenda} mt-10`}>Detalhes da conta</h2>
      <div className="painel painel-fino entrada-pop-4 mt-4 w-full max-w-md p-6 text-left">
        <dl className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <dt className="text-xs font-bold uppercase tracking-wider text-aco">
              Tipo de utilizador
            </dt>
            <dd
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${tema.cracha}`}
            >
              {tema.papel}
            </dd>
          </div>
          <div className="border-t border-tinta/10 pt-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-aco">
              Membro desde
            </dt>
            <dd className="text-base font-bold text-tinta">
              {new Date(user.data_registo).toLocaleDateString("pt-PT")}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default PersonalInfo;
