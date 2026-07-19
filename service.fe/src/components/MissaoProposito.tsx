import { useEffect, useState } from "react";
import CapitaoMais25D from "./CapitaoMais25D";

// Frases dos meninos (placeholder até termos as reais)
const FRASES_MENINOS = ["Frase 1", "Frase 2", "Frase 3"];

// Um gradiente de fundo diferente para cada frase, para se notar a rotação
const GRADIENTES_HERO = [
  "from-cobalto-vivo via-cobalto to-[#16307F]",
  "from-cobalto via-[#16307F] to-turbo-escuro",
  "from-turbo-escuro via-cobalto to-cobalto-vivo",
];

const PILARES = [
  {
    titulo: "Missão",
    cor: "border-cobalto bg-cobalto text-papel",
    texto:
      "Ajudar crianças e jovens em contexto clínico a manterem-se ativos, fortes e motivados durante o seu percurso de tratamento, através de planos de exercício simples e acompanhados por profissionais de saúde.",
  },
  {
    titulo: "Visão",
    cor: "border-tinta bg-turbo text-tinta",
    texto:
      "Ser uma referência na integração da atividade física no cuidado pediátrico, tornando o movimento parte natural da recuperação de cada criança, dentro e fora do hospital.",
  },
  {
    titulo: "Valores",
    cor: "border-tinta bg-raio text-tinta",
    texto:
      "Cuidado centrado na criança, rigor clínico, alegria no processo de recuperação, e uma parceria próxima entre profissionais de saúde, crianças e famílias.",
  },
  {
    titulo: "Propósito",
    cor: "border-tinta bg-capa text-papel",
    texto:
      "Transformar minutos de exercício em minutos de esperança — promovendo não só a recuperação física, mas também o bem-estar emocional e social de cada criança.",
  },
];

const MissaoProposito = () => {
  const [fraseAtual, setFraseAtual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setFraseAtual((atual) => (atual + 1) % FRASES_MENINOS.length);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      {/* HERO — título fixo + carrossel a mudar o fundo */}
      <section
        className={`relative overflow-hidden border-b-[3px] border-tinta bg-gradient-to-br px-4 py-14 text-center text-papel transition-colors duration-1000 sm:py-20 ${GRADIENTES_HERO[fraseAtual]}`}
      >
        <div className="fundo-raios pointer-events-none absolute -inset-[40%] opacity-10" aria-hidden="true" />
        <div className="fundo-reticula pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="relative">
          <CapitaoMais25D />
          <h1 className="texto-autocolante mx-auto mt-6 max-w-3xl font-display text-4xl tracking-wide sm:text-6xl">
            A nossa missão e propósito
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg font-bold text-[#F0F3FF] sm:text-2xl">
            Levamos exercício, alegria e movimento a cada criança em
            tratamento.
          </p>

          {/* CARROSSEL — dentro do hero */}
          <div className="mx-auto mt-14 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[#EAEFFF]">
              O que dizem as nossas crianças
            </p>
            <p className="mt-4 text-5xl leading-none text-raio">“</p>
            <p className="mx-auto -mt-3 min-h-[4.5rem] max-w-xl text-2xl font-semibold italic leading-relaxed sm:text-3xl">
              {FRASES_MENINOS[fraseAtual]}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              {FRASES_MENINOS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFraseAtual(i)}
                  aria-label={`Ver frase ${i + 1}`}
                  className={`h-3 rounded-full border-2 border-tinta transition-all ${
                    i === fraseAtual
                      ? "w-8 bg-raio"
                      : "w-3 bg-papel-claro/40 hover:bg-papel-claro/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MISSÃO · VISÃO · VALORES · PROPÓSITO */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-24">
        <div className="entrada-pop text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-cobalto">
            Quem somos
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-wide text-tinta sm:text-4xl">
            Porque existimos
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PILARES.map((pilar, idx) => (
            <div
              key={pilar.titulo}
              className="entrada-pop rounded-2xl border-2 border-tinta bg-papel-claro p-8 shadow-vinheta transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#141F3C]"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <span
                className={`inline-block rounded-lg border-2 px-3 py-1 font-display text-sm tracking-widest shadow-[2px_2px_0_#141F3C] ${pilar.cor}`}
              >
                {pilar.titulo}
              </span>
              <p className="mt-4 text-base leading-relaxed text-aco">
                {pilar.texto}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MissaoProposito;
