import { useNavigate } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import CapitaoMais25D from "./CapitaoMais25D";

const WelcomePage = () => {
  const navigate = useNavigate();
  const handleStart = () => navigate("/login");

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#3D6BFF_0%,#1D42C8_55%,#16307F_100%)] px-4 py-14 text-center">
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
        <p className="mx-auto mt-2 max-w-md text-lg text-[#D7DDF4]">
          Missões, conquistas e superpoderes — mais um passo, todos os dias.
        </p>

        <BtnGlobal onClick={handleStart} variant="raio" className="mt-8 mx-auto px-10 py-3">
          Começar!
        </BtnGlobal>
        <p className="mt-4 text-sm font-bold text-[#C9D2F2]">
          Psst… toca no Capitão para ele dar uma pirueta! ↻
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;
