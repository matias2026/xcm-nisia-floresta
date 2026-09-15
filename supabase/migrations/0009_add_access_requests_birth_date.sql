-- Data de nascimento, coletada só quando quem pede acesso é aluno — usada
-- pra calcular a idade na aprovação (alunos.age) e sugerir a FC máxima
-- (fórmula de Tanaka) já no formulário de auto-cadastro.
alter table public.access_requests add column birth_date date;
