-- Ordem do dia de jogos conforme os resultados: quando um jogo do dia termina, o próximo
-- passa a ser, entre os que ainda faltam, o que menos repete os times que acabaram de jogar.
-- Quem venceu descansa; se alguém precisa jogar de novo, é o perdedor.
-- Ex. com 3 times: A x B; depois C x perdedor; por último C x vencedor.

create or replace function public.reordenar_dia_apos_resultado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proxima int;
  v_escolhido record;
  v_ocupante uuid;
begin
  -- Próxima posição: o primeiro jogo ainda agendado depois deste.
  select min(j.ordem_no_evento) into v_proxima
  from public.jogos j
  where j.evento_id = new.evento_id and j.status = 'agendado' and j.ordem_no_evento > new.ordem_no_evento;
  if v_proxima is null then
    return null;
  end if;

  -- Peso: vencedor = 2, perdedor = 1 (no empate, cada time vale 1); menor peso joga antes.
  select j.id, j.ordem_no_evento into v_escolhido
  from public.jogos j
  where j.evento_id = new.evento_id and j.status = 'agendado' and j.ordem_no_evento >= v_proxima
  order by
    (select coalesce(sum(case
       when new.vencedor_id is null then 1
       when t = new.vencedor_id then 2
       else 1 end), 0)
     from unnest(array[j.time_casa_id, j.time_fora_id]) as t
     where t in (new.time_casa_id, new.time_fora_id)),
    j.ordem_no_evento
  limit 1;

  if v_escolhido.ordem_no_evento = v_proxima then
    return null;
  end if;

  -- Troca de lugar com o jogo que estava na próxima posição e recalcula os horários.
  select j.id into v_ocupante from public.jogos j
  where j.evento_id = new.evento_id and j.ordem_no_evento = v_proxima;
  update public.jogos set ordem_no_evento = v_escolhido.ordem_no_evento where id = v_ocupante;
  update public.jogos set ordem_no_evento = v_proxima where id = v_escolhido.id;
  perform public.recalcular_horarios_evento(new.evento_id);
  return null;
end;
$$;

revoke all on function public.reordenar_dia_apos_resultado() from public, anon, authenticated;

create trigger reordenar_dia_apos_resultado
  after update of status on public.jogos
  for each row
  when (new.status in ('encerrado', 'wo') and old.status = 'agendado' and new.evento_id is not null)
  execute function public.reordenar_dia_apos_resultado();
