import { useOutletContext } from "react-router-dom";
import type { UserProfile } from "../types/user";

export interface LayoutContext {
  /** Perfil autenticado, ou `null` quando não há sessão. */
  user: UserProfile | null;
  /** `true` enquanto a sessão guardada está a ser restaurada. */
  aCarregar: boolean;
}

/** Contexto que o `Layout` passa às páginas através do `Outlet`. */
export const useLayoutContext = () => useOutletContext<LayoutContext>();
