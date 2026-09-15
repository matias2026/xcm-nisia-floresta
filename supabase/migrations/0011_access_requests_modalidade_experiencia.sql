-- Modalidade (pedalando/corrida/academia) e nível de experiência,
-- coletados no pedido de acesso quando quem pede é aluno. A modalidade
-- vira alunos.modalidade na aprovação (hoje esse campo nunca era
-- preenchido pelo fluxo automático); a experiência informa o treinador
-- se a FC estimada por data de nascimento é só um ponto de partida
-- (novato, sem dado real ainda) ou se vale a pena já pedir um valor medido.
alter table public.access_requests add column modalidade text;
alter table public.access_requests add column training_experience text
  check (training_experience in ('iniciante', 'experiente'));
