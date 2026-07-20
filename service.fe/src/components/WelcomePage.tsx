import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import { useUser } from "../contexts/UserContext";

interface WelcomePageProps {
  logoSrc?: string;
}

// Frases dos meninos (placeholder até termos as reais)
const FRASES_MENINOS = ["Frase 1", "Frase 2", "Frase 3"];

const PILARES = [
  {
    titulo: "Missão",
    texto:
      "Ajudar crianças e jovens em contexto clínico a manterem-se ativos, fortes e motivados durante o seu percurso de tratamento, através de planos de exercício simples e acompanhados por profissionais de saúde.",
  },
  {
    titulo: "Visão",
    texto:
      "Ser uma referência na integração da atividade física no cuidado pediátrico, tornando o movimento parte natural da recuperação de cada criança, dentro e fora do hospital.",
  },
  {
    titulo: "Valores",
    texto:
      "Cuidado centrado na criança, rigor clínico, alegria no processo de recuperação, e uma parceria próxima entre profissionais de saúde, crianças e famílias.",
  },
  {
    titulo: "Propósito",
    texto:
      "Transformar minutos de exercício em minutos de esperança — promovendo não só a recuperação física, mas também o bem-estar emocional e social de cada criança.",
  },
];

const WelcomePage = ({ logoSrc }: WelcomePageProps) => {
  const navigate = useNavigate();
  const { user } = useUser();

  const isAuthenticated = !!user;

  const destination = isAuthenticated
    ? user.role === "admin"
      ? "/dashboard/admin"
      : user.role === "corpo_clinico"
        ? "/dashboard/medico"
        : "/dashboard/paciente"
    : "/login";

  const buttonText = isAuthenticated ? "Ir para o Dashboard" : "Começar!";

  const handleAction = () => navigate(destination);

  // Carrossel de frases dos meninos
  const [fraseAtual, setFraseAtual] = useState(0);
  useEffect(() => {
    const intervalo = setInterval(() => {
      setFraseAtual((atual) => (atual + 1) % FRASES_MENINOS.length);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      {/* HERO — Início */}
      <div className="flex flex-col justify-center px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Bem-vindo ao <span className="text-blue-600">+MMAis</span>!
        </h1>

        <div className="mt-10 flex justify-center">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="+MMAis"
              className="h-32 w-32 rounded-2xl object-contain"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg
                className="h-14 w-14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
          )}
        </div>

        <p className="mt-10 text-sm font-bold uppercase tracking-widest text-blue-600">
          Mais Minutos Ativos
        </p>
        <p className="mx-auto mt-3 max-w-md text-lg text-slate-500">
          A tua aplicação para te manteres forte, ativo(a) e te divertires!
        </p>

        <BtnGlobal
          onClick={handleAction}
          className="mt-10 mx-auto rounded-xl bg-blue-600 px-10 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        >
          {buttonText}
        </BtnGlobal>
      </div>

      {/* MISSÃO E PROPÓSITO */}
      <section className="w-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 px-4 py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-50">
            +MMAis
          </p>
          <h2 className="mx-auto mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            A nossa missão e propósito
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-blue-50 sm:text-xl">
            Levamos exercício, alegria e movimento a cada criança em
            tratamento.
          </p>

          {/* Carrossel de frases */}
          <div className="mx-auto mt-14 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-50/80">
              O que dizem as nossas crianças
            </p>
            <p className="mt-4 text-5xl leading-none text-white/40">“</p>
            <p className="mx-auto -mt-3 min-h-[4.5rem] max-w-xl text-2xl font-semibold italic leading-relaxed sm:text-3xl">
              {FRASES_MENINOS[fraseAtual]}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              {FRASES_MENINOS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFraseAtual(i)}
                  aria-label={`Ver frase ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    i === fraseAtual
                      ? "w-8 bg-white"
                      : "w-2.5 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MISSÃO · VISÃO · VALORES · PROPÓSITO */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-24">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
            Quem somos
          </p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Porque existimos
          </h3>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PILARES.map((pilar) => (
            <div
              key={pilar.titulo}
              className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600">
                {pilar.titulo}
              </span>
              <p className="mt-4 text-justify text-base leading-relaxed text-slate-600">
                {pilar.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* EXPERIMENTAR SEM CONTA */}
      {!isAuthenticated && (
        <div className="mx-auto mb-16 mt-4 flex max-w-xl flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 px-6 py-5">
          <p className="text-base font-bold text-slate-900">
            Ainda não tens conta? 🤔
          </p>
          <p className="text-sm text-slate-600">
            Experimenta já os exercícios de um plano, sem precisares de te
            registares!
          </p>
          <button
            onClick={() => navigate("/experimentar")}
            className="mt-1 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-blue-600 shadow-sm ring-2 ring-blue-200 transition hover:bg-blue-600 hover:text-white hover:ring-blue-600"
          >
            Experimentar agora →
          </button>
        </div>
      )}
    </div>
  );
};

export default WelcomePage;