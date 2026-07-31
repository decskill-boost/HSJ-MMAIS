-- PREPARADO, POR APLICAR. Nada no código depende hoje desta coluna.
--
-- Contexto: no fim do treino a aplicação pergunta à criança o que correu mal e
-- guarda a resposta num campo de texto do ecrã — mas depois deita-a fora. O
-- corpo clínico vê «teve problemas: sim» sem saber o quê.
--
-- Para fechar isto são precisos TRÊS passos, por esta ordem:
--   1. correr este script em dev, pre e prd;
--   2. repor no backend o campo `descricao_problema`
--      (entidade SessaoRealizada, ConcluirExercicioDto, SessoesService);
--   3. passar a enviá-lo em AvaliacaoExercicio.tsx e a mostrá-lo ao clínico em
--      PacienteDetalhe.tsx.
--
-- Os passos 2 e 3 foram revertidos de propósito: o backend tinha a coluna na
-- entidade sem ela existir na base de dados. Como `synchronize` só está ligado
-- quando APP_ENV=dev (ver service.srv/src/app.module.ts), em pre/prd o TypeORM
-- passaria a pedir uma coluna inexistente e QUALQUER leitura ou escrita de
-- `sessoes_realizadas` rebentava — e sem ganho nenhum, porque nem o ecrã da
-- criança enviava o texto nem o do clínico o mostrava.
--
-- Correr este script isoladamente é inofensivo: acrescenta uma coluna anulável
-- que ninguém lê nem escreve.

ALTER TABLE sessoes_realizadas
  ADD COLUMN IF NOT EXISTS descricao_problema text;

COMMENT ON COLUMN sessoes_realizadas.descricao_problema IS
  'Relato livre da criança quando teve_problemas = true. Dado de saúde: só o corpo clínico o deve ver.';
