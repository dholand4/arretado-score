-- Etapa 3 — Iniciar competição (seção 5), sorteio de grupos e geração de jogos (seção 6.1).

-- ---------------------------------------------------------------------------
-- Rodízio (método do círculo). Times numerados de 1 a p_n.
-- Com número ímpar, entra um "folga" (n + 1): em cada rodada um time descansa e todos
-- folgam o mesmo número de vezes (1 por turno). Turno 2 repete os confrontos com mando invertido.
-- Mando: o time fixo do círculo alterna a cada rodada; os demais pares mantêm a posição,
-- o que deixa cada time com no máximo 1 jogo de diferença entre casa e fora.
-- ---------------------------------------------------------------------------
create or replace function public.rodizio(p_n int, p_turnos int default 1)
returns table (rodada int, casa int, fora int)
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_m int;
  v_arr int[];
  v_r int;
  v_i int;
  v_a int;
  v_b int;
  v_t int;
  v_rodadas int[] := '{}';
  v_casas int[] := '{}';
  v_foras int[] := '{}';
begin
  if p_n is null or p_n < 2 then
    return;
  end if;
  if p_turnos not in (1, 2) then
    raise exception 'O número de turnos precisa ser 1 ou 2.';
  end if;
  v_m := p_n + (p_n % 2);
  v_arr := array(select generate_series(1, v_m));

  for v_r in 0 .. v_m - 2 loop
    for v_i in 1 .. v_m / 2 loop
      v_a := v_arr[v_i];
      v_b := v_arr[v_m + 1 - v_i];
      continue when v_a > p_n or v_b > p_n;   -- par com o "folga"
      if v_i = 1 and v_r % 2 = 1 then
        v_t := v_a; v_a := v_b; v_b := v_t;
      end if;
      v_rodadas := v_rodadas || (v_r + 1);
      v_casas := v_casas || v_a;
      v_foras := v_foras || v_b;
    end loop;
    -- Gira o círculo mantendo a primeira posição fixa.
    v_arr := array[v_arr[1], v_arr[v_m]] || v_arr[2 : v_m - 1];
  end loop;

  for v_i in 1 .. coalesce(array_length(v_rodadas, 1), 0) loop
    rodada := v_rodadas[v_i]; casa := v_casas[v_i]; fora := v_foras[v_i];
    return next;
  end loop;
  if p_turnos = 2 then
    for v_i in 1 .. coalesce(array_length(v_rodadas, 1), 0) loop
      rodada := v_rodadas[v_i] + (v_m - 1); casa := v_foras[v_i]; fora := v_casas[v_i];
      return next;
    end loop;
  end if;
end;
$$;

revoke all on function public.rodizio(int, int) from public;
grant execute on function public.rodizio(int, int) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Internas (sem checagem de permissão; só chamadas pelas RPCs abaixo)
-- ---------------------------------------------------------------------------

-- Cria os jogos de todos contra todos para a lista de times (em ordem aleatória), status 'pendente'.
create or replace function public.criar_jogos_rodizio(p_fase_id uuid, p_grupo_id uuid, p_times uuid[], p_turnos int)
returns int
language plpgsql
set search_path = ''
as $$
declare
  v_times uuid[] := array(select t from unnest(p_times) t order by random());
  v_qtd int;
begin
  insert into public.jogos (competicao_id, fase_id, grupo_id, rodada, time_casa_id, time_fora_id)
  select f.competicao_id, p_fase_id, p_grupo_id, r.rodada, v_times[r.casa], v_times[r.fora]
  from public.fases f
  cross join public.rodizio(coalesce(array_length(v_times, 1), 0), p_turnos) r
  where f.id = p_fase_id;
  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;

