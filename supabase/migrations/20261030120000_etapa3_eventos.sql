-- Etapa 3 — Dias de jogos (eventos) e sorteio (seção 6.2).
--
-- Fluxo: criar_evento / sortear_evento selecionam os jogos; se a quantidade pedida exigir que um
-- time jogue duas vezes no dia, NADA é gravado e a resposta vem com precisa_confirmar = true e
-- max_sem_repeticao = X ("Só é possível montar X jogos sem repetir time. Deseja permitir jogo duplo?").
-- Com a confirmação, a chamada é repetida com p_permitir_duplo = true.

-- ---------------------------------------------------------------------------
-- Candidatos: jogos 'pendente' das fases em andamento. No mata-mata, só o próximo jogo de cada
-- série ainda não decidida cujos dois times já estejam definidos.
-- ---------------------------------------------------------------------------
create or replace function public.jogos_candidatos(p_competicao_id uuid)
returns setof public.jogos
language sql
stable
set search_path = ''
as $$
  select j.*
  from public.jogos j
  join public.fases f on f.id = j.fase_id
  left join public.series s on s.id = j.serie_id
  where j.competicao_id = p_competicao_id
    and j.status = 'pendente'
    and j.evento_id is null
    and f.status = 'em_andamento'
    and (
      j.serie_id is null
      or (
        s.status <> 'concluida'
        and s.time_a_id is not null
        and s.time_b_id is not null
        and not exists (
          select 1 from public.jogos j2
          where j2.serie_id = j.serie_id
            and j2.status in ('pendente', 'agendado')
            and j2.numero_na_serie < j.numero_na_serie
        )
      )
    );
$$;

