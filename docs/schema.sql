-- WARNING: This schema is for context only and is not meant to be run as-is.
-- Table order and constraints may not be valid for execution.
-- Source of truth: Supabase project pvhuezandbhtghsvjgux
-- Last updated: 2026-06-30

-- ============================================================
-- UTILIZADORES
-- Regista todos os utilizadores da plataforma.
-- tipo_utilizador liga ao nome em public.perfis.
-- ============================================================
CREATE TABLE public.utilizadores (
  id_user           uuid          NOT NULL DEFAULT uuid_generate_v4(),
  nome              varchar       NOT NULL,
  email             varchar       NOT NULL UNIQUE,
  tipo_utilizador   varchar       NOT NULL, -- 'medico' | 'paciente' | 'acompanhante'
  xp                integer       NOT NULL DEFAULT 0,
  nivel             integer       NOT NULL DEFAULT 1,
  streak_atual      integer       NOT NULL DEFAULT 0,
  data_registo      timestamp     NOT NULL DEFAULT now(),
  url_foto_perfil   varchar,
  CONSTRAINT utilizadores_pkey PRIMARY KEY (id_user)
);

-- ============================================================
-- PERFIS
-- Os 3 perfis do sistema: medico, paciente, acompanhante.
-- Semeados automaticamente pelo SeedService no arranque (dev).
-- ============================================================
CREATE TABLE public.perfis (
  id_perfil   uuid    NOT NULL DEFAULT uuid_generate_v4(),
  nome        varchar NOT NULL,
  CONSTRAINT perfis_pkey        PRIMARY KEY (id_perfil),
  CONSTRAINT perfis_nome_unique UNIQUE (nome)
);

-- ============================================================
-- PERMISSOES
-- Permissões granulares da plataforma.
-- Semeadas automaticamente pelo SeedService no arranque (dev).
--
-- Valores actuais:
--   view:dashboard, export:data, prescribe:exercises,
--   manage:exercises, read:all_patients,
--   read:own_sessions, write:own_sessions
-- ============================================================
CREATE TABLE public.permissoes (
  id_permissao   uuid    NOT NULL DEFAULT uuid_generate_v4(),
  nome           varchar NOT NULL,
  CONSTRAINT permissoes_pkey        PRIMARY KEY (id_permissao),
  CONSTRAINT permissoes_nome_unique UNIQUE (nome)
);

-- ============================================================
-- PERFIS_PERMISSOES
-- Permissões associadas a cada perfil (role-based).
--   medico      → view:dashboard, export:data, prescribe:exercises,
--                 manage:exercises, read:all_patients
--   paciente    → view:dashboard, read:own_sessions, write:own_sessions
--   acompanhante→ view:dashboard, read:own_sessions
-- ============================================================
CREATE TABLE public.perfis_permissoes (
  id_perfil     uuid NOT NULL,
  id_permissao  uuid NOT NULL,
  CONSTRAINT perfis_permissoes_pkey PRIMARY KEY (id_perfil, id_permissao),
  CONSTRAINT fk_perfis_permissoes_perfil
    FOREIGN KEY (id_perfil)    REFERENCES public.perfis(id_perfil),
  CONSTRAINT fk_perfis_permissoes_permissao
    FOREIGN KEY (id_permissao) REFERENCES public.permissoes(id_permissao)
);

-- ============================================================
-- UTILIZADORES_PERMISSOES
-- Permissões individuais atribuídas directamente a um utilizador
-- (fora do seu perfil). Permite casos excepcionais sem mudar o perfil.
-- ============================================================
CREATE TABLE public.utilizadores_permissoes (
  id_user       uuid NOT NULL,
  id_permissao  uuid NOT NULL,
  CONSTRAINT utilizadores_permissoes_pkey PRIMARY KEY (id_user, id_permissao),
  CONSTRAINT fk_utilizadores_permissoes_user
    FOREIGN KEY (id_user)      REFERENCES public.utilizadores(id_user),
  CONSTRAINT fk_utilizadores_permissoes_permissao
    FOREIGN KEY (id_permissao) REFERENCES public.permissoes(id_permissao)
);

