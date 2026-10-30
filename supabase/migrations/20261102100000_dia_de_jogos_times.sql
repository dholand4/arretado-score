-- Dia de jogos com os times escolhidos: o admin marca quais times vão estar no dia e o
-- sorteio (seção 6.2) considera só os jogos entre eles. Nulo = todos os times (comportamento anterior).

alter table public.eventos add column times_disponiveis uuid[];

comment on column public.eventos.times_disponiveis is
  'Times que vão estar no dia; o sorteio só usa jogos entre eles. Nulo = todos.';

create or replace function public.validar_times_do_dia(p_competicao_id uuid, p_times uuid[])
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_times is null then
    return;
  end if;
  if coalesce(array_length(p_times, 1), 0) < 2 then
    raise exception 'Escolha pelo menos 2 times para o dia.';
  end if;
  if exists (
    select 1 from unnest(p_times) t
    where not exists (select 1 from public.times where id = t and competicao_id = p_competicao_id)
  ) then
    raise exception 'Há time escolhido que não é desta competição.';
  end if;
end;
$$;

revoke all on function public.validar_times_do_dia(uuid, uuid[]) from public, anon, authenticated;

-- Assinaturas novas (com p_times): remove as antigas para não ficarem duas versões.
drop function public.selecionar_jogos_evento(uuid, int, boolean, uuid);
drop function public.criar_evento(uuid, date, text, time, int, int, text, boolean);
drop function public.sortear_evento(uuid, boolean, int);

create or replace function public.selecionar_jogos_evento(
  p_competicao_id uuid, p_qtd int, p_permitir_duplo boolean, p_evento_id uuid default null,
  p_times uuid[] default null
)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_total int;
  v_alvo int;
  v_sem_repeticao int;
  v_escolhidos int := 0;
  v_pick record;
  v_k int;
  v_tentativa int;
  v_perm uuid[];
  v_melhor uuid[];
  v_conflitos int;
  v_melhor_conflitos int;