-- Seleção (aleatória, com prioridades): rodadas mais antigas, times com menos jogos realizados/
-- agendados, sem time repetido no dia; entre equivalentes, sorteio. p_evento_id (no "sortear de
-- novo") devolve os jogos atuais do dia ao conjunto de candidatos.
-- Retorna {precisa_confirmar, max_sem_repeticao, candidatos, pedido, jogo_duplo, jogos: [ids na ordem]}.
create or replace function public.selecionar_jogos_evento(
  p_competicao_id uuid, p_qtd int, p_permitir_duplo boolean, p_evento_id uuid default null
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

  insert into pg_temp.sel_candidatos (id, casa, fora, rodada)
  select c.id, c.time_casa_id, c.time_fora_id, c.rodada from public.jogos_candidatos(p_competicao_id) c
  union
  select j.id, j.time_casa_id, j.time_fora_id, j.rodada from public.jogos j
  where p_evento_id is not null and j.evento_id = p_evento_id and j.status = 'agendado';

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

-- Recalcula ordem (1, 2, 3…) e inicio_previsto = data + hora_inicio + (i × intervalo), em America/Fortaleza.
create or replace function public.recalcular_horarios_evento(p_evento_id uuid)
returns void
language sql
set search_path = ''
as $$
  with ordem as (
    select j.id, row_number() over (order by j.ordem_no_evento nulls last, j.inicio_previsto, j.id) as pos
    from public.jogos j where j.evento_id = p_evento_id
  )
  update public.jogos j
    set ordem_no_evento = o.pos,
        inicio_previsto = ((e.data + e.hora_inicio) + (o.pos - 1) * make_interval(mins => e.intervalo_min))
                          at time zone 'America/Fortaleza'
  from ordem o, public.eventos e
  where j.id = o.id and e.id = p_evento_id;
$$;

-- Coloca os jogos no dia, na ordem dada, como 'agendado'.
create or replace function public.agendar_jogos_evento(p_evento_id uuid, p_jogos uuid[])
returns void
language sql
set search_path = ''
as $$
  update public.jogos j
    set evento_id = p_evento_id, status = 'agendado', ordem_no_evento = x.pos
  from unnest(p_jogos) with ordinality as x (id, pos)
  where j.id = x.id;
  select public.recalcular_horarios_evento(p_evento_id);
$$;

-- Devolve ao status 'pendente' (sem dia) os jogos agendados do dia (todos ou só o informado).
create or replace function public.liberar_jogos_evento(p_evento_id uuid, p_jogo_id uuid default null)
returns int
language plpgsql
set search_path = ''
as $$
declare
  v_qtd int;
begin
  update public.jogos
    set evento_id = null, status = 'pendente', ordem_no_evento = null, inicio_previsto = null
    where evento_id = p_evento_id and status = 'agendado' and (p_jogo_id is null or id = p_jogo_id);
  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;

create or replace function public.ids_da_selecao(p_selecao jsonb)
returns uuid[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(x.value::uuid order by x.pos), '{}')
  from jsonb_array_elements_text(coalesce(p_selecao -> 'jogos', '[]'::jsonb)) with ordinality as x (value, pos);
$$;

revoke all on function public.jogos_candidatos(uuid) from public, anon, authenticated;
revoke all on function public.selecionar_jogos_evento(uuid, int, boolean, uuid) from public, anon, authenticated;
revoke all on function public.recalcular_horarios_evento(uuid) from public, anon, authenticated;
revoke all on function public.agendar_jogos_evento(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.liberar_jogos_evento(uuid, uuid) from public, anon, authenticated;
revoke all on function public.ids_da_selecao(jsonb) from public, anon, authenticated;

-- Carrega o evento travando a linha e confere a permissão (usado pelas RPCs de evento).
create or replace function public.evento_para_editar(p_evento_id uuid, p_exige_rascunho boolean)
returns public.eventos
language plpgsql
set search_path = ''
as $$
declare
  v_evento public.eventos;
  v_comp_id uuid;
begin
  select competicao_id into v_comp_id from public.eventos where id = p_evento_id;
  if v_comp_id is null then
    raise exception 'Dia de jogos não encontrado.';
  end if;
  if not public.is_admin_da_competicao(v_comp_id) then
    raise exception 'Você não tem permissão para alterar os dias de jogos desta competição.' using errcode = '42501';
  end if;
  -- Trava a competição primeiro (mesma ordem de criar_evento) para serializar os sorteios.
  perform 1 from public.competicoes where id = v_comp_id for update;
  select * into v_evento from public.eventos where id = p_evento_id for update;
  if p_exige_rascunho and v_evento.status <> 'rascunho' then
    raise exception 'O dia de jogos já foi publicado e não pode mais ser montado.';
  end if;
  return v_evento;
end;
$$;

revoke all on function public.evento_para_editar(uuid, boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPCs (security definer, checam a permissão no início)
-- ---------------------------------------------------------------------------

-- Jogos que podem entrar num dia (para "trocar jogo").
create or replace function public.jogos_candidatos_evento(p_competicao_id uuid)
returns setof public.jogos
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin_da_competicao(p_competicao_id) then
    raise exception 'Você não tem permissão para ver os jogos desta competição.' using errcode = '42501';
  end if;
  return query select * from public.jogos_candidatos(p_competicao_id) order by rodada nulls last, created_at;
end;
$$;

create or replace function public.criar_evento(
  p_competicao_id uuid,
  p_data date,
  p_local text,
  p_hora_inicio time,
  p_qtd_jogos int,
  p_intervalo_min int,
  p_observacoes text default null,
  p_permitir_duplo boolean default false
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

  v_selecao := public.selecionar_jogos_evento(p_competicao_id, p_qtd_jogos, p_permitir_duplo, null);
  if (v_selecao ->> 'precisa_confirmar')::boolean then
    return v_selecao || jsonb_build_object('evento_id', null);
  end if;
  v_ids := public.ids_da_selecao(v_selecao);
  if coalesce(array_length(v_ids, 1), 0) = 0 then
    raise exception 'Não há jogos disponíveis: todos já estão em algum dia ou aguardam a definição dos times.';
  end if;

  insert into public.eventos (competicao_id, data, local, hora_inicio, qtd_jogos, intervalo_min, observacoes)
  values (p_competicao_id, p_data, trim(p_local), p_hora_inicio, p_qtd_jogos, p_intervalo_min,
          nullif(trim(coalesce(p_observacoes, '')), ''))
  returning id into v_evento_id;
  perform public.agendar_jogos_evento(v_evento_id, v_ids);

  return v_selecao || jsonb_build_object('evento_id', v_evento_id);
end;
$$;

-- p_qtd_jogos (opcional) troca a quantidade pedida do dia (ex.: "montar só X jogos" depois do aviso).
create or replace function public.sortear_evento(
  p_evento_id uuid, p_permitir_duplo boolean default false, p_qtd_jogos int default null
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
  v_selecao := public.selecionar_jogos_evento(v_evento.competicao_id, v_evento.qtd_jogos, p_permitir_duplo, p_evento_id);
  if (v_selecao ->> 'precisa_confirmar')::boolean then
    return v_selecao || jsonb_build_object('evento_id', p_evento_id);
  end if;
  v_ids := public.ids_da_selecao(v_selecao);
  if coalesce(array_length(v_ids, 1), 0) = 0 then
    raise exception 'Não há jogos disponíveis para este dia.';
  end if;
  perform public.liberar_jogos_evento(p_evento_id);
  update public.eventos set qtd_jogos = v_evento.qtd_jogos where id = p_evento_id;
  perform public.agendar_jogos_evento(p_evento_id, v_ids);
  return v_selecao || jsonb_build_object('evento_id', p_evento_id);
end;
$$;

create or replace function public.reordenar_evento(p_evento_id uuid, p_jogos uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evento public.eventos := public.evento_para_editar(p_evento_id, true);
begin
  if (select array_agg(id order by id) from public.jogos where evento_id = v_evento.id)
     is distinct from (select array_agg(x order by x) from unnest(p_jogos) x) then
    raise exception 'A nova ordem precisa ter exatamente os jogos deste dia.';
  end if;
  update public.jogos j set ordem_no_evento = x.pos
  from unnest(p_jogos) with ordinality as x (id, pos)
  where j.id = x.id;
  perform public.recalcular_horarios_evento(v_evento.id);
end;
$$;

create or replace function public.trocar_jogo_evento(p_jogo_sai uuid, p_jogo_entra uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evento_id uuid;
  v_evento public.eventos;
  v_sai public.jogos;
begin
  select evento_id into v_evento_id from public.jogos where id = p_jogo_sai;
  if v_evento_id is null then
    raise exception 'O jogo não está em um dia de jogos.';
  end if;
  v_evento := public.evento_para_editar(v_evento_id, true);
  select * into v_sai from public.jogos where id = p_jogo_sai for update;
  if v_sai.status <> 'agendado' then
    raise exception 'Jogo com súmula não pode ser trocado.';
  end if;
  if not exists (select 1 from public.jogos_candidatos(v_evento.competicao_id) c where c.id = p_jogo_entra) then
    raise exception 'O jogo escolhido não está disponível para este dia.';
  end if;

  perform public.liberar_jogos_evento(v_evento.id, p_jogo_sai);
  update public.jogos
    set evento_id = v_evento.id, status = 'agendado', ordem_no_evento = v_sai.ordem_no_evento
    where id = p_jogo_entra;
  perform public.recalcular_horarios_evento(v_evento.id);
end;
$$;

create or replace function public.remover_jogo_evento(p_jogo_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evento_id uuid;
  v_evento public.eventos;
begin
  select evento_id into v_evento_id from public.jogos where id = p_jogo_id;
  if v_evento_id is null then
    raise exception 'O jogo não está em um dia de jogos.';
  end if;
  v_evento := public.evento_para_editar(v_evento_id, true);
  if public.liberar_jogos_evento(v_evento.id, p_jogo_id) = 0 then
    raise exception 'Jogo com súmula não pode ser removido do dia.';
  end if;
  perform public.recalcular_horarios_evento(v_evento.id);
end;
$$;

create or replace function public.publicar_evento(p_evento_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evento public.eventos := public.evento_para_editar(p_evento_id, true);
begin
  if not exists (select 1 from public.jogos where evento_id = v_evento.id) then
    raise exception 'O dia não tem jogos. Sorteie de novo antes de publicar.';
  end if;
  update public.eventos set status = 'publicado' where id = v_evento.id;
end;
$$;

-- Excluir o dia devolve os jogos sem súmula para 'pendente'. Os que já têm súmula continuam
-- encerrados, apenas sem dia (evento_id vira null pela FK).
create or replace function public.excluir_evento(p_evento_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evento public.eventos := public.evento_para_editar(p_evento_id, false);
  v_qtd int;
begin
  v_qtd := public.liberar_jogos_evento(v_evento.id);
  delete from public.eventos where id = v_evento.id;
  return v_qtd;
end;
$$;

revoke all on function public.jogos_candidatos_evento(uuid) from public, anon;
revoke all on function public.criar_evento(uuid, date, text, time, int, int, text, boolean) from public, anon;
revoke all on function public.sortear_evento(uuid, boolean, int) from public, anon;
revoke all on function public.reordenar_evento(uuid, uuid[]) from public, anon;
revoke all on function public.trocar_jogo_evento(uuid, uuid) from public, anon;
revoke all on function public.remover_jogo_evento(uuid) from public, anon;
revoke all on function public.publicar_evento(uuid) from public, anon;
revoke all on function public.excluir_evento(uuid) from public, anon;
grant execute on function public.jogos_candidatos_evento(uuid) to authenticated;
grant execute on function public.criar_evento(uuid, date, text, time, int, int, text, boolean) to authenticated;
grant execute on function public.sortear_evento(uuid, boolean, int) to authenticated;
grant execute on function public.reordenar_evento(uuid, uuid[]) to authenticated;
grant execute on function public.trocar_jogo_evento(uuid, uuid) to authenticated;
grant execute on function public.remover_jogo_evento(uuid) to authenticated;
grant execute on function public.publicar_evento(uuid) to authenticated;
grant execute on function public.excluir_evento(uuid) to authenticated;
