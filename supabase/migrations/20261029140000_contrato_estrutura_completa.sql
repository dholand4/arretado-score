-- Contrato do banco — estrutura completa das seções 4 e 10 da spec que ainda faltavam:
-- fases, grupos, séries, eventos, jogos, súmula, financeiro, views de cálculo e policies.
--
-- Aqui fica só ESTRUTURA (tabelas, integridade, RLS, views de agregação).
-- Regras de negócio de cada etapa (gerar jogos, sorteio de evento, salvar súmula, W.O.,
-- desempate em classificacao_ordenada, avanço de fase, gerar cobranças...) ficam para
-- a etapa que as implementa, sempre em migrations novas.

-- ---------------------------------------------------------------------------
-- 4.4 Formato: fases, grupos e séries
-- ---------------------------------------------------------------------------
create table public.fases (
  id uuid primary key default gen_random_uuid(),
  competicao_id uuid not null references public.competicoes (id) on delete cascade,
  ordem int not null check (ordem > 0),
  nome text not null check (char_length(trim(nome)) > 0),
  tipo text not null check (tipo in ('todos_contra_todos', 'grupos', 'mata_mata')),
  turnos int not null default 1 check (turnos in (1, 2)),
  qtd_grupos int check (qtd_grupos > 0),
  sorteio_grupos text not null default 'aleatorio' check (sorteio_grupos in ('aleatorio', 'manual')),
  -- De onde vêm os times (4.4.1). Ex.: {"tipo":"todos_os_times"} ou {"tipo":"classificados","fase_ordem":1}
  entrada jsonb,
  classificam int check (classificam > 0),
  melhores_extras int not null default 0 check (melhores_extras >= 0),
  melhor_de int not null default 1 check (melhor_de in (1, 3, 5, 7)),
  cruzamento text check (cruzamento in ('por_campanha', 'cruzado_grupos', 'vencedores', 'manual')),
  disputa_terceiro boolean not null default false,
  status text not null default 'aguardando' check (status in ('aguardando', 'em_andamento', 'concluida')),
  created_at timestamptz not null default now(),
  unique (competicao_id, ordem)
);

create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  fase_id uuid not null references public.fases (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),
  unique (fase_id, nome)
);

create table public.grupo_times (
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  time_id uuid not null references public.times (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (grupo_id, time_id)
);

create index grupo_times_time_idx on public.grupo_times (time_id);

create table public.series (
  id uuid primary key default gen_random_uuid(),
  fase_id uuid not null references public.fases (id) on delete cascade,
  codigo text not null,
  -- Ex.: {"tipo":"posicao","fase_ordem":1,"posicao":1} | {"tipo":"posicao_grupo","fase_ordem":1,"grupo":"A","posicao":2}
  --      {"tipo":"vencedor","serie":"S1"} | {"tipo":"perdedor","serie":"S1"}
  origem_a jsonb,
  origem_b jsonb,
  time_a_id uuid references public.times (id),
  time_b_id uuid references public.times (id),
  melhor_de int not null default 1 check (melhor_de in (1, 3, 5, 7)),
  vitorias_a int not null default 0 check (vitorias_a >= 0),
  vitorias_b int not null default 0 check (vitorias_b >= 0),
  vencedor_id uuid references public.times (id),
  status text not null default 'aguardando' check (status in ('aguardando', 'em_andamento', 'concluida')),
  created_at timestamptz not null default now(),
  unique (fase_id, codigo),
  check (time_a_id is null or time_b_id is null or time_a_id <> time_b_id)
);

-- ---------------------------------------------------------------------------
-- 4.5 Dias de jogos e jogos
-- ---------------------------------------------------------------------------
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  competicao_id uuid not null references public.competicoes (id) on delete cascade,
  data date not null,
  local text not null,
  hora_inicio time not null,
  qtd_jogos int not null check (qtd_jogos > 0),
  intervalo_min int not null check (intervalo_min > 0),
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  observacoes text,
  created_at timestamptz not null default now()
);

create index eventos_competicao_idx on public.eventos (competicao_id, data);

