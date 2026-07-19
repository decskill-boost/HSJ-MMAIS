import { useNavigate } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import CapitaoMais from "./CapitaoMais";

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="animate-flutuar">
        <CapitaoMais className="h-36 w-auto" title="" />
      </div>
      <div className="mt-6 space-y-3">
        <h1 className="font-display text-7xl tracking-wide text-cobalto">404</h1>
        <h2 className="font-display text-2xl tracking-wide text-tinta">
          Este caminho não está no mapa da Academia
        </h2>
        <p className="mx-auto max-w-sm text-sm text-aco">
          O caminho que tentaste aceder não existe ou foi movido.
        </p>
      </div>

      <BtnGlobal onClick={() => navigate("/")} className="mt-8">
        Voltar ao início
      </BtnGlobal>
    </div>
  );
};

export default PageNotFound;
