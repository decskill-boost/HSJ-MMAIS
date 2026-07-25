import { useNavigate } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import CapitaoMais25D from "./CapitaoMais25D";
import { useTituloPagina } from "../hooks/useTituloPagina";

const WelcomePage = () => {
  const navigate = useNavigate();
  const handleStart = () => navigate("/login");
  useTituloPagina();

  return (
    <div className="sobre-escuro fundo-academia relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10 text-center sm:py-14">
      <div
        className="fundo-raios absolute -inset-[40%] opacity-15"
        aria-hidden="true"
      />
      <div
        className="fundo-reticula absolute inset-0 opacity-50"
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center">
        <CapitaoMais25D />

        {/* O Capitão convida ao toque — a dica vive onde o gesto acontece. */}
        <p className="balao painel mt-7 max-w-xs px-4 py-2 text-sm font-bold text-tinta">
          Toca-me para eu dar uma pirueta! ↻
        </p>

        <p className="legenda mt-7 sm:mt-8">Mais Minutos Ativos</p>

        <h1 className="texto-autocolante mt-3 font-display text-4xl tracking-wide sm:mt-4 sm:text-5xl">
          Bem-vindo ao MMAIS<span className="texto-raio-contorno">+</span>!
        </h1>

        <p className="mx-auto mt-3 max-w-md text-papel/85 sm:text-lg">
          A Academia de Heróis: missões, conquistas e mais um passo todos os
          dias.
        </p>

        <BtnGlobal
          onClick={handleStart}
          variant="raio"
          size="lg"
          className="mt-6 sm:mt-8"
        >
          Começar!
        </BtnGlobal>
      </div>
    </div>
  );
};

export default WelcomePage;
