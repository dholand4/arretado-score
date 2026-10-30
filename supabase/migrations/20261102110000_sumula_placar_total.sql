-- Súmula completa com placar total informado (pedido do organizador): o admin digita o total de
-- cada time e divide entre os jogadores só o que quiser. O placar vem do total; os pontos divididos
-- entram nos rankings. Sem p_casa/p_fora, o placar continua sendo a soma da categoria de placar.

create or replace function public.registrar_resultado_jogo(p_jogo_id uuid, p_modo text, p_casa int default null, p_fora int default null, p_ausente text default null, p_jogadores jsonb default '[]'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  j public.jogos%rowtype; c public.competicoes%rowtype; f public.fases%rowtype;
  item jsonb; valor record; atleta public.jogadores%rowtype; categoria public.categorias_estatistica%rowtype;
  casa int := 0; fora int := 0; pontos int; vencedor uuid;
begin
  select * into j from public.jogos where id = p_jogo_id for update;
  if not found or not public.is_admin_da_competicao(j.competicao_id) then raise exception 'Sem permissão para lançar este resultado.'; end if;
  select * into c from public.competicoes where id = j.competicao_id for update;
  select * into f from public.fases where id = j.fase_id;
  if j.status = 'cancelado' then raise exception 'Jogo cancelado não recebe súmula.'; end if;
  if j.status in ('encerrado', 'wo') and f.status = 'concluida' and not public.is_master() and exists (
    select 1 from public.fases seguinte join public.jogos jogo on jogo.fase_id = seguinte.id
    where seguinte.competicao_id = f.competicao_id and seguinte.ordem = f.ordem + 1 and jogo.status in ('encerrado', 'wo')
  ) then raise exception 'Só o master pode editar: a fase seguinte já tem jogo encerrado.'; end if;
  if p_modo not in ('completa', 'placar', 'wo') or p_modo is null then raise exception 'Modo de resultado inválido.'; end if;
  delete from public.sumula_estatisticas where jogo_id = j.id;
  delete from public.jogo_jogadores where jogo_id = j.id;
  if p_modo = 'completa' then
    if jsonb_typeof(p_jogadores) <> 'array' then raise exception 'Lista de jogadores inválida.'; end if;
    if (select count(*) from public.categorias_estatistica where competicao_id = j.competicao_id and ativa and soma_no_placar) <> 1 then raise exception 'É necessária uma categoria de placar ativa.'; end if;
    for item in select value from jsonb_array_elements(p_jogadores) loop
      select * into atleta from public.jogadores where id = (item->>'jogador_id')::uuid and ativo and time_id in (j.time_casa_id, j.time_fora_id);
      if not found then raise exception 'Jogador inválido ou inativo.'; end if;
      insert into public.jogo_jogadores(jogo_id, jogador_id, time_id) values (j.id, atleta.id, atleta.time_id);
      if jsonb_typeof(item->'valores') <> 'object' then raise exception 'Estatísticas inválidas.'; end if;
      for valor in select * from jsonb_each_text(item->'valores') loop
        select * into categoria from public.categorias_estatistica where id = valor.key::uuid and competicao_id = j.competicao_id and ativa;
        if not found or valor.value !~ '^[0-9]+$' then raise exception 'Categoria ou valor inválido.'; end if;
        pontos := valor.value::int;
        insert into public.sumula_estatisticas(jogo_id, jogador_id, time_id, categoria_id, valor) values (j.id, atleta.id, atleta.time_id, categoria.id, pontos);
        if categoria.soma_no_placar then
          if atleta.time_id = j.time_casa_id then casa := casa + pontos; else fora := fora + pontos; end if;
        end if;
      end loop;
    end loop;
    -- Placar total informado: os pontos por jogador viram detalhe opcional e não podem passar do total.
    if p_casa is not null or p_fora is not null then
      if p_casa is null or p_fora is null or p_casa < 0 or p_fora < 0 then raise exception 'Informe o placar total dos dois times.'; end if;
      if casa > p_casa or fora > p_fora then raise exception 'Os pontos lançados por jogador passam do placar total informado.'; end if;
      casa := p_casa; fora := p_fora;
    end if;
  elsif p_modo = 'placar' then
    if p_casa is null or p_fora is null or p_casa < 0 or p_fora < 0 then raise exception 'Informe placares não negativos.'; end if;
    casa := p_casa; fora := p_fora;
  else
    if p_ausente is null or p_ausente not in ('casa','fora','ambos') then raise exception 'Informe quem faltou.'; end if;
    if p_ausente = 'casa' then casa := c.wo_placar_perdedor; fora := c.wo_placar_vencedor;
    elsif p_ausente = 'fora' then casa := c.wo_placar_vencedor; fora := c.wo_placar_perdedor;
    end if;
  end if;
  if p_modo <> 'wo' and casa = fora and (not c.permite_empate or f.tipo = 'mata_mata') then raise exception 'Empate não é permitido neste jogo.'; end if;
  if p_modo = 'wo' then
    vencedor := case p_ausente when 'casa' then j.time_fora_id when 'fora' then j.time_casa_id else null end;
  else vencedor := case when casa > fora then j.time_casa_id when fora > casa then j.time_fora_id else null end; end if;
  update public.jogos set status = case when p_modo = 'wo' then 'wo' else 'encerrado' end,
    placar_casa = casa, placar_fora = fora, vencedor_id = vencedor,
    wo_ausente = case when p_modo = 'wo' then p_ausente else null end, so_placar = p_modo = 'placar' where id = j.id;
  update public.competicoes set estrutura_travada = true where id = j.competicao_id and not estrutura_travada;
  perform public.pos_resultado_jogo(j.id);
end $$;
