-- ============================================================
-- Nome do plano (PR #76)
--
-- CORRER ANTES DE PÔR ESTE BACKEND EM PRODUÇÃO.
--
-- A coluna `prescricoes.nome` foi acrescentada à entidade sem migração. O
-- TypeORM só a cria sozinho quando `synchronize` está ligado, e isso acontece
-- apenas com APP_ENV=dev (ver app.module.ts) — em pre e prd o esquema nunca é
-- alterado pela aplicação.
--
-- Sem esta coluna não falha só o campo do nome: `queryPlanosComExercicios()`
-- faz `SELECT "p"."nome"` e é a consulta base de TODAS as rotas de leitura de
-- planos, incluindo a anónima `GET /api/prescricoes/publicos`. O Postgres
-- recusa a consulta inteira e todos os ecrãs de planos passam a 500 — para o
-- corpo clínico e para as crianças.
--
-- `IF NOT EXISTS` porque em dev a coluna pode já ter nascido do synchronize.
-- ============================================================

ALTER TABLE public.prescricoes
  ADD COLUMN IF NOT EXISTS nome varchar(255);

COMMENT ON COLUMN public.prescricoes.nome IS
  'Nome dado ao plano por quem o criou (clínico ou a própria criança). Opcional: sem nome, o ecrã mostra a dificuldade.';
