-- Categoria preenchida pela súmula ao vivo (seções 3 e 6.5.1): conta quantos lances de +1, +2 ou +3
-- cada jogador converteu (ex.: "Cestas de 3"). Nulo = digitada na súmula normal.

alter table public.categorias_estatistica
  add column conta_cestas_de int check (conta_cestas_de in (1, 2, 3)),
  add constraint categorias_estatistica_placar_sem_cestas check (not (soma_no_placar and conta_cestas_de is not null));

create unique index categorias_estatistica_cestas_unico
  on public.categorias_estatistica (competicao_id, conta_cestas_de) where conta_cestas_de is not null;

grant update (conta_cestas_de) on public.categorias_estatistica to authenticated;

-- Quantos lances (não anulados) do valor o jogador converteu no jogo.
create function public.cestas_do_jogador(p_jogo_id uuid, p_jogador_id uuid, p_valor int)
returns int language sql stable set search_path = '' as $$
  select count(*)::int from public.jogo_lances l
  where l.jogo_id = p_jogo_id and l.jogador_id = p_jogador_id and l.tipo = 'ponto'
    and l.valor = p_valor and not l.anulado
$$;

-- Ao criar a categoria (ou passar a contar cestas), preenche os jogos já encerrados pela súmula ao vivo.
-- Valor já lançado na súmula normal não é sobrescrito.
create function public.handle_categoria_cestas()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.conta_cestas_de is null or not new.ativa then return new; end if;
  if tg_op = 'UPDATE' and old.conta_cestas_de is not distinct from new.conta_cestas_de and old.ativa then
    return new;
  end if;
  insert into public.sumula_estatisticas (jogo_id, jogador_id, time_id, categoria_id, valor)
  select jj.jogo_id, jj.jogador_id, jj.time_id, new.id, c.qtd
  from public.jogo_mesa m
  join public.jogos j on j.id = m.jogo_id and j.status = 'encerrado' and not j.so_placar
  join public.jogo_jogadores jj on jj.jogo_id = m.jogo_id
  cross join lateral (select public.cestas_do_jogador(jj.jogo_id, jj.jogador_id, new.conta_cestas_de) as qtd) c
  where m.competicao_id = new.competicao_id and m.status = 'encerrada' and c.qtd > 0
  on conflict (jogo_id, jogador_id, categoria_id) do nothing;
  return new;
end $$;

create trigger on_categoria_cestas
  after insert or update of conta_cestas_de, ativa on public.categorias_estatistica
  for each row execute function public.handle_categoria_cestas();

-- Encerra (coordenador operando) ou aprova (jogo encerrado pelo mesário): grava a súmula com a presença
-- dos escalados, os pontos na categoria de placar e as categorias que contam cestas; os links do jogo
-- deixam de valer.
create or replace function public.mesa_encerrar(p_jogo_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
  categoria uuid;
  jogadores jsonb;
begin
  m := public.mesa_do_coordenador(p_jogo_id);
  select id into categoria from public.categorias_estatistica
    where competicao_id = m.competicao_id and ativa and soma_no_placar;
  if categoria is null then raise exception 'É necessária uma categoria de placar ativa.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'jogador_id', e.id,
      'valores', jsonb_build_object(categoria::text, coalesce((
        select sum(l.valor) from public.jogo_lances l
        where l.jogo_id = p_jogo_id and l.jogador_id = e.id and l.tipo = 'ponto' and not l.anulado
      ), 0)) || coalesce((
        select jsonb_object_agg(ce.id::text, public.cestas_do_jogador(p_jogo_id, e.id, ce.conta_cestas_de))
        from public.categorias_estatistica ce
        where ce.competicao_id = m.competicao_id and ce.ativa and ce.conta_cestas_de is not null
      ), '{}'::jsonb)
    )), '[]'::jsonb)
    into jogadores
    from unnest(m.escalados) as e(id);
  update public.jogo_mesa set status = 'encerrada', encerrada_em = coalesce(encerrada_em, now()), relogio_rodando = false
    where jogo_id = p_jogo_id;
  update public.mesa_links set revogado_em = now() where jogo_id = p_jogo_id and revogado_em is null;
  perform public.registrar_resultado_jogo(p_jogo_id, 'completa', null, null, null, jogadores);
end $$;
