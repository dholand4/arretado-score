-- Súmula ao vivo (seção 6.5.1): o mesário registra o jogo lance a lance, com cronômetro e
-- relógio de posse (24 segundos). Ao encerrar, a mesa vira uma súmula normal pela mesma RPC
-- registrar_resultado_jogo.

-- Regras da partida, por liga (padrão FIBA). Não entram na trava de estrutura.
alter table public.competicoes
  add column qtd_periodos int not null default 4 check (qtd_periodos between 1 and 8),
  add column duracao_periodo_min int not null default 10 check (duracao_periodo_min between 1 and 60),
  add column duracao_prorrogacao_min int not null default 5 check (duracao_prorrogacao_min between 1 and 30),
  add column faltas_bonus_equipe int not null default 4 check (faltas_bonus_equipe between 1 and 20),
  add column faltas_exclusao_jogador int not null default 5 check (faltas_exclusao_jogador between 1 and 20),
  add column tempos_primeira_metade int not null default 2 check (tempos_primeira_metade between 0 and 10),
  add column tempos_segunda_metade int not null default 3 check (tempos_segunda_metade between 0 and 10),
  add column tempos_prorrogacao int not null default 1 check (tempos_prorrogacao between 0 and 10),
  add column relogio_posse boolean not null default true,
  add column posse_segundos int not null default 24 check (posse_segundos between 5 and 60),
  add column posse_reset_curto int not null default 14 check (posse_reset_curto between 1 and 60);

grant update (
  qtd_periodos, duracao_periodo_min, duracao_prorrogacao_min, faltas_bonus_equipe, faltas_exclusao_jogador,
  tempos_primeira_metade, tempos_segunda_metade, tempos_prorrogacao, relogio_posse, posse_segundos, posse_reset_curto
) on public.competicoes to authenticated;

-- Estado da mesa de um jogo. O relógio é guardado como "quanto faltava em relogio_referencia_em";
-- com relogio_rodando, o tempo restante é esse valor menos o que passou desde a referência.
create table public.jogo_mesa (
  jogo_id uuid primary key references public.jogos (id) on delete cascade,
  competicao_id uuid not null references public.competicoes (id) on delete cascade,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'encerrada')),
  escalados uuid[] not null default '{}',
  periodo int not null default 1 check (periodo >= 1),
  relogio_restante_ms int not null check (relogio_restante_ms >= 0),
  relogio_rodando boolean not null default false,
  posse_restante_ms int check (posse_restante_ms >= 0),
  relogio_referencia_em timestamptz not null default now(),
  apontador text,
  cronometrista text,
  operador_24 text,
  arbitro text,
  fiscal text,
  aberta_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  encerrada_em timestamptz
);

comment on table public.jogo_mesa is 'Súmula ao vivo de um jogo (seção 6.5.1): escalação, período e relógios.';

-- Cada registro da mesa. O id vem do aparelho: reenviar o mesmo lance (fila offline) não duplica.
create table public.jogo_lances (
  id uuid primary key,
  jogo_id uuid not null references public.jogo_mesa (jogo_id) on delete cascade,
  seq bigint generated always as identity,
  periodo int not null check (periodo >= 1),
  tempo_restante_ms int not null check (tempo_restante_ms >= 0),
  tipo text not null check (tipo in ('ponto', 'falta', 'tempo')),
  time_id uuid not null references public.times (id) on delete cascade,
  jogador_id uuid references public.jogadores (id) on delete cascade,
  valor int check (valor in (1, 2, 3)),
  tipo_falta text check (tipo_falta in ('pessoal', 'tecnica', 'antidesportiva', 'desqualificante')),
  anulado boolean not null default false,
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (tipo = 'ponto' and valor is not null and jogador_id is not null and tipo_falta is null)
    or (tipo = 'falta' and tipo_falta is not null and jogador_id is not null and valor is null)
    or (tipo = 'tempo' and jogador_id is null and valor is null and tipo_falta is null)
  )
);

create index jogo_lances_jogo_seq on public.jogo_lances (jogo_id, seq);

alter table public.jogo_mesa enable row level security;
alter table public.jogo_lances enable row level security;
revoke insert, update, delete on public.jogo_mesa, public.jogo_lances from anon, authenticated;

