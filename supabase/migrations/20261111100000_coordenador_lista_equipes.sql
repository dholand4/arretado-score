-- O coordenador também abre a tela de Usuários, mas só vê os logins das equipes que ele
-- enxerga (cadastradas por ele ou de times das ligas dele, ver equipe_visivel_ao_coordenador).
-- O Admin (master) continua vendo todos.

create or replace function public.listar_usuarios()
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
  if not (public.is_master() or public.is_admin()) then
    raise exception 'Apenas o Admin e os coordenadores podem listar usuários.'
      using errcode = '42501';
  end if;

  return query
    select p.id, p.nome, u.email::text, p.telefone, p.papel, p.ativo, p.precisa_trocar_senha,
           p.created_at, u.last_sign_in_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where public.is_master()
       or (p.papel = 'dono_time' and public.equipe_visivel_ao_coordenador(p.id))
    order by p.nome;
end;
$$;

revoke all on function public.listar_usuarios() from public, anon;
grant execute on function public.listar_usuarios() to authenticated;