create table public.jogos (
  id uuid primary key default gen_random_uuid(),
  competicao_id uuid not null references public.competicoes (id) on delete cascade,
  fase_id uuid not null references public.fases (id) on delete cascade,
  grupo_id uuid references public.grupos (id) on delete cascade,
  serie_id uuid references public.series (id) on delete cascade,
  rodada int check (rodada > 0),
  numero_na_serie int check (numero_na_serie > 0),
  time_casa_id uuid not null references public.times (id),
  time_fora_id uuid not null references public.times (id),
  evento_id uuid references public.eventos (id) on delete set null,
  ordem_no_evento int,
  inicio_previsto timestamptz,
  status text not null default 'pendente' check (status in ('pendente', 'agendado', 'encerrado', 'wo', 'cancelado')),
  placar_casa int check (placar_casa >= 0),
  placar_fora int check (placar_fora >= 0),
  wo_ausente text check (wo_ausente in ('casa', 'fora', 'ambos')),
  so_placar boolean not null default false,
  vencedor_id uuid references public.times (id),
  created_at timestamptz not null default now(),
  check (time_casa_id <> time_fora_id),
  check (vencedor_id is null or vencedor_id in (time_casa_id, time_fora_id)),
  check (wo_ausente is null or status = 'wo'),
  check (status not in ('encerrado', 'wo') or (placar_casa is not null and placar_fora is not null))
);

create index jogos_competicao_idx on public.jogos (competicao_id, status);
create index jogos_fase_idx on public.jogos (fase_id, grupo_id);
create index jogos_serie_idx on public.jogos (serie_id, numero_na_serie);
create index jogos_evento_idx on public.jogos (evento_id, ordem_no_evento);
create index jogos_times_idx on public.jogos (time_casa_id, time_fora_id);

create table public.jogo_jogadores (
  jogo_id uuid not null references public.jogos (id) on delete cascade,
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  time_id uuid not null references public.times (id),
  created_at timestamptz not null default now(),
  primary key (jogo_id, jogador_id)
);

create index jogo_jogadores_jogador_idx on public.jogo_jogadores (jogador_id);

create table public.sumula_estatisticas (
  id uuid primary key default gen_random_uuid(),
  jogo_id uuid not null references public.jogos (id) on delete cascade,
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  time_id uuid not null references public.times (id),
  categoria_id uuid not null references public.categorias_estatistica (id) on delete cascade,
  valor int not null default 0 check (valor >= 0),
  created_at timestamptz not null default now(),
  unique (jogo_id, jogador_id, categoria_id)
);

create index sumula_estatisticas_jogador_idx on public.sumula_estatisticas (jogador_id, categoria_id);
create index sumula_estatisticas_categoria_idx on public.sumula_estatisticas (categoria_id);

-- ---------------------------------------------------------------------------
-- 4.6 Financeiro
-- ---------------------------------------------------------------------------
create table public.cobrancas (
  id uuid primary key default gen_random_uuid(),
  competicao_id uuid not null references public.competicoes (id) on delete cascade,
  time_id uuid not null references public.times (id) on delete cascade,
  jogador_id uuid references public.jogadores (id) on delete cascade,
  referencia date not null check (referencia = date_trunc('month', referencia)::date),
  valor numeric(10, 2) not null check (valor >= 0),
  vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'isento')),
  pago_em date,
  comprovante_url text,
  observacao text,
  registrado_por uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  -- "Gerar cobranças" é idempotente: uma por time (ou jogador) por mês.
  unique nulls not distinct (competicao_id, time_id, jogador_id, referencia)
);

create index cobrancas_competicao_idx on public.cobrancas (competicao_id, referencia, status);

create table public.pagamentos_internos (
  id uuid primary key default gen_random_uuid(),
  time_id uuid not null references public.times (id) on delete cascade,
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  referencia date not null check (referencia = date_trunc('month', referencia)::date),
  valor numeric(10, 2) not null check (valor >= 0),
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'isento')),
  pago_em date,
  observacao text,
  created_at timestamptz not null default now(),
  unique (time_id, jogador_id, referencia)
);