begin
  create temporary table if not exists sel_candidatos (
    id uuid primary key, casa uuid not null, fora uuid not null, rodada int, ordem int
  ) on commit drop;
  create temporary table if not exists sel_carga (time_id uuid primary key, jogos int not null) on commit drop;
  create temporary table if not exists sel_usados (time_id uuid primary key, vezes int not null) on commit drop;
  truncate pg_temp.sel_candidatos, pg_temp.sel_carga, pg_temp.sel_usados;

  -- p_times: só jogos entre os times que vão estar no dia (nulo = todos).
  insert into pg_temp.sel_candidatos (id, casa, fora, rodada)
  select x.id, x.casa, x.fora, x.rodada from (
    select c.id, c.time_casa_id as casa, c.time_fora_id as fora, c.rodada from public.jogos_candidatos(p_competicao_id) c
    union
    select j.id, j.time_casa_id, j.time_fora_id, j.rodada from public.jogos j
    where p_evento_id is not null and j.evento_id = p_evento_id and j.status = 'agendado'
  ) x
  where p_times is null or (x.casa = any (p_times) and x.fora = any (p_times));

  -- Jogos já realizados ou agendados por time (fora os do próprio dia que está sendo sorteado de novo).
  insert into pg_temp.sel_carga (time_id, jogos)
  select x.time_id, count(*)
  from public.jogos j
  cross join lateral (values (j.time_casa_id), (j.time_fora_id)) as x (time_id)
  where j.competicao_id = p_competicao_id
    and j.status in ('agendado', 'encerrado', 'wo')
    and not (p_evento_id is not null and j.evento_id = p_evento_id and j.status = 'agendado')
  group by x.time_id;

  select count(*) into v_total from pg_temp.sel_candidatos;
  v_alvo := least(p_qtd, v_total);

  -- 1) Sem repetir time.
  for v_k in 1 .. v_alvo loop
    select c.id, c.casa, c.fora into v_pick
    from pg_temp.sel_candidatos c
    left join pg_temp.sel_carga ca on ca.time_id = c.casa
    left join pg_temp.sel_carga cf on cf.time_id = c.fora
    where c.ordem is null
      and not exists (select 1 from pg_temp.sel_usados u where u.time_id in (c.casa, c.fora))
    order by c.rodada nulls last, coalesce(ca.jogos, 0) + coalesce(cf.jogos, 0), random()
    limit 1;
    exit when not found;
    v_escolhidos := v_escolhidos + 1;
    update pg_temp.sel_candidatos set ordem = v_escolhidos where id = v_pick.id;
    insert into pg_temp.sel_usados as u values (v_pick.casa, 1), (v_pick.fora, 1)
      on conflict (time_id) do update set vezes = u.vezes + 1;
    insert into pg_temp.sel_carga as cg values (v_pick.casa, 1), (v_pick.fora, 1)
      on conflict (time_id) do update set jogos = cg.jogos + 1;
  end loop;
  v_sem_repeticao := v_escolhidos;

  if v_sem_repeticao < v_alvo and not coalesce(p_permitir_duplo, false) then
    return jsonb_build_object(
      'precisa_confirmar', true,
      'max_sem_repeticao', v_sem_repeticao,
      'candidatos', v_total,
      'pedido', p_qtd,
      'jogo_duplo', false,
      'jogos', '[]'::jsonb
    );
  end if;

  -- 2) Jogo duplo confirmado: completa repetindo o mínimo possível.
  while v_escolhidos < v_alvo loop
    select c.id, c.casa, c.fora into v_pick
    from pg_temp.sel_candidatos c
    left join pg_temp.sel_carga ca on ca.time_id = c.casa
    left join pg_temp.sel_carga cf on cf.time_id = c.fora
    left join pg_temp.sel_usados ua on ua.time_id = c.casa
    left join pg_temp.sel_usados uf on uf.time_id = c.fora
    where c.ordem is null
    order by (ua.time_id is not null)::int + (uf.time_id is not null)::int,
             coalesce(ua.vezes, 0) + coalesce(uf.vezes, 0),
             c.rodada nulls last,
             coalesce(ca.jogos, 0) + coalesce(cf.jogos, 0),
             random()
    limit 1;
    exit when not found;
    v_escolhidos := v_escolhidos + 1;
    update pg_temp.sel_candidatos set ordem = v_escolhidos where id = v_pick.id;
    insert into pg_temp.sel_usados as u values (v_pick.casa, 1), (v_pick.fora, 1)
      on conflict (time_id) do update set vezes = u.vezes + 1;
    insert into pg_temp.sel_carga as cg values (v_pick.casa, 1), (v_pick.fora, 1)
      on conflict (time_id) do update set jogos = cg.jogos + 1;
  end loop;

  -- 3) Ordem aleatória; com jogo duplo, procura uma ordem sem jogos consecutivos do mesmo time.
  for v_tentativa in 1 .. 60 loop
    v_perm := array(select id from pg_temp.sel_candidatos where ordem is not null order by random());
    v_conflitos := 0;
    for v_k in 1 .. coalesce(array_length(v_perm, 1), 0) - 1 loop
      if exists (
        select 1 from pg_temp.sel_candidatos a, pg_temp.sel_candidatos b
        where a.id = v_perm[v_k] and b.id = v_perm[v_k + 1]
          and (a.casa in (b.casa, b.fora) or a.fora in (b.casa, b.fora))
      ) then
        v_conflitos := v_conflitos + 1;
      end if;
    end loop;
    if v_melhor_conflitos is null or v_conflitos < v_melhor_conflitos then
      v_melhor := v_perm;
      v_melhor_conflitos := v_conflitos;
    end if;
    exit when v_melhor_conflitos = 0;
  end loop;

  return jsonb_build_object(
    'precisa_confirmar', false,
    'max_sem_repeticao', v_sem_repeticao,
    'candidatos', v_total,
    'pedido', p_qtd,
    'jogo_duplo', v_escolhidos > v_sem_repeticao,
    'jogos', to_jsonb(coalesce(v_melhor, '{}'::uuid[]))
  );
end;
$$;

revoke all on function public.selecionar_jogos_evento(uuid, int, boolean, uuid, uuid[]) from public, anon, authenticated;

