-- Peso, altura e anamnese, coletados no próprio formulário de pedido de
-- acesso (junto com birth_date da migração anterior) quando quem pede é
-- aluno — repassados pra ficha em alunos na aprovação do pedido.
alter table public.access_requests add column weight_kg numeric;
alter table public.access_requests add column height_cm numeric;
alter table public.access_requests add column medical_notes text;
