-- Liga desativada: some da área pública e do dono do time; no painel fica só para consulta
-- até o master ou um admin dela reativar.

alter table public.competicoes add column ativa boolean not null default true;

comment on column public.competicoes.ativa is
  'Falso = liga desativada: fora do público e do dono do time, sem edição até ser reativada.';

-- ---------------------------------------------------------------------------
-- Visibilidade
-- ---------------------------------------------------------------------------
create or replace function public.competicao_publica(p_competicao_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.competicoes c
    where c.id = p_competicao_id and c.status <> 'rascunho' and c.ativa
  );
$$;

drop policy "competicoes_select_publica" on public.competicoes;
create policy "competicoes_select_publica" on public.competicoes
  for select to anon, authenticated using (status <> 'rascunho' and ativa);

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
    join public.competicoes c on c.id = t.competicao_id
    where t.id = p_time_id
      and t.dono_id = auth.uid()
      and p.ativo
      and c.ativa
  );
$$;

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
    join public.competicoes c on c.id = t.competicao_id
    where t.competicao_id = p_competicao_id
      and t.dono_id = auth.uid()
      and p.ativo
      and c.ativa
  );
$$;

-- ---------------------------------------------------------------------------
-- Somente leitura enquanto desativada
-- ---------------------------------------------------------------------------
-- Descobre a liga de qualquer registro ligado a ela (direto, por fase, jogo, grupo ou time).
create or replace function public.competicao_do_registro(p_registro jsonb)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (p_registro ->> 'competicao_id')::uuid,
    (select f.competicao_id from public.fases f where f.id = (p_registro ->> 'fase_id')::uuid),
    (select j.competicao_id from public.jogos j where j.id = (p_registro ->> 'jogo_id')::uuid),
    (select f.competicao_id from public.grupos g join public.fases f on f.id = g.fase_id
      where g.id = (p_registro ->> 'grupo_id')::uuid),
    (select t.competicao_id from public.times t where t.id = (p_registro ->> 'time_id')::uuid)
  );
$$;

revoke all on function public.competicao_do_registro(jsonb) from public, anon, authenticated;

create or replace function public.bloquear_liga_desativada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registro jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_competicao uuid;
begin
  -- Apagar a liga inteira (cascata) não passa por aqui: só escritas diretas.
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;
  v_competicao := public.competicao_do_registro(v_registro);
  if v_competicao is not null
     and exists (select 1 from public.competicoes c where c.id = v_competicao and not c.ativa) then
    raise exception 'Liga desativada: reative a liga para editar.';
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function public.bloquear_liga_desativada() from public, anon, authenticated;

do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array[
    'ajustes_classificacao', 'categorias_estatistica', 'cobrancas', 'competicao_admins', 'eventos',
    'fases', 'grupo_times', 'grupos', 'jogadores', 'jogo_jogadores', 'jogos', 'pagamentos_internos',
    'series', 'sumula_estatisticas', 'times'
  ] loop
    execute format(
      'create trigger bloquear_liga_desativada before insert or update or delete on public.%I
         for each row execute function public.bloquear_liga_desativada()',
      v_tabela
    );
  end loop;
end $$;

-- Na própria liga: desativada, só aceita voltar a ficar ativa.
create or replace function public.bloquear_edicao_liga_desativada()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not old.ativa and not new.ativa and pg_trigger_depth() = 1 then
    raise exception 'Liga desativada: reative a liga para editar.';
  end if;
  return new;
end;
$$;

create trigger bloquear_edicao_liga_desativada before update on public.competicoes
  for each row execute function public.bloquear_edicao_liga_desativada();

-- ---------------------------------------------------------------------------
-- RPC: master ou admin da liga desativa/reativa
-- ---------------------------------------------------------------------------
create or replace function public.definir_liga_ativa(p_competicao_id uuid, p_ativa boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_competicao_id is null or not exists (select 1 from public.competicoes where id = p_competicao_id) then
    raise exception 'Competição não encontrada.';
  end if;
  if not public.is_admin_da_competicao(p_competicao_id) then
    raise exception 'Só o Admin ou um coordenador desta liga pode desativá-la ou reativá-la.' using errcode = '42501';
  end if;
  update public.competicoes set ativa = coalesce(p_ativa, true) where id = p_competicao_id;
end;
$$;

revoke all on function public.definir_liga_ativa(uuid, boolean) from public, anon;
grant execute on function public.definir_liga_ativa(uuid, boolean) to authenticated;
