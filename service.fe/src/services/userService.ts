import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";
import type { TipoUtilizador, UserProfile } from "../types/user";

/** Colunas lidas da tabela `utilizadores` (a mesma que o resto da plataforma usa). */
interface LinhaUtilizador {
  id_user: string | null;
  nome: string | null;
  email: string | null;
  tipo_utilizador: string | null;
  xp: number | null;
  nivel: number | null;
  streak_atual: number | null;
  data_registo: string | null;
  url_foto_perfil: string | null;
}

const COLUNAS =
  "id_user, nome, email, tipo_utilizador, xp, nivel, streak_atual, data_registo, url_foto_perfil";

const TIPOS: readonly TipoUtilizador[] = ["paciente", "corpo_clinico", "admin"];

/**
 * Em caso de dúvida assume `paciente`: é preferível não mostrar acessos
 * clínicos a quem os tem do que anunciá-los a quem não os tem.
 */
const normalizaTipo = (valor: string | null): TipoUtilizador =>
  TIPOS.includes(valor as TipoUtilizador)
    ? (valor as TipoUtilizador)
    : "paciente";

/** Perfil mínimo construído só a partir da sessão, sem tocar na base de dados. */
export const perfilDaSessao = (user: User): UserProfile => ({
  id_user: user.id,
  nome: user.email?.split("@")[0] ?? "Herói",
  email: user.email ?? "",
  tipo_utilizador: "paciente",
  xp: 0,
  nivel: 1,
  streak_atual: 0,
  data_registo: user.created_at,
});

/**
 * Perfil do utilizador autenticado. A fonte de verdade é a tabela
 * `utilizadores`; se a consulta falhar (tabela em falta, RLS, rede) devolve o
 * perfil mínimo da sessão, para o ecrã degradar em vez de ficar vazio.
 */
export const obterPerfil = async (user: User): Promise<UserProfile> => {
  const base = perfilDaSessao(user);

  try {
    const { data, error } = await supabase
      .from("utilizadores")
      .select(COLUNAS)
      .eq("id_user", user.id)
      .maybeSingle<LinhaUtilizador>();

    if (error) throw new Error(error.message);
    if (!data) return base;

    return {
      ...base,
      id_user: data.id_user ?? base.id_user,
      nome: data.nome ?? base.nome,
      email: data.email ?? base.email,
      tipo_utilizador: normalizaTipo(data.tipo_utilizador),
      xp: data.xp ?? base.xp,
      nivel: data.nivel ?? base.nivel,
      streak_atual: data.streak_atual ?? base.streak_atual,
      data_registo: data.data_registo ?? base.data_registo,
      url_foto_perfil: data.url_foto_perfil ?? undefined,
    };
  } catch (erro: unknown) {
    console.warn("[perfil] não foi possível ler `utilizadores`:", erro);
    return base;
  }
};
