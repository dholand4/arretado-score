-- Etapa 1 — Base: perfis de usuário, funções auxiliares e regras de acesso.

-- ---------------------------------------------------------------------------
-- profiles (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  papel text not null check (papel in ('master', 'admin', 'dono_time')),
  ativo boolean not null default true,
  precisa_trocar_senha boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuário (1:1 com auth.users). Escrita só via Edge Function admin-users e triggers.';

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Funções auxiliares (security definer: leem profiles sem passar pela RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_master()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.papel = 'master'
      and p.ativo
  );
$$;

-- Admin ativo (papel 'admin'). Master é tratado à parte por is_master().
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.papel = 'admin'
      and p.ativo
  );
$$;

-- Usuário logado e ativo (qualquer papel).
create or replace function public.is_usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.ativo
  );
$$;

revoke all on function public.is_master() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_usuario_ativo() from public;
grant execute on function public.is_master() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_usuario_ativo() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Policies de profiles
-- Leitura: o próprio usuário; master vê todos; admin vê donos de time (para vincular).
-- Escrita: nenhuma policy para anon/authenticated — só service_role (Edge Function)
-- e as triggers abaixo alteram a tabela.
-- ---------------------------------------------------------------------------
create policy "profiles_select_proprio"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_select_master"
  on public.profiles for select
  to authenticated
  using (public.is_master());

create policy "profiles_select_admin_ve_donos"
  on public.profiles for select
  to authenticated
  using (papel = 'dono_time' and public.is_admin());

revoke insert, update, delete on public.profiles from anon, authenticated;
revoke select on public.profiles from anon;

-- ---------------------------------------------------------------------------
-- Triggers em auth.users
-- ---------------------------------------------------------------------------

-- Cria o profile junto com o usuário. O papel nasce como o de menor privilégio
-- ('dono_time'); a Edge Function admin-users (ou o SQL do primeiro master) define o papel real.
-- O papel nunca é lido de user_metadata, que o próprio usuário consegue editar.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome, papel)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    'dono_time'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Quando a senha muda, a troca obrigatória está cumprida.
-- O reset_password da Edge Function marca precisa_trocar_senha = true de novo logo depois.
create or replace function public.handle_auth_password_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.profiles
      set precisa_trocar_senha = false
      where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_password_changed
  after update of encrypted_password on auth.users
  for each row execute function public.handle_auth_password_change();

-- ---------------------------------------------------------------------------
-- RPC: lista de usuários para a tela do master (profiles não guarda e-mail)
-- ---------------------------------------------------------------------------
create or replace function public.listar_usuarios()
returns table (
  id uuid,
  nome text,
  email text,
  papel text,
  ativo boolean,
  precisa_trocar_senha boolean,
  created_at timestamptz,
  ultimo_acesso timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_master() then
    raise exception 'Apenas o admin master pode listar usuários.'
      using errcode = '42501';
  end if;

  return query
    select p.id, p.nome, u.email::text, p.papel, p.ativo, p.precisa_trocar_senha,
           p.created_at, u.last_sign_in_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.nome;
end;
$$;

revoke all on function public.listar_usuarios() from public, anon;
grant execute on function public.listar_usuarios() to authenticated;