-- ---------------------------------------------------------------------------
-- Funções auxiliares de acesso (security definer, sem passar pela RLS)
-- ---------------------------------------------------------------------------
create or replace function public.competicao_da_fase(p_fase_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select competicao_id from public.fases where id = p_fase_id;
$$;

create or replace function public.competicao_do_grupo(p_grupo_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select f.competicao_id from public.grupos g join public.fases f on f.id = g.fase_id where g.id = p_grupo_id;
$$;

create or replace function public.competicao_do_jogo(p_jogo_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select competicao_id from public.jogos where id = p_jogo_id;
$$;

-- Fases: escrita do admin respeita a trava de estrutura; o master pode sempre (seção 5).
create or replace function public.pode_editar_estrutura(p_competicao_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_master() or (
    public.is_admin_da_competicao(p_competicao_id)
    and not coalesce((select estrutura_travada from public.competicoes where id = p_competicao_id), true)
  );
$$;

create or replace function public.evento_publicado(p_evento_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.eventos where id = p_evento_id and status = 'publicado');
$$;

-- Jogo visível ao público: competição publicada e (evento publicado ou jogo já decidido).
create or replace function public.jogo_publico(p_jogo_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.jogos j
    left join public.eventos e on e.id = j.evento_id
    where j.id = p_jogo_id
      and public.competicao_publica(j.competicao_id)
      and (j.status in ('encerrado', 'wo') or e.status = 'publicado')
  );
$$;

-- Súmula visível ao público: só de jogos encerrados.
create or replace function public.jogo_encerrado_publico(p_jogo_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.jogos j
    where j.id = p_jogo_id and j.status = 'encerrado' and public.competicao_publica(j.competicao_id)
  );
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'competicao_da_fase(uuid)', 'competicao_do_grupo(uuid)', 'competicao_do_jogo(uuid)',
    'pode_editar_estrutura(uuid)', 'evento_publicado(uuid)', 'jogo_publico(uuid)', 'jogo_encerrado_publico(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated, service_role', f);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Integridade entre tabelas (tudo da mesma competição / do mesmo time)
-- ---------------------------------------------------------------------------
create or replace function public.check_jogo_integridade()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.competicao_da_fase(new.fase_id) is distinct from new.competicao_id then
    raise exception 'A fase não pertence à competição do jogo.';
  end if;
  if exists (
    select 1 from public.times t
    where t.id in (new.time_casa_id, new.time_fora_id) and t.competicao_id <> new.competicao_id
  ) then
    raise exception 'Os dois times precisam ser da competição do jogo.';
  end if;
  if new.grupo_id is not null
     and not exists (select 1 from public.grupos where id = new.grupo_id and fase_id = new.fase_id) then
    raise exception 'O grupo não pertence à fase do jogo.';
  end if;
  if new.serie_id is not null
     and not exists (select 1 from public.series where id = new.serie_id and fase_id = new.fase_id) then
    raise exception 'A série não pertence à fase do jogo.';
  end if;
  if new.evento_id is not null
     and not exists (select 1 from public.eventos where id = new.evento_id and competicao_id = new.competicao_id) then
    raise exception 'O dia de jogos não pertence à competição do jogo.';
  end if;
  return new;
end;
$$;

create trigger on_jogo_integridade
  before insert or update on public.jogos
  for each row execute function public.check_jogo_integridade();

create or replace function public.check_grupo_time_integridade()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.times t where t.id = new.time_id and t.competicao_id = public.competicao_do_grupo(new.grupo_id)
  ) then
    raise exception 'O time não pertence à competição do grupo.';
  end if;
  return new;
end;
$$;

create trigger on_grupo_time_integridade
  before insert or update on public.grupo_times
  for each row execute function public.check_grupo_time_integridade();

create or replace function public.check_serie_integridade()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.times t
    where t.id in (new.time_a_id, new.time_b_id, new.vencedor_id)
      and t.competicao_id <> public.competicao_da_fase(new.fase_id)
  ) then
    raise exception 'Os times da série precisam ser da competição da fase.';
  end if;
  if new.vencedor_id is not null and new.vencedor_id not in (new.time_a_id, new.time_b_id) then
    raise exception 'O vencedor precisa ser um dos times da série.';
  end if;
  return new;
end;
$$;

create trigger on_serie_integridade
  before insert or update on public.series
  for each row execute function public.check_serie_integridade();

-- Presença e estatística: jogador do time informado, e o time joga a partida.
create or replace function public.check_participacao_integridade()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.jogadores where id = new.jogador_id and time_id = new.time_id) then
    raise exception 'O jogador não pertence ao time informado.';
  end if;
  if not exists (
    select 1 from public.jogos where id = new.jogo_id and new.time_id in (time_casa_id, time_fora_id)
  ) then
    raise exception 'O time não participa deste jogo.';
  end if;
  -- IF aninhado: o PL/pgSQL não garante curto-circuito e jogo_jogadores não tem categoria_id.
  if tg_table_name = 'sumula_estatisticas' then
    if not exists (
      select 1 from public.categorias_estatistica c
      where c.id = (to_jsonb(new) ->> 'categoria_id')::uuid and c.competicao_id = public.competicao_do_jogo(new.jogo_id)
    ) then
      raise exception 'A categoria não pertence à competição do jogo.';
    end if;
  end if;
  return new;