create or replace function public.criar_evento(
  p_competicao_id uuid,
  p_data date,
  p_local text,
  p_hora_inicio time,
  p_qtd_jogos int,
  p_intervalo_min int,
  p_observacoes text default null,
  p_permitir_duplo boolean default false,
  p_times uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_selecao jsonb;
  v_ids uuid[];
  v_evento_id uuid;
begin
  if p_competicao_id is null or not exists (select 1 from public.competicoes where id = p_competicao_id) then
    raise exception 'Competição não encontrada.';
  end if;
  if not public.is_admin_da_competicao(p_competicao_id) then
    raise exception 'Você não tem permissão para criar dias de jogos nesta competição.' using errcode = '42501';
  end if;
  select status into v_status from public.competicoes where id = p_competicao_id for update;
  if v_status <> 'em_andamento' then
    raise exception 'Inicie a competição antes de criar dias de jogos.';
  end if;
  if p_data is null then
    raise exception 'Informe a data.';
  end if;
  if nullif(trim(coalesce(p_local, '')), '') is null then
    raise exception 'Informe o local.';
  end if;
  if p_hora_inicio is null then
    raise exception 'Informe a hora de início.';
  end if;
  if p_qtd_jogos is null or p_qtd_jogos < 1 then
    raise exception 'Informe quantos jogos o dia terá.';
  end if;
  if p_intervalo_min is null or p_intervalo_min < 1 then
    raise exception 'Informe o intervalo entre os jogos, em minutos.';
  end if;

  perform public.validar_times_do_dia(p_competicao_id, p_times);
  v_selecao := public.selecionar_jogos_evento(p_competicao_id, p_qtd_jogos, p_permitir_duplo, null, p_times);
  if (v_selecao ->> 'precisa_confirmar')::boolean then
    return v_selecao || jsonb_build_object('evento_id', null);
  end if;
  v_ids := public.ids_da_selecao(v_selecao);
  if coalesce(array_length(v_ids, 1), 0) = 0 then
    raise exception '%', case when p_times is null
      then 'Não há jogos disponíveis: todos já estão em algum dia ou aguardam a definição dos times.'
      else 'Não falta nenhum jogo entre os times escolhidos.' end;
  end if;

  insert into public.eventos (competicao_id, data, local, hora_inicio, qtd_jogos, intervalo_min, observacoes, times_disponiveis)
  values (p_competicao_id, p_data, trim(p_local), p_hora_inicio, p_qtd_jogos, p_intervalo_min,
          nullif(trim(coalesce(p_observacoes, '')), ''), p_times)
  returning id into v_evento_id;
  perform public.agendar_jogos_evento(v_evento_id, v_ids);

  return v_selecao || jsonb_build_object('evento_id', v_evento_id);
end;
$$;

create or replace function public.sortear_evento(
  p_evento_id uuid, p_permitir_duplo boolean default false, p_qtd_jogos int default null,
  p_times uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evento public.eventos := public.evento_para_editar(p_evento_id, true);
  v_selecao jsonb;
  v_ids uuid[];
begin
  if exists (select 1 from public.jogos where evento_id = p_evento_id and status not in ('agendado', 'pendente')) then
    raise exception 'Este dia já tem jogo com súmula; não é possível sortear de novo.';
  end if;
  if p_qtd_jogos is not null then
    if p_qtd_jogos < 1 then
      raise exception 'Informe quantos jogos o dia terá.';
    end if;
    v_evento.qtd_jogos := p_qtd_jogos;
  end if;
  -- p_times troca os times do dia; sem ele, vale a lista já gravada no dia.
  if p_times is not null then
    perform public.validar_times_do_dia(v_evento.competicao_id, p_times);
    v_evento.times_disponiveis := p_times;
  end if;
  v_selecao := public.selecionar_jogos_evento(
    v_evento.competicao_id, v_evento.qtd_jogos, p_permitir_duplo, p_evento_id, v_evento.times_disponiveis
  );
  if (v_selecao ->> 'precisa_confirmar')::boolean then
    return v_selecao || jsonb_build_object('evento_id', p_evento_id);
  end if;
  v_ids := public.ids_da_selecao(v_selecao);
  if coalesce(array_length(v_ids, 1), 0) = 0 then
    raise exception 'Não há jogos disponíveis para este dia.';
  end if;
  perform public.liberar_jogos_evento(p_evento_id);
  update public.eventos
    set qtd_jogos = v_evento.qtd_jogos, times_disponiveis = v_evento.times_disponiveis
    where id = p_evento_id;
  perform public.agendar_jogos_evento(p_evento_id, v_ids);
  return v_selecao || jsonb_build_object('evento_id', p_evento_id);
end;
$$;

revoke all on function public.criar_evento(uuid, date, text, time, int, int, text, boolean, uuid[]) from public, anon;
revoke all on function public.sortear_evento(uuid, boolean, int, uuid[]) from public, anon;
grant execute on function public.criar_evento(uuid, date, text, time, int, int, text, boolean, uuid[]) to authenticated;
grant execute on function public.sortear_evento(uuid, boolean, int, uuid[]) to authenticated;
