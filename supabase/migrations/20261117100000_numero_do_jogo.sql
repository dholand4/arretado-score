-- Número do jogo na competição (seção 6.2, item 8): "Jogo 1" é o primeiro jogo marcado num dia de jogos
-- e a contagem segue pelos dias seguintes, sem recomeçar a cada dia. Ordem: dias publicados antes dos
-- rascunhos (o público nunca vê buraco na numeração), depois data, hora de início e a ordem no dia.
-- Jogo sem dia ou cancelado não tem número. Campo calculado do PostgREST: selecione "numero" em jogos.
create function public.numero(j public.jogos)
returns int language sql stable set search_path = '' as $$
  select t.n::int from (
    select x.id, row_number() over (
      order by (e.status <> 'publicado'), e.data, e.hora_inicio, e.created_at, e.id, x.ordem_no_evento, x.id
    ) as n
    from public.jogos x
    join public.eventos e on e.id = x.evento_id
    where x.competicao_id = j.competicao_id and x.status <> 'cancelado'
  ) t
  where t.id = j.id
$$;

comment on function public.numero(public.jogos) is
  'Número do jogo na competição ("Jogo N"), pela ordem dos dias de jogos. Nulo sem dia ou cancelado.';
