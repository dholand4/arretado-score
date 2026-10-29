-- Etapa 2 — Competição, categorias de estatística, times, jogadores e storage.

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
create or replace function public.try_uuid(valor text)
returns uuid
language plpgsql
immutable
as $$
begin
  return valor::uuid;
exception when others then
  return null;
end;
$$;

-- Critérios de desempate: array sem repetição, só com valores conhecidos (seção 6.3).
create or replace function public.criterios_desempate_validos(criterios jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(criterios) = 'array'
    and not exists (
      select 1 from jsonb_array_elements(criterios) c
      where jsonb_typeof(c) <> 'string'
         or c #>> '{}' not in ('confronto_direto', 'saldo', 'pontos_pro', 'vitorias')
    )
    and (select count(*) from jsonb_array_elements_text(criterios))
      = (select count(distinct v) from jsonb_array_elements_text(criterios) v);
$$;

-- Categoria de placar criada automaticamente conforme a modalidade (seção 4.2).
create or replace function public.categoria_placar_padrao(modalidade text)
returns table (nome text, sigla text, titulo_ranking text)
language sql
immutable
as $$
  select t.nome, t.sigla, t.titulo_ranking from (values
    ('basquete', 'Pontos', 'PTS', 'Cestinha'),
    ('futsal',   'Gols',   'GOL', 'Artilheiro'),
    ('volei',    'Pontos', 'PTS', 'Maior pontuador'),
    ('outro',    'Pontos', 'PTS', 'Maior pontuador')
  ) as t (modalidade, nome, sigla, titulo_ranking)
  where t.modalidade = categoria_placar_padrao.modalidade;
$$;

-- ---------------------------------------------------------------------------
-- competicoes
-- ---------------------------------------------------------------------------
create table public.competicoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  logo_url text,
  modalidade text not null check (modalidade in ('basquete', 'futsal', 'volei', 'outro')),
  descricao text,
  local_padrao text,
  intervalo_jogos_min int not null default 90 check (intervalo_jogos_min > 0),
  status text not null default 'rascunho' check (status in ('rascunho', 'em_andamento', 'encerrada')),
  estrutura_travada boolean not null default false,
  pontos_vitoria int not null default 1 check (pontos_vitoria >= 0),
  pontos_derrota int not null default 0 check (pontos_derrota >= 0),
  pontos_derrota_wo int not null default 0 check (pontos_derrota_wo >= 0),
  permite_empate boolean not null default false,
  pontos_empate int not null default 0 check (pontos_empate >= 0),
  wo_placar_vencedor int not null default 20 check (wo_placar_vencedor >= 0),
  wo_placar_perdedor int not null default 0 check (wo_placar_perdedor >= 0),
  criterios_desempate jsonb not null default '["confronto_direto","saldo","pontos_pro"]'
    check (public.criterios_desempate_validos(criterios_desempate)),
  cobranca_modelo text not null default 'nenhuma' check (cobranca_modelo in ('nenhuma', 'por_time', 'por_jogador')),
  cobranca_valor numeric(10, 2) check (cobranca_valor >= 0),
  cobranca_dia_vencimento int check (cobranca_dia_vencimento between 1 and 28),
  cobranca_mes_inicio date check (cobranca_mes_inicio = date_trunc('month', cobranca_mes_inicio)::date),
  cobranca_qtd_meses int check (cobranca_qtd_meses > 0),
  criado_por uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.competicao_admins (
  competicao_id uuid not null references public.competicoes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (competicao_id, user_id)
);

create index competicao_admins_user_idx on public.competicao_admins (user_id);

create table public.categorias_estatistica (
  id uuid primary key default gen_random_uuid(),
  competicao_id uuid not null references public.competicoes (id) on delete cascade,
  nome text not null check (char_length(trim(nome)) > 0),
  sigla text not null check (char_length(trim(sigla)) between 1 and 5),
  titulo_ranking text not null check (char_length(trim(titulo_ranking)) > 0),
  soma_no_placar boolean not null default false,
  ordem int,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

create index categorias_estatistica_competicao_idx on public.categorias_estatistica (competicao_id, ordem);
-- Exatamente uma categoria de placar por competição.
create unique index categorias_estatistica_placar_unico
  on public.categorias_estatistica (competicao_id) where soma_no_placar;

-- ---------------------------------------------------------------------------
-- times e jogadores
-- ---------------------------------------------------------------------------
create table public.times (
  id uuid primary key default gen_random_uuid(),
  competicao_id uuid not null references public.competicoes (id) on delete cascade,
  nome text not null check (char_length(trim(nome)) > 0),
  sigla text check (sigla ~ '^[A-Z0-9]{1,4}$'),
  logo_url text,
  dono_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index times_competicao_idx on public.times (competicao_id);
create index times_dono_idx on public.times (dono_id);

create table public.jogadores (
  id uuid primary key default gen_random_uuid(),
  competicao_id uuid not null references public.competicoes (id) on delete cascade,
  time_id uuid not null references public.times (id) on delete cascade,
  nome text not null check (char_length(trim(nome)) > 0),
  apelido text,
  numero int check (numero between 0 and 999),
  foto_url text,
  posicao text,
  documento text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index jogadores_time_idx on public.jogadores (time_id);
create index jogadores_competicao_idx on public.jogadores (competicao_id);
create unique index jogadores_time_numero_key on public.jogadores (time_id, numero) where numero is not null;
create unique index jogadores_competicao_documento_key
  on public.jogadores (competicao_id, documento) where documento is not null;

-- ---------------------------------------------------------------------------
-- Funções auxiliares de permissão (seção 10.1)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin_da_competicao(p_competicao_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_master() or exists (
    select 1
    from public.competicao_admins ca
    join public.profiles p on p.id = ca.user_id
    where ca.competicao_id = p_competicao_id
      and ca.user_id = auth.uid()
      and p.ativo
      and p.papel in ('admin', 'master')
  );
$$;

create or replace function public.is_dono_do_time(p_time_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.times t
    join public.profiles p on p.id = t.dono_id
    where t.id = p_time_id
      and t.dono_id = auth.uid()
      and p.ativo
  );
$$;

-- Dono de algum time da competição (para enxergar a competição mesmo em rascunho).
create or replace function public.is_dono_na_competicao(p_competicao_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.times t
    join public.profiles p on p.id = t.dono_id
    where t.competicao_id = p_competicao_id
      and t.dono_id = auth.uid()
      and p.ativo
  );
$$;

create or replace function public.competicao_publica(p_competicao_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.competicoes c
    where c.id = p_competicao_id and c.status <> 'rascunho'
  );
$$;

revoke all on function public.is_admin_da_competicao(uuid) from public;
revoke all on function public.is_dono_do_time(uuid) from public;
revoke all on function public.is_dono_na_competicao(uuid) from public;
revoke all on function public.competicao_publica(uuid) from public;
grant execute on function public.is_admin_da_competicao(uuid) to anon, authenticated, service_role;
grant execute on function public.is_dono_do_time(uuid) to anon, authenticated, service_role;
grant execute on function public.is_dono_na_competicao(uuid) to anon, authenticated, service_role;
grant execute on function public.competicao_publica(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Ao criar a competição: categoria de placar da modalidade + criador como admin.
create or replace function public.handle_competicao_criada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categorias_estatistica (competicao_id, nome, sigla, titulo_ranking, soma_no_placar, ordem)
  select new.id, p.nome, p.sigla, p.titulo_ranking, true, 1
  from public.categoria_placar_padrao(new.modalidade) p;

  if new.criado_por is not null then
    insert into public.competicao_admins (competicao_id, user_id)
    values (new.id, new.criado_por)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_competicao_criada
  after insert on public.competicoes
  for each row execute function public.handle_competicao_criada();

-- Trava de estrutura (seção 5) e troca de modalidade.
create or replace function public.handle_competicao_atualizada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.estrutura_travada
     and auth.uid() is not null
     and not public.is_master()
     and (
       new.pontos_vitoria, new.pontos_derrota, new.pontos_derrota_wo, new.permite_empate,
       new.pontos_empate, new.wo_placar_vencedor, new.wo_placar_perdedor, new.criterios_desempate
     ) is distinct from (
       old.pontos_vitoria, old.pontos_derrota, old.pontos_derrota_wo, old.permite_empate,
       old.pontos_empate, old.wo_placar_vencedor, old.wo_placar_perdedor, old.criterios_desempate
     )
  then
    raise exception 'A estrutura da competição está travada: só o admin master pode alterar pontuação e critérios.';
  end if;

  if not new.permite_empate then
    new.pontos_empate := 0;
  end if;

  -- Se a categoria de placar ainda tem o nome padrão da modalidade antiga, acompanha a nova.
  if new.modalidade is distinct from old.modalidade then
    update public.categorias_estatistica ce
      set nome = novo.nome, sigla = novo.sigla, titulo_ranking = novo.titulo_ranking
      from public.categoria_placar_padrao(old.modalidade) antigo,
           public.categoria_placar_padrao(new.modalidade) novo
      where ce.competicao_id = new.id
        and ce.soma_no_placar
        and (ce.nome, ce.sigla, ce.titulo_ranking) = (antigo.nome, antigo.sigla, antigo.titulo_ranking);
  end if;
  return new;
end;
$$;

create trigger on_competicao_atualizada
  before update on public.competicoes
  for each row execute function public.handle_competicao_atualizada();

-- Categorias: ordem automática e proteção da categoria de placar.
create or replace function public.handle_categoria_estatistica()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    -- Durante o cascade da exclusão da competição, a competição já não existe.
    if old.soma_no_placar and exists (select 1 from public.competicoes where id = old.competicao_id) then
      raise exception 'A categoria de placar não pode ser excluída, só renomeada.';
    end if;
    return old;
  end if;

  new.nome := trim(new.nome);
  new.sigla := upper(trim(new.sigla));
  new.titulo_ranking := trim(new.titulo_ranking);

  if tg_op = 'INSERT' and new.ordem is null then
    select coalesce(max(ordem), 0) + 1 into new.ordem
    from public.categorias_estatistica where competicao_id = new.competicao_id;
  end if;

  if tg_op = 'UPDATE' then
    if new.competicao_id <> old.competicao_id then
      raise exception 'Não é possível mover a categoria para outra competição.';
    end if;
    if old.soma_no_placar and not new.ativa then
      raise exception 'A categoria de placar não pode ser desativada.';
    end if;
  end if;
  return new;
end;
$$;

create trigger on_categoria_estatistica_ins_upd
  before insert or update on public.categorias_estatistica
  for each row execute function public.handle_categoria_estatistica();

create trigger on_categoria_estatistica_del
  before delete on public.categorias_estatistica
  for each row execute function public.handle_categoria_estatistica();

-- Times: normaliza, valida o dono e limita o que o dono do time pode alterar.
create or replace function public.handle_time()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.nome := trim(new.nome);
  new.sigla := nullif(upper(trim(new.sigla)), '');

  if tg_op = 'UPDATE' then
    if new.competicao_id <> old.competicao_id then
      raise exception 'Não é possível mover o time para outra competição.';
    end if;
    if auth.uid() is not null
       and not public.is_admin_da_competicao(old.competicao_id)
       and (new.sigla, new.dono_id) is distinct from (old.sigla, old.dono_id)
    then
      raise exception 'O dono do time só pode alterar o nome e o logo.';
    end if;
  end if;

  if new.dono_id is not null
     and (tg_op = 'INSERT' or new.dono_id is distinct from old.dono_id)
     and not exists (select 1 from public.profiles where id = new.dono_id and papel = 'dono_time')
  then
    raise exception 'O usuário vinculado precisa ter o papel "Dono do time".';
  end if;
  return new;
end;
$$;

create trigger on_time_ins_upd
  before insert or update on public.times
  for each row execute function public.handle_time();

-- Jogadores: competicao_id sempre vem do time; campos opcionais vazios viram null.
create or replace function public.handle_jogador()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select t.competicao_id into new.competicao_id from public.times t where t.id = new.time_id;
  if new.competicao_id is null then
    raise exception 'Time não encontrado.';
  end if;
  new.nome := trim(new.nome);
  new.apelido := nullif(trim(new.apelido), '');
  new.posicao := nullif(trim(new.posicao), '');
  new.documento := nullif(regexp_replace(coalesce(new.documento, ''), '[^0-9A-Za-z]', '', 'g'), '');
  return new;
end;
$$;

create trigger on_jogador_ins_upd
  before insert or update on public.jogadores
  for each row execute function public.handle_jogador();

-- ---------------------------------------------------------------------------
-- RPC: criar competição (competição + categoria de placar + vínculo do criador)
-- ---------------------------------------------------------------------------
create or replace function public.criar_competicao(
  p_nome text,
  p_slug text,
  p_modalidade text,
  p_descricao text default null,
  p_local_padrao text default null,
  p_intervalo_jogos_min int default 90
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_futsal boolean := p_modalidade = 'futsal';
begin
  if not (public.is_master() or public.is_admin()) then
    raise exception 'Apenas admins podem criar competições.' using errcode = '42501';
  end if;

  insert into public.competicoes (
    nome, slug, modalidade, descricao, local_padrao, intervalo_jogos_min,
    pontos_vitoria, pontos_derrota, permite_empate, pontos_empate, criado_por
  ) values (
    trim(p_nome), p_slug, p_modalidade, nullif(trim(p_descricao), ''), nullif(trim(p_local_padrao), ''),
    coalesce(p_intervalo_jogos_min, 90),
    -- Padrão estilo NBA; futsal liga empate (vitória 3, empate 1, derrota 0).
    case when v_futsal then 3 else 1 end, 0, v_futsal, case when v_futsal then 1 else 0 end,
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.criar_competicao(text, text, text, text, text, int) from public, anon;
grant execute on function public.criar_competicao(text, text, text, text, text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS e privilégios (seção 10.2)
-- ---------------------------------------------------------------------------
alter table public.competicoes enable row level security;
alter table public.competicao_admins enable row level security;
alter table public.categorias_estatistica enable row level security;
alter table public.times enable row level security;
alter table public.jogadores enable row level security;

revoke insert, update, delete on public.competicoes, public.competicao_admins,
  public.categorias_estatistica, public.times, public.jogadores from anon;

-- competicoes: criação só pela RPC; status/trava/criador só por funções do sistema.
revoke insert, update on public.competicoes from authenticated;
grant update (
  nome, slug, logo_url, modalidade, descricao, local_padrao, intervalo_jogos_min,
  pontos_vitoria, pontos_derrota, pontos_derrota_wo, permite_empate, pontos_empate,
  wo_placar_vencedor, wo_placar_perdedor, criterios_desempate,
  cobranca_modelo, cobranca_valor, cobranca_dia_vencimento, cobranca_mes_inicio, cobranca_qtd_meses
) on public.competicoes to authenticated;

create policy "competicoes_select_publica" on public.competicoes
  for select to anon, authenticated using (status <> 'rascunho');
create policy "competicoes_select_admin" on public.competicoes
  for select to authenticated using (public.is_admin_da_competicao(id));
create policy "competicoes_select_dono" on public.competicoes
  for select to authenticated using (public.is_dono_na_competicao(id));
create policy "competicoes_update_admin" on public.competicoes
  for update to authenticated
  using (public.is_admin_da_competicao(id)) with check (public.is_admin_da_competicao(id));
create policy "competicoes_delete_master" on public.competicoes
  for delete to authenticated using (public.is_master());

-- competicao_admins
revoke update on public.competicao_admins from authenticated;
create policy "competicao_admins_select" on public.competicao_admins
  for select to authenticated using (public.is_admin_da_competicao(competicao_id));
create policy "competicao_admins_insert_master" on public.competicao_admins
  for insert to authenticated with check (public.is_master());
create policy "competicao_admins_delete_master" on public.competicao_admins
  for delete to authenticated using (public.is_master());

-- Só admins (ou master) podem ser vinculados à administração de uma competição.
create or replace function public.handle_competicao_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = new.user_id and papel in ('admin', 'master')) then
    raise exception 'Só usuários com papel Admin podem administrar competições.';
  end if;
  return new;
end;
$$;

create trigger on_competicao_admin_ins
  before insert on public.competicao_admins
  for each row execute function public.handle_competicao_admin();

-- categorias_estatistica
revoke update on public.categorias_estatistica from authenticated;
grant update (nome, sigla, titulo_ranking, ordem, ativa) on public.categorias_estatistica to authenticated;
create policy "categorias_select_publica" on public.categorias_estatistica
  for select to anon, authenticated using (public.competicao_publica(competicao_id));
create policy "categorias_select_admin" on public.categorias_estatistica
  for select to authenticated using (public.is_admin_da_competicao(competicao_id));
create policy "categorias_insert_admin" on public.categorias_estatistica
  for insert to authenticated
  with check (public.is_admin_da_competicao(competicao_id) and not soma_no_placar);
create policy "categorias_update_admin" on public.categorias_estatistica
  for update to authenticated
  using (public.is_admin_da_competicao(competicao_id)) with check (public.is_admin_da_competicao(competicao_id));
create policy "categorias_delete_admin" on public.categorias_estatistica
  for delete to authenticated using (public.is_admin_da_competicao(competicao_id));

-- times
revoke update on public.times from authenticated;
grant update (nome, sigla, logo_url, dono_id) on public.times to authenticated;
create policy "times_select_publica" on public.times
  for select to anon, authenticated using (public.competicao_publica(competicao_id));
create policy "times_select_admin" on public.times
  for select to authenticated using (public.is_admin_da_competicao(competicao_id));
create policy "times_select_dono" on public.times
  for select to authenticated using (public.is_dono_do_time(id));
create policy "times_insert_admin" on public.times
  for insert to authenticated with check (public.is_admin_da_competicao(competicao_id));
create policy "times_update_admin_ou_dono" on public.times
  for update to authenticated
  using (public.is_admin_da_competicao(competicao_id) or public.is_dono_do_time(id))
  with check (public.is_admin_da_competicao(competicao_id) or public.is_dono_do_time(id));
create policy "times_delete_admin" on public.times
  for delete to authenticated using (public.is_admin_da_competicao(competicao_id));

-- jogadores
revoke update on public.jogadores from authenticated;
grant update (time_id, nome, apelido, numero, foto_url, posicao, documento, ativo) on public.jogadores to authenticated;
create policy "jogadores_select_publica" on public.jogadores
  for select to anon, authenticated using (public.competicao_publica(competicao_id));
create policy "jogadores_select_admin" on public.jogadores
  for select to authenticated using (public.is_admin_da_competicao(competicao_id));
create policy "jogadores_select_dono" on public.jogadores
  for select to authenticated using (public.is_dono_do_time(time_id));
create policy "jogadores_insert_admin_ou_dono" on public.jogadores
  for insert to authenticated
  with check (public.is_admin_da_competicao(competicao_id) or public.is_dono_do_time(time_id));
create policy "jogadores_update_admin_ou_dono" on public.jogadores
  for update to authenticated
  using (public.is_admin_da_competicao(competicao_id) or public.is_dono_do_time(time_id))
  with check (public.is_admin_da_competicao(competicao_id) or public.is_dono_do_time(time_id));
create policy "jogadores_delete_admin" on public.jogadores
  for delete to authenticated using (public.is_admin_da_competicao(competicao_id));

-- ---------------------------------------------------------------------------
-- Storage (seção 10.3) — caminho: {competicao_id}/{entidade}/{id}.{ext}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('logos', 'logos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('fotos-jogadores', 'fotos-jogadores', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('comprovantes', 'comprovantes', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create or replace function public.pode_gerenciar_arquivo(p_bucket text, p_nome text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_partes text[] := storage.foldername(p_nome);
  v_competicao uuid := public.try_uuid(v_partes[1]);
  v_entidade text := v_partes[2];
  v_id uuid := public.try_uuid(split_part(storage.filename(p_nome), '.', 1));
begin
  if v_competicao is null or v_id is null or array_length(v_partes, 1) <> 2 then
    return false;
  end if;

  if public.is_admin_da_competicao(v_competicao) then
    return (p_bucket = 'logos' and v_entidade in ('competicao', 'times'))
        or (p_bucket = 'fotos-jogadores' and v_entidade = 'jogadores')
        or (p_bucket = 'comprovantes' and v_entidade = 'cobrancas');
  end if;

  -- Dono do time: logo do próprio time e fotos do próprio elenco.
  if p_bucket = 'logos' and v_entidade = 'times' then
    return exists (select 1 from public.times t where t.id = v_id and t.competicao_id = v_competicao)
       and public.is_dono_do_time(v_id);
  end if;
  if p_bucket = 'fotos-jogadores' and v_entidade = 'jogadores' then
    return exists (
      select 1 from public.jogadores j
      where j.id = v_id and j.competicao_id = v_competicao and public.is_dono_do_time(j.time_id)
    );
  end if;
  return false;
end;
$$;

revoke all on function public.pode_gerenciar_arquivo(text, text) from public, anon;
grant execute on function public.pode_gerenciar_arquivo(text, text) to authenticated;

create policy "arquivos_select" on storage.objects
  for select to authenticated
  using (bucket_id in ('logos', 'fotos-jogadores', 'comprovantes') and public.pode_gerenciar_arquivo(bucket_id, name));
create policy "arquivos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('logos', 'fotos-jogadores', 'comprovantes') and public.pode_gerenciar_arquivo(bucket_id, name));
create policy "arquivos_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('logos', 'fotos-jogadores', 'comprovantes') and public.pode_gerenciar_arquivo(bucket_id, name))
  with check (bucket_id in ('logos', 'fotos-jogadores', 'comprovantes') and public.pode_gerenciar_arquivo(bucket_id, name));
create policy "arquivos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('logos', 'fotos-jogadores', 'comprovantes') and public.pode_gerenciar_arquivo(bucket_id, name));
