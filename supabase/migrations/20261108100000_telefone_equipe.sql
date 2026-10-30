-- Telefone (WhatsApp) de contato do usuário, usado sobretudo para falar com as equipes.
-- Só dígitos, com DDD (e opcionalmente o 55). Visível ao próprio usuário, ao Admin e ao
-- coordenador que enxerga a equipe (mesmas policies de profiles); o público não vê.

alter table public.profiles
  add column telefone text check (telefone ~ '^[0-9]{10,13}$');

comment on column public.profiles.telefone is
  'Telefone/WhatsApp de contato, só dígitos com DDD (preenchido pela Edge Function admin-users).';

grant select (telefone) on public.profiles to authenticated;

drop function public.listar_usuarios();

create function public.listar_usuarios()
returns table (
  id uuid,
  nome text,
  email text,
  telefone text,
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
    select p.id, p.nome, u.email::text, p.telefone, p.papel, p.ativo, p.precisa_trocar_senha,
           p.created_at, u.last_sign_in_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.nome;
end;
$$;

revoke all on function public.listar_usuarios() from public, anon;
grant execute on function public.listar_usuarios() to authenticated;