-- (Re)cria os grupos A, B, C… da fase e distribui os times: sorteio equilibrado (tamanhos
-- diferem no máximo em 1) ou a distribuição manual {"A": [time_id…], "B": […]}.
create or replace function public.distribuir_grupos(p_fase_id uuid, p_times uuid[], p_distribuicao jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_fase public.fases;
  v_nomes text[];
  v_ids uuid[];
  v_menor int;
  v_com_extra int;
begin
  select * into v_fase from public.fases where id = p_fase_id;
  v_nomes := array(select chr(64 + g) from generate_series(1, v_fase.qtd_grupos) g);

  if p_distribuicao is not null then
    if jsonb_typeof(p_distribuicao) <> 'object'
       or (select array_agg(k order by k) from jsonb_object_keys(p_distribuicao) k) is distinct from v_nomes then
      raise exception 'Distribua os times nos grupos %.', array_to_string(v_nomes, ', ');
    end if;
    if exists (
      select 1 from jsonb_each(p_distribuicao) e where jsonb_typeof(e.value) <> 'array'
    ) then
      raise exception 'Distribuição de grupos inválida.';
    end if;
    v_ids := array(
      select public.try_uuid(t.value) from jsonb_each(p_distribuicao) e, jsonb_array_elements_text(e.value) t
    );
    if exists (select 1 from unnest(v_ids) i where i is null or not (i = any (p_times)))
       or (select count(distinct i) from unnest(v_ids) i) <> coalesce(array_length(v_ids, 1), 0) then
      raise exception 'A distribuição tem time repetido ou que não participa da fase.';
    end if;
    if coalesce(array_length(v_ids, 1), 0) <> coalesce(array_length(p_times, 1), 0) then
      raise exception 'Distribua todos os times: faltam % time(s).',
        coalesce(array_length(p_times, 1), 0) - coalesce(array_length(v_ids, 1), 0);
    end if;
  end if;

  delete from public.grupos where fase_id = p_fase_id;
  insert into public.grupos (fase_id, nome) select p_fase_id, n from unnest(v_nomes) n;

  if p_distribuicao is null then
    insert into public.grupo_times (grupo_id, time_id)
    select g.id, s.time_id
    from (
      select t as time_id, (row_number() over (order by random()) - 1)::int as idx
      from unnest(p_times) t
    ) s
    join public.grupos g on g.fase_id = p_fase_id and g.nome = chr(65 + s.idx % v_fase.qtd_grupos);
  else
    insert into public.grupo_times (grupo_id, time_id)
    select g.id, t.value::uuid
    from jsonb_each(p_distribuicao) e
    join public.grupos g on g.fase_id = p_fase_id and g.nome = e.key
    cross join jsonb_array_elements_text(e.value) t;
  end if;

  -- Confere os tamanhos reais (vale também para a distribuição manual).
  select min(n) into v_menor from (
    select count(gt.time_id) as n from public.grupos g
    left join public.grupo_times gt on gt.grupo_id = g.id
    where g.fase_id = p_fase_id group by g.id
  ) s;
  if v_menor < 2 then
    raise exception 'Cada grupo precisa de pelo menos 2 times.';
  end if;
  if v_fase.classificam is not null then
    if v_fase.classificam > v_menor then
      raise exception 'Avançam % por grupo, mas há grupo com só % times.', v_fase.classificam, v_menor;
    end if;
    select count(*) into v_com_extra from (
      select g.id from public.grupos g join public.grupo_times gt on gt.grupo_id = g.id
      where g.fase_id = p_fase_id group by g.id having count(*) > v_fase.classificam
    ) s;
    if v_fase.melhores_extras > v_com_extra then
      raise exception 'Só % grupo(s) terão um %º colocado para os melhores extras.', v_com_extra, v_fase.classificam + 1;
    end if;
  end if;
end;
$$;

-- Gera os jogos de uma fase de todos contra todos (com a lista de times) ou de grupos (por grupo).
create or replace function public.gerar_jogos_da_fase(p_fase_id uuid, p_times uuid[])
returns int
language plpgsql
set search_path = ''
as $$
declare
  v_fase public.fases;
  v_grupo record;
  v_qtd int := 0;
  v_times uuid[];
begin
  select * into v_fase from public.fases where id = p_fase_id;
  if v_fase.tipo = 'mata_mata' then
    raise exception 'No mata-mata os jogos são criados série a série.';
  end if;
  if exists (select 1 from public.jogos where fase_id = p_fase_id) then
    raise exception 'Os jogos da fase "%" já foram gerados.', v_fase.nome;
  end if;

  if v_fase.tipo = 'grupos' then
    for v_grupo in select id from public.grupos where fase_id = p_fase_id order by nome loop
      v_times := array(select time_id from public.grupo_times where grupo_id = v_grupo.id);
      if coalesce(array_length(v_times, 1), 0) < 2 then
        raise exception 'Cada grupo precisa de pelo menos 2 times.';
      end if;
      v_qtd := v_qtd + public.criar_jogos_rodizio(p_fase_id, v_grupo.id, v_times, v_fase.turnos);
    end loop;
    if v_qtd = 0 then
      raise exception 'Distribua os times nos grupos antes de gerar os jogos.';
    end if;
  else
    if coalesce(array_length(p_times, 1), 0) < 2 then
      raise exception 'A fase precisa de pelo menos 2 times.';
    end if;
    v_qtd := public.criar_jogos_rodizio(p_fase_id, null, p_times, v_fase.turnos);
  end if;
  return v_qtd;
end;
$$;

revoke all on function public.criar_jogos_rodizio(uuid, uuid, uuid[], int) from public, anon, authenticated;
revoke all on function public.distribuir_grupos(uuid, uuid[], jsonb) from public, anon, authenticated;
revoke all on function public.gerar_jogos_da_fase(uuid, uuid[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: iniciar a competição
-- ---------------------------------------------------------------------------
create or replace function public.iniciar_competicao(p_competicao_id uuid, p_distribuicao jsonb default null)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comp public.competicoes;
  v_fase public.fases;
  v_times uuid[];
  v_n int;
  v_msg text;
begin
  if p_competicao_id is null or not exists (select 1 from public.competicoes where id = p_competicao_id) then
    raise exception 'Competição não encontrada.';
  end if;
  if not public.is_admin_da_competicao(p_competicao_id) then
    raise exception 'Você não tem permissão para iniciar esta competição.' using errcode = '42501';
  end if;
  select * into v_comp from public.competicoes where id = p_competicao_id for update;
  if v_comp.status <> 'rascunho' then
    raise exception 'A competição já foi iniciada.';
  end if;

  v_times := array(select id from public.times where competicao_id = p_competicao_id);
  v_n := coalesce(array_length(v_times, 1), 0);
  if v_n < 2 then
    raise exception 'Cadastre ao menos 2 times para iniciar a competição.';
  end if;

  select * into v_fase from public.fases where competicao_id = p_competicao_id and ordem = 1;
  if not found then
    raise exception 'Configure as fases antes de iniciar a competição.';
  end if;
  if v_fase.tipo = 'mata_mata' then
    raise exception 'A primeira fase precisa ser todos contra todos ou grupos.';
  end if;
  if v_fase.tipo = 'todos_contra_todos' and v_fase.classificam > v_n then
    raise exception '"%": avançam % times, mas só há % cadastrados.', v_fase.nome, v_fase.classificam, v_n;
  end if;
  if v_fase.tipo = 'grupos' then
    if p_distribuicao is null and v_fase.sorteio_grupos = 'manual' then
      raise exception 'Distribua os times nos grupos para iniciar.';
    end if;
    if p_distribuicao is null then
      v_msg := public.validar_config_grupos(v_n, v_fase.qtd_grupos, v_fase.classificam, v_fase.melhores_extras);
      if v_msg is not null then
        raise exception '"%": %.', v_fase.nome, v_msg;
      end if;
    end if;
  end if;

  update public.competicoes set status = 'em_andamento' where id = p_competicao_id;
  update public.fases set status = 'em_andamento' where id = v_fase.id;

  if v_fase.tipo = 'grupos' then
    perform public.distribuir_grupos(v_fase.id, v_times, p_distribuicao);
  end if;
  return public.gerar_jogos_da_fase(v_fase.id, v_times);
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: gerar os jogos de uma fase de todos contra todos ou grupos já em andamento
-- (a fase 1 é gerada ao iniciar; as seguintes, com os times definidos, na Etapa 5).
-- ---------------------------------------------------------------------------
create or replace function public.gerar_jogos_fase(p_fase_id uuid, p_times uuid[] default null)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comp_id uuid := public.competicao_da_fase(p_fase_id);
  v_fase public.fases;
  v_times uuid[];
begin
  if v_comp_id is null then
    raise exception 'Fase não encontrada.';
  end if;
  if not public.is_admin_da_competicao(v_comp_id) then
    raise exception 'Você não tem permissão para gerar jogos nesta competição.' using errcode = '42501';
  end if;
  perform 1 from public.competicoes where id = v_comp_id for update;
  select * into v_fase from public.fases where id = p_fase_id;
  if v_fase.status <> 'em_andamento' then
    raise exception 'A fase "%" precisa estar em andamento para gerar os jogos.', v_fase.nome;
  end if;

  if v_fase.tipo = 'todos_contra_todos' then
    if p_times is null and v_fase.ordem = 1 then
      v_times := array(select id from public.times where competicao_id = v_comp_id);
    else
      v_times := p_times;
    end if;
    if v_times is null then
      raise exception 'Informe os times da fase "%".', v_fase.nome;
    end if;
    if exists (
      select 1 from unnest(v_times) t
      where not exists (select 1 from public.times where id = t and competicao_id = v_comp_id)
    ) or (select count(distinct t) from unnest(v_times) t) <> array_length(v_times, 1) then
      raise exception 'Há time repetido ou de outra competição na lista.';
    end if;
  end if;
  return public.gerar_jogos_da_fase(p_fase_id, v_times);
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: sortear (ou redistribuir manualmente) os grupos de novo, enquanto nenhum jogo da
-- fase tiver súmula. Os jogos da fase são apagados e gerados outra vez.
-- ---------------------------------------------------------------------------
create or replace function public.sortear_grupos(p_fase_id uuid, p_distribuicao jsonb default null)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comp_id uuid := public.competicao_da_fase(p_fase_id);
  v_fase public.fases;
  v_times uuid[];
begin
  if v_comp_id is null then
    raise exception 'Fase não encontrada.';
  end if;
  if not public.is_admin_da_competicao(v_comp_id) then
    raise exception 'Você não tem permissão para sortear os grupos desta competição.' using errcode = '42501';
  end if;
  perform 1 from public.competicoes where id = v_comp_id for update;
  select * into v_fase from public.fases where id = p_fase_id;
  if v_fase.tipo <> 'grupos' then
    raise exception 'Só fases de grupos têm sorteio de grupos.';
  end if;
  if v_fase.status <> 'em_andamento' then
    raise exception 'A fase "%" não está em andamento.', v_fase.nome;
  end if;
  if exists (select 1 from public.jogos where fase_id = p_fase_id and status in ('encerrado', 'wo')) then
    raise exception 'Já há súmula lançada nesta fase: os grupos não podem ser sorteados de novo.';
  end if;
  if exists (select 1 from public.jogos where fase_id = p_fase_id and evento_id is not null) then
    raise exception 'Há jogos desta fase em dias de jogos. Exclua esses dias (ou tire os jogos deles) antes de sortear de novo.';
  end if;

  if v_fase.ordem = 1 then
    v_times := array(select id from public.times where competicao_id = v_comp_id);
  else
    v_times := array(
      select gt.time_id from public.grupo_times gt join public.grupos g on g.id = gt.grupo_id where g.fase_id = p_fase_id
    );
  end if;

  delete from public.jogos where fase_id = p_fase_id;
  perform public.distribuir_grupos(p_fase_id, v_times, p_distribuicao);
  return public.gerar_jogos_da_fase(p_fase_id, v_times);
end;
$$;

revoke all on function public.iniciar_competicao(uuid, jsonb) from public, anon;
revoke all on function public.gerar_jogos_fase(uuid, uuid[]) from public, anon;
revoke all on function public.sortear_grupos(uuid, jsonb) from public, anon;
grant execute on function public.iniciar_competicao(uuid, jsonb) to authenticated;
grant execute on function public.gerar_jogos_fase(uuid, uuid[]) to authenticated;
grant execute on function public.sortear_grupos(uuid, jsonb) to authenticated;
