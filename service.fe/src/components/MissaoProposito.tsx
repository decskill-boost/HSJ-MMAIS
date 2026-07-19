import { useEffect, useState } from "react";

// Frases dos meninos (placeholder até termos as reais)
const FRASES_MENINOS = ["Frase 1", "Frase 2", "Frase 3"];

// Um gradiente de fundo diferente para cada frase, para se notar a rotação
const GRADIENTES_HERO = [
  "from-cobalto via-cobalto to-turbo",
  "from-cobalto via-cobalto to-cobalto-vivo",
  "from-turbo-escuro via-turbo to-cobalto-vivo",
];

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
        className={`relative overflow-hidden bg-gradient-to-br px-4 py-24 text-center text-papel transition-colors duration-1000 sm:py-32 ${GRADIENTES_HERO[fraseAtual]}`}
      >
        {/* círculos decorativos, para não ficar um bloco de cor liso */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-papel-claro/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-papel-claro/10 blur-3xl" />

        <div className="relative">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cobalto/10">
            +MMAis
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            A nossa missão e propósito
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-cobalto/10 sm:text-2xl">
            Levamos exercício, alegria e movimento a cada criança em
            tratamento.
          </p>


          {/* CARROSSEL — dentro do hero */}
          <div className="mx-auto mt-14 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9D2F2]">
              O que dizem as nossas crianças
            </p>
            <p className="mt-4 text-5xl leading-none text-papel/40">“</p>
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
                      ? "w-8 bg-papel-claro"
                      : "w-2.5 bg-papel-claro/40 hover:bg-papel-claro/60"
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
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-tinta sm:text-4xl">
            Porque existimos
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PILARES.map((pilar) => (
            <div
              key={pilar.titulo}
              className="rounded-2xl border border-tinta/10 bg-papel-claro p-8 shadow-sm transition hover:shadow-md"
            >
              <span className="inline-block rounded-full bg-cobalto/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cobalto">
                {pilar.titulo}
              </span>
              <p className="mt-4 text-justify text-base leading-relaxed text-aco">
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