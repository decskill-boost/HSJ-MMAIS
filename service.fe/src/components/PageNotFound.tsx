import { useNavigate } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="space-y-4">
        <h1 className="text-7xl font-black text-blue-600 tracking-tight animate-pulse">
          404
        </h1>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          Página não encontrada
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Ups! O caminho que tentaste aceder não existe ou foi movido.
        </p>
      </div>

      <BtnGlobal
        onClick={() => navigate("/")}
        className="mt-8 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 active:scale-95 transition-all duration-200"
      >
        Voltar para o Início
      </BtnGlobal>
    </div>
  );
};

export default PageNotFound;
