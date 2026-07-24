import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import CapitaoMais25D from "./CapitaoMais25D";
import CapitaoMais from "./CapitaoMais";
import { useUser } from "../contexts/UserContext";

// Promessas do Capitão — voz da Academia: encorajamento, nunca cobrança.
const FRASES_CAPITAO = [
  "Cada movimento conta — mais um passo, todos os dias.",
  "Aqui não há vilões, só treinos e conquistas.",
  "Ganhas superpoderes um minuto de cada vez.",
  "Os heróis também descansam — e voltam mais fortes.",
];

const PILARES: {
  titulo: string;
  badge: string;
  texto: string;
}[] = [
  {
    titulo: "Missão",
    badge: "bg-cobalto/10 text-cobalto",
    texto:
      "Ajudar crianças e jovens em contexto clínico a manterem-se ativos, fortes e motivados durante o seu percurso de tratamento, através de planos de exercício simples e acompanhados por profissionais de saúde.",
  },
  {
    titulo: "Visão",
    badge: "bg-turbo/15 text-turbo-escuro",
    texto:
      "Ser uma referência na integração da atividade física no cuidado pediátrico, tornando o movimento parte natural da recuperação de cada criança, dentro e fora do hospital.",
  },
  {
    titulo: "Valores",
    badge: "bg-raio/25 text-tinta",
    texto:
      "Cuidado centrado na criança, rigor clínico, alegria no processo de recuperação, e uma parceria próxima entre profissionais de saúde, crianças e famílias.",
  },
  {
    titulo: "Propósito",
    badge: "bg-capa/10 text-capa-escura",
    texto:
      "Transformar minutos de exercício em minutos de esperança — promovendo não só a recuperação física, mas também o bem-estar emocional e social de cada criança.",
  },
];

const WelcomePage = () => {
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

  // Carrossel das promessas do Capitão
  const [fraseAtual, setFraseAtual] = useState(0);
  useEffect(() => {
    const intervalo = setInterval(() => {
      setFraseAtual((atual) => (atual + 1) % FRASES_CAPITAO.length);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      {/* HERO — Academia de Heróis */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#3D6BFF_0%,#1D42C8_55%,#16307F_100%)] px-4 py-16 text-center">
        <div className="fundo-raios absolute -inset-[40%] opacity-15" aria-hidden="true" />
        <div className="fundo-reticula absolute inset-0 opacity-50" aria-hidden="true" />

        <div className="relative">
          <CapitaoMais25D />

          <h1 className="texto-autocolante mt-6 font-display text-4xl tracking-wide sm:text-5xl">
            Bem-vindo ao MMAIS<span style={{ color: "#FFCE29" }}>+</span>!
          </h1>

          <p className="mt-3 font-display text-lg tracking-widest text-raio [text-shadow:2px_2px_0_#141F3C]">
            Mais Minutos Ativos · A Academia de Heróis
          </p>
          <p className="mx-auto mt-2 max-w-md text-lg text-[#F0F3FF]">
            Missões, conquistas e superpoderes — mais um passo, todos os dias.
          </p>

          {/* As duas entradas lado a lado: entrar na conta ou experimentar já */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <BtnGlobal onClick={handleAction} variant="raio" className="px-10 py-3">
              {buttonText}
            </BtnGlobal>

            {!isAuthenticated && (
              <button
                onClick={() => navigate("/experimentar")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro px-8 py-3 font-display text-lg tracking-wide text-tinta shadow-vinheta transition hover:bg-papel active:scale-95 active:shadow-none"
              >
                Experimentar grátis
              </button>
            )}
          </div>

          {!isAuthenticated && (
            <p className="mt-3 text-sm font-bold text-[#EAEFFF]">
              Ainda não tens conta? Testa um treino sem te registares.
            </p>
          )}

          <p className="mt-4 text-sm font-bold text-[#EAEFFF]/80">
            Psst… toca no Capitão para ele dar uma pirueta! ↻
          </p>
        </div>
      </div>

      {/* MISSÃO E PROPÓSITO */}
      <section className="w-full border-y-[3px] border-tinta bg-papel px-4 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-tinta bg-papel-claro px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cobalto shadow-vinheta">
            MMAIS<span className="texto-raio-contorno">+</span>
          </span>
          <h2 className="mx-auto mt-5 font-display text-3xl tracking-wide text-tinta sm:text-5xl">
            A nossa missão e propósito
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium text-aco sm:text-xl">
            Levamos exercício, alegria e movimento a cada criança em tratamento.
          </p>

          {/* Carrossel das promessas do Capitão */}
          <div className="mx-auto mt-14 max-w-2xl">
            <div className="flex items-center justify-center gap-3">
              <CapitaoMais className="h-10 w-auto" title="" />
              <p className="text-xs font-bold uppercase tracking-widest text-aco">
                Palavra de Capitão
              </p>
            </div>
            <p
              key={fraseAtual}
              className="entrada-pop mx-auto mt-6 min-h-[4.5rem] max-w-xl font-display text-2xl leading-relaxed tracking-wide text-cobalto sm:text-3xl"
            >
              {FRASES_CAPITAO[fraseAtual]}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {FRASES_CAPITAO.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFraseAtual(i)}
                  aria-label={`Ver promessa ${i + 1}`}
                  className={`h-2.5 rounded-full border-2 border-tinta transition-all ${
                    i === fraseAtual
                      ? "w-8 bg-raio"
                      : "w-2.5 bg-papel-claro hover:bg-raio/50"
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
          <p className="text-sm font-bold uppercase tracking-widest text-cobalto">
            Quem somos
          </p>
          <h3 className="mt-2 font-display text-3xl tracking-wide text-tinta sm:text-4xl">
            Porque existimos
          </h3>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PILARES.map((pilar, idx) => (
            <div
              key={pilar.titulo}
              className={`entrada-pop${idx > 0 ? `-${Math.min(idx + 1, 4)}` : ""} rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-8 shadow-vinheta transition hover:-translate-y-0.5`}
            >
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${pilar.badge}`}
              >
                {pilar.titulo}
              </span>
              <p className="mt-4 text-justify text-base leading-relaxed text-tinta/80">
                {pilar.texto}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;