-- ============================================================
-- EXERCICIOS
-- Repositório de exercícios validados pela equipa clínica.
-- ============================================================
CREATE TABLE public.exercicios (
  id_exercicio        uuid    NOT NULL DEFAULT uuid_generate_v4(),
  nome_exercicio      varchar NOT NULL,
  recompensa_xp       integer NOT NULL DEFAULT 0,
  categoria           varchar NOT NULL,
  url_video           text,
  duracao_segundos    integer NOT NULL,
  dificuldade_clinica varchar(20) NOT NULL DEFAULT 'facil',
  ativo               boolean NOT NULL DEFAULT true,
  condicao_paciente   varchar(1) DEFAULT 'A',
  CONSTRAINT exercicios_pkey PRIMARY KEY (id_exercicio)
);

-- ============================================================
-- PRESCRICOES
-- Prescrição de exercício feita por um médico a um paciente.
-- ============================================================
CREATE TABLE public.prescricoes (
  id_prescricao      uuid      NOT NULL DEFAULT uuid_generate_v4(),
  data_inicio        timestamp NOT NULL DEFAULT timezone('utc'::text, now()),
  frequencia_semanal integer   NOT NULL,
  data_validade      timestamp,
  ativo              boolean   NOT NULL DEFAULT true,
  notas_medicas      text,
  id_paciente        uuid,
  id_medico          uuid      NOT NULL,
  is_standard        boolean   NOT NULL DEFAULT false,
  condicao_paciente  varchar(1) DEFAULT 'A'::character varying,
  dificuldade        varchar(20) NOT NULL DEFAULT 'facil'::character varying,
  condicao_clinica   varchar(255),
  data_fim           timestamp,
  CONSTRAINT prescricoes_pkey PRIMARY KEY (id_prescricao),
  CONSTRAINT fk_prescricoes_paciente
    FOREIGN KEY (id_paciente) REFERENCES public.utilizadores(id_user),
  CONSTRAINT fk_prescricoes_medico
    FOREIGN KEY (id_medico)   REFERENCES public.utilizadores(id_user)
);

-- ============================================================
-- PRESCRICOES_EXERCICIOS
-- Exercícios incluídos numa prescrição.
-- ============================================================
CREATE TABLE public.prescricoes_exercicios (
  id_prescricao uuid NOT NULL,
  id_exercicio  uuid NOT NULL,
  CONSTRAINT prescricoes_exercicios_pkey PRIMARY KEY (id_prescricao, id_exercicio),
  CONSTRAINT fk_prescricoes_exercicios_prescricao
    FOREIGN KEY (id_prescricao) REFERENCES public.prescricoes(id_prescricao),
  CONSTRAINT fk_prescricoes_exercicios_exercicio
    FOREIGN KEY (id_exercicio)  REFERENCES public.exercicios(id_exercicio)
);

-- ============================================================
-- SESSOES_REALIZADAS
-- Registo de cada sessão de exercício efectuada pelo paciente.
-- sRPE = esforco_1_a_10 × duracao (calculado no backend).
-- ============================================================
CREATE TABLE public.sessoes_realizadas (
  id_sessao       uuid      NOT NULL DEFAULT uuid_generate_v4(),
  data_hora       timestamp NOT NULL,
  esforco_1_a_10  integer,
  diversao_1_a_5  integer,
  duracao         double precision,
  concluido       boolean   NOT NULL DEFAULT false,
  id_paciente     uuid,
  id_exercicio    uuid,
  id_prescricao   uuid,
  CONSTRAINT sessoes_realizadas_pkey PRIMARY KEY (id_sessao),
  CONSTRAINT fk_sessoes_paciente
    FOREIGN KEY (id_paciente)   REFERENCES public.utilizadores(id_user),
  CONSTRAINT fk_sessoes_exercicio
    FOREIGN KEY (id_exercicio)  REFERENCES public.exercicios(id_exercicio),
  CONSTRAINT fk_sessoes_prescricao
    FOREIGN KEY (id_prescricao) REFERENCES public.prescricoes(id_prescricao)
);
