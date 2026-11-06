-- Regras da partida (6.5.1): a liga escolhe se a falta para o cronômetro da súmula ao vivo.
-- Padrão FIBA (para). As ligas que já existem ficam sem parar, como a mesa já funcionava.
alter table public.competicoes
  add column falta_para_relogio boolean not null default true;

update public.competicoes set falta_para_relogio = false;

grant update (falta_para_relogio) on public.competicoes to authenticated;
