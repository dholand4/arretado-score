-- Editar um dia de jogos já montado (rascunho ou publicado): data, hora de início, local, intervalo e
-- observações. Os jogos e a ordem deles continuam os mesmos; os horários são recalculados a partir do novo início.
-- Com algum jogo do dia já com resultado, só local e observações mudam (o horário de quem já jogou não muda).

create or replace function public.atualizar_evento(
  p_evento_id uuid,
  p_data date,
  p_local text,
  p_hora_inicio time,
  p_intervalo_min int,
  p_observacoes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evento public.eventos := public.evento_para_editar(p_evento_id, false);
  v_local text := nullif(trim(coalesce(p_local, '')), '');
begin
  if p_data is null then
    raise exception 'Informe a data.';
  end if;
  if v_local is null then
    raise exception 'Informe o local.';
  end if;
  if p_hora_inicio is null then
    raise exception 'Informe a hora de início.';
  end if;
  if p_intervalo_min is null or p_intervalo_min < 1 then
    raise exception 'Informe o intervalo em minutos.';
  end if;
  if (p_data, p_hora_inicio, p_intervalo_min) is distinct from (v_evento.data, v_evento.hora_inicio, v_evento.intervalo_min)
     and exists (select 1 from public.jogos where evento_id = v_evento.id and status in ('encerrado', 'wo')) then
    raise exception 'Este dia já tem jogo com resultado: dá para mudar só o local e as observações.';
  end if;

  update public.eventos
    set data = p_data,
        local = v_local,
        hora_inicio = p_hora_inicio,
        intervalo_min = p_intervalo_min,
        observacoes = nullif(trim(coalesce(p_observacoes, '')), '')
    where id = v_evento.id;
  -- Mantém a ordem dos jogos e refaz os horários: início + (posição - 1) × intervalo.
  perform public.recalcular_horarios_evento(v_evento.id);
end;
$$;

revoke all on function public.atualizar_evento(uuid, date, text, time, int, text) from public, anon;
grant execute on function public.atualizar_evento(uuid, date, text, time, int, text) to authenticated;