end;
$$;

create trigger on_jogo_jogador_integridade
  before insert or update on public.jogo_jogadores
  for each row execute function public.check_participacao_integridade();

create trigger on_sumula_estatistica_integridade
  before insert or update on public.sumula_estatisticas
  for each row execute function public.check_participacao_integridade();

create or replace function public.check_financeiro_integridade()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'cobrancas' then
    if not exists (
      select 1 from public.times
      where id = new.time_id and competicao_id = (to_jsonb(new) ->> 'competicao_id')::uuid
    ) then
      raise exception 'O time não pertence à competição da cobrança.';
    end if;
  end if;
  if new.jogador_id is not null
     and not exists (select 1 from public.jogadores where id = new.jogador_id and time_id = new.time_id) then
    raise exception 'O jogador não pertence ao time informado.';
  end if;
  return new;
end;
$$;

create trigger on_cobranca_integridade
  before insert or update on public.cobrancas
  for each row execute function public.check_financeiro_integridade();

create trigger on_pagamento_interno_integridade
  before insert or update on public.pagamentos_internos
  for each row execute function public.check_financeiro_integridade();

-- ---------------------------------------------------------------------------
-- RLS (seção 10.2)
-- ---------------------------------------------------------------------------
alter table public.fases enable row level security;
alter table public.grupos enable row level security;
alter table public.grupo_times enable row level security;
alter table public.series enable row level security;
alter table public.eventos enable row level security;
alter table public.jogos enable row level security;
alter table public.jogo_jogadores enable row level security;
alter table public.sumula_estatisticas enable row level security;
alter table public.cobrancas enable row level security;
alter table public.pagamentos_internos enable row level security;

revoke insert, update, delete on public.fases, public.grupos, public.grupo_times, public.series,
  public.eventos, public.jogos, public.jogo_jogadores, public.sumula_estatisticas,
  public.cobrancas, public.pagamentos_internos from anon;
revoke select on public.cobrancas, public.pagamentos_internos from anon;

-- Súmula: escrita só por RPC (security definer) — seção 6.5 / 10.2.
revoke insert, update, delete on public.jogo_jogadores, public.sumula_estatisticas from authenticated;

-- fases (escrita respeita estrutura_travada, exceto master)
create policy "fases_select_publica" on public.fases
  for select to anon, authenticated using (public.competicao_publica(competicao_id));
create policy "fases_select_admin" on public.fases
  for select to authenticated using (public.is_admin_da_competicao(competicao_id));
create policy "fases_insert" on public.fases
  for insert to authenticated with check (public.pode_editar_estrutura(competicao_id));
create policy "fases_update" on public.fases
  for update to authenticated
  using (public.pode_editar_estrutura(competicao_id)) with check (public.pode_editar_estrutura(competicao_id));
create policy "fases_delete" on public.fases
  for delete to authenticated using (public.pode_editar_estrutura(competicao_id));

-- grupos e grupo_times
create policy "grupos_select_publica" on public.grupos
  for select to anon, authenticated using (public.competicao_publica(public.competicao_da_fase(fase_id)));
create policy "grupos_select_admin" on public.grupos
  for select to authenticated using (public.is_admin_da_competicao(public.competicao_da_fase(fase_id)));
create policy "grupos_write_admin" on public.grupos
  for all to authenticated
  using (public.is_admin_da_competicao(public.competicao_da_fase(fase_id)))
  with check (public.is_admin_da_competicao(public.competicao_da_fase(fase_id)));

create policy "grupo_times_select_publica" on public.grupo_times
  for select to anon, authenticated using (public.competicao_publica(public.competicao_do_grupo(grupo_id)));
create policy "grupo_times_select_admin" on public.grupo_times
  for select to authenticated using (public.is_admin_da_competicao(public.competicao_do_grupo(grupo_id)));
create policy "grupo_times_write_admin" on public.grupo_times
  for all to authenticated
  using (public.is_admin_da_competicao(public.competicao_do_grupo(grupo_id)))
  with check (public.is_admin_da_competicao(public.competicao_do_grupo(grupo_id)));

