import { useNavigate } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import { useUser } from "../contexts/UserContext"; // Lemos DIRETAMENTE do contexto global

interface WelcomePageProps {
  logoSrc?: string;
}

const WelcomePage = ({ logoSrc }: WelcomePageProps) => {
  const navigate = useNavigate();

  const { user } = useUser();

  // console.log(
  //   "[WelcomePage] user recebido do contexto:",
  //   user?.email || "Nenhum utilizador",
  // );

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

  return (
    <div className="flex flex-1 flex-col justify-center px-4 py-16 text-center">
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
  );
};

export default WelcomePage;
