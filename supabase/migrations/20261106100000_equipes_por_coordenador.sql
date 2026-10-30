-- Equipes (logins dono_time) separadas por coordenador: cada coordenador só enxerga e só
-- vincula as equipes que ele mesmo cadastrou ou que já são de times das ligas dele.
-- O Admin (master) continua vendo e vinculando todas.

alter table public.profiles add column criado_por uuid references public.profiles (id) on delete set null;

comment on column public.profiles.criado_por is
  'Quem cadastrou o usuário (preenchido pela Edge Function admin-users).';

create or replace function public.equipe_visivel_ao_coordenador(p_equipe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_master() or exists (
    select 1 from public.profiles p
    where p.id = p_equipe_id
      and p.papel = 'dono_time'
      and (
        p.criado_por = auth.uid()
        or exists (
          select 1 from public.times t
          where t.dono_id = p.id and public.is_admin_da_competicao(t.competicao_id)
        )
      )
  );
$$;

revoke all on function public.equipe_visivel_ao_coordenador(uuid) from public, anon;
grant execute on function public.equipe_visivel_ao_coordenador(uuid) to authenticated;

drop policy "profiles_select_admin_ve_donos" on public.profiles;
create policy "profiles_select_admin_ve_donos"
  on public.profiles for select
  to authenticated
  using (papel = 'dono_time' and public.is_admin() and public.equipe_visivel_ao_coordenador(id));

-- Vincular um time a uma equipe exige que ela seja visível para quem está vinculando.
create or replace function public.validar_equipe_do_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.dono_id is not null
     and (tg_op = 'INSERT' or new.dono_id is distinct from old.dono_id)
     and auth.uid() is not null
     and not public.equipe_visivel_ao_coordenador(new.dono_id) then
    raise exception 'Escolha uma equipe cadastrada por você ou já ligada à sua liga.';
  end if;
  return new;
end;
$$;

create trigger validar_equipe_do_time before insert or update of dono_id on public.times
  for each row execute function public.validar_equipe_do_time();