-- series
create policy "series_select_publica" on public.series
  for select to anon, authenticated using (public.competicao_publica(public.competicao_da_fase(fase_id)));
create policy "series_select_admin" on public.series
  for select to authenticated using (public.is_admin_da_competicao(public.competicao_da_fase(fase_id)));
create policy "series_write_admin" on public.series
  for all to authenticated
  using (public.is_admin_da_competicao(public.competicao_da_fase(fase_id)))
  with check (public.is_admin_da_competicao(public.competicao_da_fase(fase_id)));

-- eventos: público só publicados
create policy "eventos_select_publica" on public.eventos
  for select to anon, authenticated using (status = 'publicado' and public.competicao_publica(competicao_id));
create policy "eventos_select_admin" on public.eventos
  for select to authenticated using (public.is_admin_da_competicao(competicao_id));
create policy "eventos_write_admin" on public.eventos
  for all to authenticated
  using (public.is_admin_da_competicao(competicao_id)) with check (public.is_admin_da_competicao(competicao_id));

-- jogos: público só de eventos publicados ou já decididos
create policy "jogos_select_publica" on public.jogos
  for select to anon, authenticated
  using (
    public.competicao_publica(competicao_id)
    and (status in ('encerrado', 'wo') or public.evento_publicado(evento_id))
  );
create policy "jogos_select_admin" on public.jogos
  for select to authenticated using (public.is_admin_da_competicao(competicao_id));
create policy "jogos_write_admin" on public.jogos
  for all to authenticated
  using (public.is_admin_da_competicao(competicao_id)) with check (public.is_admin_da_competicao(competicao_id));

-- súmula: leitura pública para jogos encerrados; escrita só via RPC
create policy "jogo_jogadores_select_publica" on public.jogo_jogadores
  for select to anon, authenticated using (public.jogo_encerrado_publico(jogo_id));
create policy "jogo_jogadores_select_admin" on public.jogo_jogadores
  for select to authenticated using (public.is_admin_da_competicao(public.competicao_do_jogo(jogo_id)));
create policy "sumula_select_publica" on public.sumula_estatisticas
  for select to anon, authenticated using (public.jogo_encerrado_publico(jogo_id));
create policy "sumula_select_admin" on public.sumula_estatisticas
  for select to authenticated using (public.is_admin_da_competicao(public.competicao_do_jogo(jogo_id)));

-- cobrancas: só admin da competição (e master). Dono do time NÃO vê.
create policy "cobrancas_admin" on public.cobrancas
  for all to authenticated
  using (public.is_admin_da_competicao(competicao_id)) with check (public.is_admin_da_competicao(competicao_id));

-- pagamentos_internos: dono do time e master
create policy "pagamentos_internos_dono_ou_master" on public.pagamentos_internos
  for all to authenticated
  using (public.is_dono_do_time(time_id) or public.is_master())
  with check (public.is_dono_do_time(time_id) or public.is_master());

-- ---------------------------------------------------------------------------
-- 4.7 Views de cálculo
-- ---------------------------------------------------------------------------