create policy "jogo_mesa_select_admin" on public.jogo_mesa
  for select to authenticated using (public.is_admin_da_competicao(competicao_id));
create policy "jogo_lances_select_admin" on public.jogo_lances
  for select to authenticated using (
    exists (select 1 from public.jogo_mesa m where m.jogo_id = jogo_lances.jogo_id and public.is_admin_da_competicao(m.competicao_id))
  );

-- Outro aparelho na mesma mesa acompanha as mudanças (o Realtime respeita a RLS).
do $$
declare
  t text;
begin
  foreach t in array array['jogo_mesa', 'jogo_lances'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- Hora do servidor: o aparelho calcula a diferença para mostrar o relógio igual em todos.
create function public.hora_servidor()
returns timestamptz language sql stable set search_path = '' as $$ select now() $$;

-- Mesa aberta do jogo, travada para escrita, conferindo a permissão.
create function public.mesa_para_lancar(p_jogo_id uuid)
returns public.jogo_mesa language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
begin
  select * into m from public.jogo_mesa where jogo_id = p_jogo_id for update;
  if not found or not public.is_admin_da_competicao(m.competicao_id) then
    raise exception 'Mesa não encontrada para este jogo.';
  end if;
  if m.status <> 'em_andamento' then raise exception 'A súmula ao vivo deste jogo já foi encerrada.'; end if;
  return m;
end $$;

-- Abre (ou devolve) a mesa do jogo.
create function public.mesa_abrir(p_jogo_id uuid)
returns public.jogo_mesa language plpgsql security definer set search_path = '' as $$
declare
  j public.jogos%rowtype;
  c public.competicoes%rowtype;
  m public.jogo_mesa%rowtype;
begin
  select * into j from public.jogos where id = p_jogo_id for update;
  if not found or not public.is_admin_da_competicao(j.competicao_id) then
    raise exception 'Sem permissão para abrir a súmula ao vivo deste jogo.';
  end if;
  select * into m from public.jogo_mesa where jogo_id = j.id;
  if found then return m; end if;
  if j.status not in ('pendente', 'agendado') then raise exception 'Este jogo já tem resultado.'; end if;
  if j.time_casa_id is null or j.time_fora_id is null then raise exception 'Os dois times do jogo ainda não estão definidos.'; end if;
  select * into c from public.competicoes where id = j.competicao_id;
  insert into public.jogo_mesa (jogo_id, competicao_id, relogio_restante_ms, posse_restante_ms, aberta_por)
  values (
    j.id, j.competicao_id, c.duracao_periodo_min * 60000,
    case when c.relogio_posse then c.posse_segundos * 1000 end, auth.uid()
  )
  returning * into m;
  return m;
end $$;

-- Escalação (quem vai jogar) e nomes da arbitragem/mesa.
create function public.mesa_escalar(p_jogo_id uuid, p_escalados uuid[], p_oficiais jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
  j public.jogos%rowtype;
  lista uuid[] := array(select distinct unnest(coalesce(p_escalados, '{}')));
begin
  m := public.mesa_para_lancar(p_jogo_id);
  select * into j from public.jogos where id = p_jogo_id;
  if exists (
    select 1 from unnest(lista) as e(id)
    where not exists (
      select 1 from public.jogadores a where a.id = e.id and a.ativo and a.time_id in (j.time_casa_id, j.time_fora_id)
    )
  ) then
    raise exception 'Jogador inválido ou inativo na escalação.';
  end if;
  if exists (
    select 1 from public.jogo_lances l
    where l.jogo_id = p_jogo_id and not l.anulado and l.jogador_id is not null and not (l.jogador_id = any (lista))
  ) then
    raise exception 'Não dá para tirar da escalação um jogador que já tem lances.';
  end if;
  update public.jogo_mesa set
    escalados = lista,
    apontador = nullif(trim(p_oficiais->>'apontador'), ''),
    cronometrista = nullif(trim(p_oficiais->>'cronometrista'), ''),
    operador_24 = nullif(trim(p_oficiais->>'operador_24'), ''),
    arbitro = nullif(trim(p_oficiais->>'arbitro'), ''),
    fiscal = nullif(trim(p_oficiais->>'fiscal'), '')
  where jogo_id = p_jogo_id;
end $$;

-- Estado dos relógios e do período, enviado pelo aparelho. referencia_ms é o instante (na hora do
-- servidor) em que os valores valiam; um estado mais antigo que o guardado é ignorado (fila offline).
create function public.mesa_relogio(p_jogo_id uuid, p_estado jsonb)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
  referencia timestamptz := to_timestamp((p_estado->>'referencia_ms')::double precision / 1000);
  novo_periodo int := (p_estado->>'periodo')::int;
  restante int := (p_estado->>'restante_ms')::int;
  posse int := (p_estado->>'posse_ms')::int;
begin
  m := public.mesa_para_lancar(p_jogo_id);
  if referencia is null or novo_periodo is null or novo_periodo < 1 or restante is null or restante < 0 or posse < 0 then
    raise exception 'Estado do relógio inválido.';
  end if;
  if referencia >= m.relogio_referencia_em then
    update public.jogo_mesa set
      periodo = novo_periodo,
      relogio_restante_ms = restante,
      relogio_rodando = coalesce((p_estado->>'rodando')::boolean, false),
      posse_restante_ms = posse,
      relogio_referencia_em = referencia
    where jogo_id = p_jogo_id;
  end if;
  return now();
end $$;

-- Um lance (ponto, falta ou tempo debitado). Reenviar o mesmo id não faz nada.
create function public.mesa_lance(p_lance jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
  j public.jogos%rowtype;
  c public.competicoes%rowtype;
  lance_id uuid := (p_lance->>'id')::uuid;
  jogo uuid := (p_lance->>'jogo_id')::uuid;
  equipe uuid := (p_lance->>'time_id')::uuid;
  atleta uuid := (p_lance->>'jogador_id')::uuid;
  tipo_lance text := p_lance->>'tipo';
  periodo_lance int := (p_lance->>'periodo')::int;
  faltas int; tecnicas int; desqualificado boolean; usados int; limite int; metade int;
begin
  if lance_id is null or jogo is null then raise exception 'Lance inválido.'; end if;
  if exists (select 1 from public.jogo_lances where id = lance_id) then return; end if;
  m := public.mesa_para_lancar(jogo);
  select * into j from public.jogos where id = jogo;
  select * into c from public.competicoes where id = j.competicao_id;
  if equipe is null or equipe not in (j.time_casa_id, j.time_fora_id) then raise exception 'Time inválido para este jogo.'; end if;
  if periodo_lance is null or periodo_lance < 1 then raise exception 'Período inválido.'; end if;

  if tipo_lance in ('ponto', 'falta') then
    if atleta is null or not (atleta = any (m.escalados))
       or not exists (select 1 from public.jogadores where id = atleta and time_id = equipe) then
      raise exception 'Este jogador não está escalado neste time.';
    end if;
    select count(*) filter (where l.tipo = 'falta'),
           count(*) filter (where l.tipo_falta in ('tecnica', 'antidesportiva')),
           coalesce(bool_or(l.tipo_falta = 'desqualificante'), false)
      into faltas, tecnicas, desqualificado
      from public.jogo_lances l where l.jogo_id = jogo and l.jogador_id = atleta and not l.anulado;
    if faltas >= c.faltas_exclusao_jogador or tecnicas >= 2 or desqualificado then
      raise exception 'Jogador excluído do jogo: não recebe mais lances.';
    end if;
  elsif tipo_lance = 'tempo' then
    metade := ceil(c.qtd_periodos / 2.0);
    if periodo_lance > c.qtd_periodos then
      limite := c.tempos_prorrogacao;
      select count(*) into usados from public.jogo_lances l
        where l.jogo_id = jogo and l.time_id = equipe and l.tipo = 'tempo' and not l.anulado and l.periodo = periodo_lance;
    else
      limite := case when periodo_lance <= metade then c.tempos_primeira_metade else c.tempos_segunda_metade end;
      select count(*) into usados from public.jogo_lances l
        where l.jogo_id = jogo and l.time_id = equipe and l.tipo = 'tempo' and not l.anulado
          and l.periodo <= c.qtd_periodos and (l.periodo <= metade) = (periodo_lance <= metade);
    end if;
    if usados >= limite then raise exception 'Esta equipe já usou todos os tempos desta parte do jogo.'; end if;
    atleta := null;
  else
    raise exception 'Tipo de lance inválido.';
  end if;

  insert into public.jogo_lances (id, jogo_id, periodo, tempo_restante_ms, tipo, time_id, jogador_id, valor, tipo_falta, criado_por)
  values (
    lance_id, jogo, periodo_lance, greatest(0, coalesce((p_lance->>'tempo_restante_ms')::int, 0)), tipo_lance, equipe, atleta,
    case when tipo_lance = 'ponto' then (p_lance->>'valor')::int end,
    case when tipo_lance = 'falta' then coalesce(p_lance->>'tipo_falta', 'pessoal') end,
    auth.uid()
  );
end $$;

-- "Desfazer": o lance continua no histórico, mas não conta.
create function public.mesa_anular(p_lance_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  jogo uuid;
begin
  select jogo_id into jogo from public.jogo_lances where id = p_lance_id;
  if jogo is null then raise exception 'Lance não encontrado.'; end if;
  perform public.mesa_para_lancar(jogo);
  update public.jogo_lances set anulado = true where id = p_lance_id;
end $$;

-- Descarta a mesa (e os lances) para voltar à súmula normal.
create function public.mesa_descartar(p_jogo_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.mesa_para_lancar(p_jogo_id);
  delete from public.jogo_mesa where jogo_id = p_jogo_id;
end $$;

-- Encerra a mesa e grava a súmula: presença dos escalados e pontos na categoria de placar.
create function public.mesa_encerrar(p_jogo_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
  categoria uuid;
  jogadores jsonb;
begin
  m := public.mesa_para_lancar(p_jogo_id);
  select id into categoria from public.categorias_estatistica
    where competicao_id = m.competicao_id and ativa and soma_no_placar;
  if categoria is null then raise exception 'É necessária uma categoria de placar ativa.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'jogador_id', e.id,
      'valores', jsonb_build_object(categoria::text, coalesce((
        select sum(l.valor) from public.jogo_lances l
        where l.jogo_id = p_jogo_id and l.jogador_id = e.id and l.tipo = 'ponto' and not l.anulado
      ), 0))
    )), '[]'::jsonb)
    into jogadores
    from unnest(m.escalados) as e(id);
  update public.jogo_mesa set status = 'encerrada', encerrada_em = now(), relogio_rodando = false
    where jogo_id = p_jogo_id;
  perform public.registrar_resultado_jogo(p_jogo_id, 'completa', null, null, null, jogadores);
end $$;

revoke all on function public.mesa_para_lancar(uuid) from public, anon, authenticated;
revoke all on function public.hora_servidor() from public, anon;
grant execute on function public.hora_servidor() to authenticated;
do $$
declare
  f text;
begin
  foreach f in array array[
    'mesa_abrir(uuid)', 'mesa_escalar(uuid, uuid[], jsonb)', 'mesa_relogio(uuid, jsonb)', 'mesa_lance(jsonb)',
    'mesa_anular(uuid)', 'mesa_descartar(uuid)', 'mesa_encerrar(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- Súmula normal e W.O. ficam bloqueados enquanto a mesa estiver aberta.
create or replace function public.registrar_resultado_jogo(p_jogo_id uuid, p_modo text, p_casa int default null, p_fora int default null, p_ausente text default null, p_jogadores jsonb default '[]'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  j public.jogos%rowtype; c public.competicoes%rowtype; f public.fases%rowtype;
  item jsonb; valor record; atleta public.jogadores%rowtype; categoria public.categorias_estatistica%rowtype;
  casa int := 0; fora int := 0; pontos int; vencedor uuid;
begin
  select * into j from public.jogos where id = p_jogo_id for update;
  if not found or not public.is_admin_da_competicao(j.competicao_id) then raise exception 'Sem permissão para lançar este resultado.'; end if;
  -- Com a súmula ao vivo aberta, o resultado só sai pela mesa (6.5.1).
  if exists (select 1 from public.jogo_mesa where jogo_id = j.id and status = 'em_andamento') then
    raise exception 'Este jogo está com a súmula ao vivo aberta. Encerre ou descarte a mesa antes.';
  end if;
  select * into c from public.competicoes where id = j.competicao_id for update;
  select * into f from public.fases where id = j.fase_id;
  if j.status = 'cancelado' then raise exception 'Jogo cancelado não recebe súmula.'; end if;
  if j.status in ('encerrado', 'wo') and f.status = 'concluida' and not public.is_master() and exists (
    select 1 from public.fases seguinte join public.jogos jogo on jogo.fase_id = seguinte.id
    where seguinte.competicao_id = f.competicao_id and seguinte.ordem = f.ordem + 1 and jogo.status in ('encerrado', 'wo')
  ) then raise exception 'Só o master pode editar: a fase seguinte já tem jogo encerrado.'; end if;
  if p_modo not in ('completa', 'placar', 'wo') or p_modo is null then raise exception 'Modo de resultado inválido.'; end if;
  delete from public.sumula_estatisticas where jogo_id = j.id;
  delete from public.jogo_jogadores where jogo_id = j.id;
  if p_modo = 'completa' then
    if jsonb_typeof(p_jogadores) <> 'array' then raise exception 'Lista de jogadores inválida.'; end if;
    if (select count(*) from public.categorias_estatistica where competicao_id = j.competicao_id and ativa and soma_no_placar) <> 1 then raise exception 'É necessária uma categoria de placar ativa.'; end if;
    for item in select value from jsonb_array_elements(p_jogadores) loop
      select * into atleta from public.jogadores where id = (item->>'jogador_id')::uuid and ativo and time_id in (j.time_casa_id, j.time_fora_id);
      if not found then raise exception 'Jogador inválido ou inativo.'; end if;
      insert into public.jogo_jogadores(jogo_id, jogador_id, time_id) values (j.id, atleta.id, atleta.time_id);
      if jsonb_typeof(item->'valores') <> 'object' then raise exception 'Estatísticas inválidas.'; end if;
      for valor in select * from jsonb_each_text(item->'valores') loop
        select * into categoria from public.categorias_estatistica where id = valor.key::uuid and competicao_id = j.competicao_id and ativa;
        if not found or valor.value !~ '^[0-9]+$' then raise exception 'Categoria ou valor inválido.'; end if;
        pontos := valor.value::int;
        insert into public.sumula_estatisticas(jogo_id, jogador_id, time_id, categoria_id, valor) values (j.id, atleta.id, atleta.time_id, categoria.id, pontos);
        if categoria.soma_no_placar then
          if atleta.time_id = j.time_casa_id then casa := casa + pontos; else fora := fora + pontos; end if;
        end if;
      end loop;
    end loop;
    -- Placar total informado: os pontos por jogador viram detalhe opcional e não podem passar do total.
    if p_casa is not null or p_fora is not null then
      if p_casa is null or p_fora is null or p_casa < 0 or p_fora < 0 then raise exception 'Informe o placar total dos dois times.'; end if;
      if casa > p_casa or fora > p_fora then raise exception 'Os pontos lançados por jogador passam do placar total informado.'; end if;
      casa := p_casa; fora := p_fora;
    end if;
  elsif p_modo = 'placar' then
    if p_casa is null or p_fora is null or p_casa < 0 or p_fora < 0 then raise exception 'Informe placares não negativos.'; end if;
    casa := p_casa; fora := p_fora;
  else
    if p_ausente is null or p_ausente not in ('casa','fora','ambos') then raise exception 'Informe quem faltou.'; end if;
    if p_ausente = 'casa' then casa := c.wo_placar_perdedor; fora := c.wo_placar_vencedor;
    elsif p_ausente = 'fora' then casa := c.wo_placar_vencedor; fora := c.wo_placar_perdedor;
    end if;
  end if;
  if p_modo <> 'wo' and casa = fora and (not c.permite_empate or f.tipo = 'mata_mata') then raise exception 'Empate não é permitido neste jogo.'; end if;
  if p_modo = 'wo' then
    vencedor := case p_ausente when 'casa' then j.time_fora_id when 'fora' then j.time_casa_id else null end;
  else vencedor := case when casa > fora then j.time_casa_id when fora > casa then j.time_fora_id else null end; end if;
  update public.jogos set status = case when p_modo = 'wo' then 'wo' else 'encerrado' end,
    placar_casa = casa, placar_fora = fora, vencedor_id = vencedor,
    wo_ausente = case when p_modo = 'wo' then p_ausente else null end, so_placar = p_modo = 'placar' where id = j.id;
  update public.competicoes set estrutura_travada = true where id = j.competicao_id and not estrutura_travada;
  perform public.pos_resultado_jogo(j.id);
end $$;
