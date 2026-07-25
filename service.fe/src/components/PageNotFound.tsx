import BtnGlobal from "./BtnGlobal";
import CapitaoMais from "./CapitaoMais";
import { useLayoutContext } from "../routes/layoutContext";
import { useTituloPagina } from "../hooks/useTituloPagina";

const PageNotFound = () => {
  const { user } = useLayoutContext();
  useTituloPagina("Página não encontrada");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <div className="animate-flutuar">
        <CapitaoMais className="h-24 w-auto" title="" />
      </div>

      <p
        className="mt-6 font-display text-7xl tracking-wide text-cobalto [text-shadow:4px_4px_0_#141F3C]"
        aria-hidden="true"
      >
        404
      </p>

      <h1 className="mt-4 font-display text-2xl tracking-wide text-tinta">
        Este caminho não está no mapa da Academia
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-aco">
        A página que procuras não existe ou mudou de sítio (erro 404).
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <BtnGlobal to="/">Voltar ao início</BtnGlobal>
        {user && (
          <BtnGlobal to="/perfil" variant="secondary">
            Ir para o meu perfil
          </BtnGlobal>
        )}
      </div>
    </div>
  );
};

export default PageNotFound;