-- Classificação por fase (e grupo), sem ordenação. A ordenação com desempates
-- (seção 6.3) é a função classificacao_ordenada, implementada na Etapa 4.
-- Contam só jogos 'encerrado' e 'wo' fora de séries de mata-mata.
--   d  = total de derrotas (inclui as por W.O.); wo = derrotas por W.O.; j = v + e + d
--   pts = v*pontos_vitoria + e*pontos_empate + (d - wo)*pontos_derrota + wo*pontos_derrota_wo
--
-- Roda com o dono da view (não security_invoker): os participantes saem de TODOS os jogos da
-- fase, inclusive os ainda não publicados, para a tabela pública listar todos os times.
-- A visibilidade é filtrada explicitamente no fim: competição pública ou admin dela.
create or replace view public.v_classificacao
with (security_invoker = false) as
with participantes as (
  select j.fase_id, j.grupo_id, j.time_casa_id as time_id from public.jogos j where j.serie_id is null
  union
  select j.fase_id, j.grupo_id, j.time_fora_id from public.jogos j where j.serie_id is null
  union
  select g.fase_id, gt.grupo_id, gt.time_id from public.grupo_times gt join public.grupos g on g.id = gt.grupo_id
),
linhas as (
  select j.fase_id, j.grupo_id, x.time_id, j.status, j.vencedor_id, x.pf, x.pc, x.ausente
  from public.jogos j
  cross join lateral (values
    (j.time_casa_id, j.placar_casa, j.placar_fora, coalesce(j.wo_ausente in ('casa', 'ambos'), false)),
    (j.time_fora_id, j.placar_fora, j.placar_casa, coalesce(j.wo_ausente in ('fora', 'ambos'), false))
  ) as x (time_id, pf, pc, ausente)
  where j.status in ('encerrado', 'wo') and j.serie_id is null
),
agregado as (
  select fase_id, grupo_id, time_id,
    count(*) as j,
    count(*) filter (where vencedor_id = time_id) as v,
    count(*) filter (where status = 'encerrado' and vencedor_id is null) as e,
    count(*) filter (where status = 'encerrado' and vencedor_id is not null and vencedor_id <> time_id) as d_normal,
    count(*) filter (where status = 'wo' and ausente) as wo,
    coalesce(sum(pf), 0) as pf,
    coalesce(sum(pc), 0) as pc
  from linhas
  group by fase_id, grupo_id, time_id
)
select
  f.competicao_id,
  p.fase_id,
  p.grupo_id,
  p.time_id,
  coalesce(a.j, 0)::int as j,
  coalesce(a.v, 0)::int as v,
  coalesce(a.e, 0)::int as e,
  (coalesce(a.d_normal, 0) + coalesce(a.wo, 0))::int as d,
  coalesce(a.wo, 0)::int as wo,
  (coalesce(a.v, 0) * c.pontos_vitoria
    + coalesce(a.e, 0) * c.pontos_empate
    + coalesce(a.d_normal, 0) * c.pontos_derrota
    + coalesce(a.wo, 0) * c.pontos_derrota_wo)::int as pts,
  coalesce(a.pf, 0)::int as pf,
  coalesce(a.pc, 0)::int as pc,
  (coalesce(a.pf, 0) - coalesce(a.pc, 0))::int as saldo,
  case when coalesce(a.j, 0) > 0 then round(a.v::numeric / a.j, 4) else 0 end as aproveitamento
from participantes p
join public.fases f on f.id = p.fase_id
join public.competicoes c on c.id = f.competicao_id
left join agregado a
  on a.fase_id = p.fase_id and a.time_id = p.time_id and a.grupo_id is not distinct from p.grupo_id
where public.competicao_publica(f.competicao_id) or public.is_admin_da_competicao(f.competicao_id);

comment on view public.v_classificacao is
  'Números da classificação por fase/grupo (seção 6.3), sem ordenação. Ordem final: classificacao_ordenada (Etapa 4).';

-- Rankings de estatísticas (seção 6.7). Só jogos 'encerrado' sem so_placar (W.O. não entra).
-- escopo = 'competicao' (fase_id nulo, competição inteira) ou 'fase'.
create or replace view public.v_ranking_estatisticas
with (security_invoker = true) as
with presencas as (
  select j.competicao_id, j.fase_id, jj.jogo_id, jj.jogador_id, jj.time_id
  from public.jogo_jogadores jj
  join public.jogos j on j.id = jj.jogo_id
  where j.status = 'encerrado' and not j.so_placar
)
select
  p.competicao_id,
  case when grouping(p.fase_id) = 1 then null else p.fase_id end as fase_id,
  case when grouping(p.fase_id) = 1 then 'competicao' else 'fase' end as escopo,
  cat.id as categoria_id,
  p.jogador_id,
  p.time_id,
  coalesce(sum(s.valor), 0)::int as total,
  count(distinct p.jogo_id)::int as jogos,
  round(coalesce(sum(s.valor), 0)::numeric / nullif(count(distinct p.jogo_id), 0), 2) as media
from presencas p
join public.categorias_estatistica cat on cat.competicao_id = p.competicao_id
left join public.sumula_estatisticas s
  on s.jogo_id = p.jogo_id and s.jogador_id = p.jogador_id and s.categoria_id = cat.id
group by grouping sets (
  (p.competicao_id, cat.id, p.jogador_id, p.time_id, p.fase_id),
  (p.competicao_id, cat.id, p.jogador_id, p.time_id)
);

comment on view public.v_ranking_estatisticas is
  'Total, jogos (presenças) e média por jogador e categoria (seção 6.7). escopo competicao = fase_id nulo.';

grant select on public.v_classificacao, public.v_ranking_estatisticas to anon, authenticated;
