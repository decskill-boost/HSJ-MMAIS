import CapitaoMais from "./CapitaoMais";

/** Estado de carregamento unificado da app — usado como fallback do Suspense. */
const CarregandoAcademia = () => (
  <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center p-8 text-center">
    <div className="animate-flutuar">
      <CapitaoMais className="h-24 w-auto" title="" />
    </div>
    <p className="mt-4 font-display text-xl tracking-wide text-tinta">
      A preparar a Academia…
    </p>
  </div>
);

export default CarregandoAcademia;
