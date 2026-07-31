import { useNavigate } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import CapitaoMais from "./CapitaoMais";
import { useUser } from "../contexts/UserContext";

/**
 * Ecrã para quem está autenticado mas não tem perfil para a página pedida.
 *
 * O `ProtectedRoute` já reencaminhava para aqui, mas a rota não existia — o
 * pedido caía no `*` e a pessoa via um 404, que diz «isto não existe» quando o
 * que se passa é «isto não é para si». O botão leva ao painel do próprio
 * perfil, para não ficar num beco sem saída.
 */
const SemAutorizacao = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const destino =
    user?.role === "paciente"
      ? "/dashboard/paciente"
      : user?.role === "corpo_clinico" || user?.role === "admin"
        ? "/dashboard/medico"
        : "/";

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="animate-flutuar">
        <CapitaoMais className="h-36 w-auto" title="" />
      </div>
      <div className="mt-6 space-y-3">
        <h1 className="font-display text-2xl tracking-wide text-tinta">
          Esta zona não é do teu perfil
        </h1>
        <p className="mx-auto max-w-sm text-sm text-aco">
          A tua conta não tem acesso a esta página. Se achas que devia ter, fala
          com quem gere os utilizadores da plataforma.
        </p>
      </div>

      <BtnGlobal onClick={() => navigate(destino)} className="mt-8">
        Ir para o meu painel
      </BtnGlobal>
    </div>
  );
};

export default SemAutorizacao;
