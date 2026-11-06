-- Súmula ao vivo (6.5.1): no máximo 12 jogadores de cada time na escalação.
create or replace function public.mesa_escalar(p_jogo_id uuid, p_escalados uuid[], p_oficiais jsonb default '{}'::jsonb, p_token text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
  j public.jogos%rowtype;
  lista uuid[] := array(select distinct unnest(coalesce(p_escalados, '{}')));
begin
  m := public.mesa_para_lancar(p_jogo_id, p_token);
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
    select 1 from public.jogadores a where a.id = any (lista)
    group by a.time_id having count(*) > 12
  ) then
    raise exception 'Cada time pode ter no máximo 12 jogadores na escalação.';
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
