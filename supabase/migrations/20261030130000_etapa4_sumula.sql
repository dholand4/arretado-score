-- Resultados só podem ser gravados pelas RPCs desta etapa.
create function public.proteger_resultado_jogo() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') and (
    (tg_op = 'INSERT' and (new.status in ('encerrado', 'wo') or new.placar_casa is not null or new.placar_fora is not null or new.vencedor_id is not null or new.wo_ausente is not null or new.so_placar)) or
    (tg_op = 'UPDATE' and (new.status in ('encerrado', 'wo') or old.status in ('encerrado', 'wo') or
      (new.placar_casa, new.placar_fora, new.vencedor_id, new.wo_ausente, new.so_placar) is distinct from
      (old.placar_casa, old.placar_fora, old.vencedor_id, old.wo_ausente, old.so_placar)))
  ) then raise exception 'O resultado deve ser gravado pela súmula.'; end if;
  return new;
end $$;
create trigger proteger_resultado before insert or update on public.jogos for each row execute function public.proteger_resultado_jogo();

create function public.pos_resultado_jogo(p_jogo_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  -- implementada na Etapa 5: atualizar série e verificar avanço de fase — 6.5/6.6
  null;
end $$;
revoke all on function public.pos_resultado_jogo(uuid) from public, anon, authenticated;

-- Uma única operação faz a validação, substitui os dados e fecha o jogo.
-- p_jogadores: [{jogador_id, valores: {categoria_uuid: inteiro}}].
create function public.registrar_resultado_jogo(p_jogo_id uuid, p_modo text, p_casa int default null, p_fora int default null, p_ausente text default null, p_jogadores jsonb default '[]'::jsonb)
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
revoke all on function public.registrar_resultado_jogo(uuid,text,int,int,text,jsonb) from public, anon;
grant execute on function public.registrar_resultado_jogo(uuid,text,int,int,text,jsonb) to authenticated;

-- Ajuste só resolve empates técnicos; registra quem decidiu e quando.
create table public.ajustes_classificacao (
  id uuid primary key default gen_random_uuid(),
  fase_id uuid not null references public.fases on delete cascade,
  grupo_id uuid references public.grupos on delete cascade,
  time_id uuid not null references public.times on delete cascade,
  prioridade int not null check (prioridade > 0),
  registrado_por uuid not null references public.profiles,
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique nulls not distinct (fase_id, grupo_id, time_id)
);
alter table public.ajustes_classificacao enable row level security;
create policy ajustes_leitura on public.ajustes_classificacao for select to authenticated
  using (public.is_admin_da_competicao(public.competicao_da_fase(fase_id)));
revoke select on public.ajustes_classificacao from anon;
revoke insert, update, delete on public.ajustes_classificacao from anon, authenticated;

create table public.ajustes_classificacao_historico (
  id uuid primary key default gen_random_uuid(),
  fase_id uuid not null references public.fases on delete cascade,
  grupo_id uuid references public.grupos on delete cascade,
  time_id uuid not null references public.times on delete cascade,
  prioridade int,
  registrado_por uuid not null references public.profiles,
  created_at timestamptz not null default now()
);
alter table public.ajustes_classificacao_historico enable row level security;
create policy ajustes_historico_admin on public.ajustes_classificacao_historico for select to authenticated
  using (public.is_admin_da_competicao(public.competicao_da_fase(fase_id)));
revoke insert, update, delete on public.ajustes_classificacao_historico from anon, authenticated;
revoke select on public.ajustes_classificacao_historico from anon;

create function public.ajustar_classificacao(p_fase_id uuid, p_grupo_id uuid default null, p_time_id uuid default null, p_prioridade int default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin_da_competicao(public.competicao_da_fase(p_fase_id)) then raise exception 'Sem permissão para ajustar a classificação.'; end if;
  if not exists (select 1 from public.v_classificacao where fase_id = p_fase_id and grupo_id is not distinct from p_grupo_id and time_id = p_time_id) then raise exception 'Time não pertence à classificação.'; end if;
  insert into public.ajustes_classificacao_historico(fase_id, grupo_id, time_id, prioridade, registrado_por) values (p_fase_id, p_grupo_id, p_time_id, p_prioridade, auth.uid());
  if p_prioridade is null then
    delete from public.ajustes_classificacao where fase_id = p_fase_id and grupo_id is not distinct from p_grupo_id and time_id = p_time_id;
  else
    insert into public.ajustes_classificacao(fase_id, grupo_id, time_id, prioridade, registrado_por)
      values(p_fase_id, p_grupo_id, p_time_id, p_prioridade, auth.uid())
      on conflict (fase_id, grupo_id, time_id) do update set prioridade = excluded.prioridade, registrado_por = excluded.registrado_por, atualizado_em = now();
  end if;
end $$;
revoke all on function public.ajustar_classificacao(uuid,uuid,uuid,int) from public, anon;
grant execute on function public.ajustar_classificacao(uuid,uuid,uuid,int) to authenticated;

-- Desempata recursivamente: quando o confronto direto separa parte do grupo,
-- recomeça a cadeia para cada subgrupo que permaneceu empatado.
create function public.desempatar_grupo(p_fase uuid, p_grupo uuid, p_times uuid[], p_indice int)
returns table(time_id uuid, empate_tecnico boolean)
language plpgsql stable security definer set search_path = '' as $$
declare criterios jsonb; criterio text; parte record; partes int; proximo int;
begin
  select c.criterios_desempate into criterios from public.fases f join public.competicoes c on c.id = f.competicao_id where f.id = p_fase;
  if cardinality(p_times) <= 1 then return query select unnest(p_times), false; return; end if;
  if p_indice >= jsonb_array_length(criterios) then
    return query select t.id, true from public.times t
      left join public.ajustes_classificacao a on a.fase_id = p_fase and a.grupo_id is not distinct from p_grupo and a.time_id = t.id
      where t.id = any(p_times) order by a.prioridade nulls last, t.nome, t.id;
    return;
  end if;
  criterio := criterios->>p_indice;
  -- Pontos e saldo do confronto são calculados apenas entre os times deste subgrupo.
  for parte in
    with direto as (
      select x.time_id,
        sum(case when j.vencedor_id = x.time_id then c.pontos_vitoria
                 when j.status = 'wo' and x.ausente then c.pontos_derrota_wo
                 when j.status = 'encerrado' and j.vencedor_id is null then c.pontos_empate
                 else c.pontos_derrota end)::int pts,
        sum(x.pf - x.pc)::int saldo
      from public.jogos j join public.competicoes c on c.id = j.competicao_id
      cross join lateral (values
        (j.time_casa_id,j.placar_casa,j.placar_fora,coalesce(j.wo_ausente in ('casa','ambos'),false)),
        (j.time_fora_id,j.placar_fora,j.placar_casa,coalesce(j.wo_ausente in ('fora','ambos'),false))
        ) x(time_id,pf,pc,ausente)
      where j.fase_id = p_fase and j.grupo_id is not distinct from p_grupo and j.serie_id is null
        and j.status in ('encerrado','wo') and j.time_casa_id = any(p_times) and j.time_fora_id = any(p_times)
      group by x.time_id
    ), valores as (
      select v.time_id,
        case criterio when 'confronto_direto' then coalesce(d.pts,0) when 'saldo' then v.saldo when 'pontos_pro' then v.pf when 'vitorias' then v.v else 0 end a,
        case when criterio = 'confronto_direto' then coalesce(d.saldo,0) else 0 end b
      from public.v_classificacao v left join direto d on d.time_id = v.time_id
      where v.fase_id = p_fase and v.grupo_id is not distinct from p_grupo and v.time_id = any(p_times)
    )
    select array_agg(valores.time_id) ids, count(*) over () total from valores group by a,b order by a desc,b desc
  loop
    partes := parte.total;
    proximo := case when criterio = 'confronto_direto' and partes > 1 then 0 else p_indice + 1 end;
    return query select d.time_id, d.empate_tecnico from public.desempatar_grupo(p_fase,p_grupo,parte.ids,proximo) d;
  end loop;
end $$;
revoke all on function public.desempatar_grupo(uuid,uuid,uuid[],int) from public, anon, authenticated;

create function public.classificacao_ordenada(p_fase_id uuid, p_grupo_id uuid default null)
returns table(posicao bigint, time_id uuid, nome text, j int, v int, e int, d int, wo int, pts int, pf int, pc int, saldo int, aproveitamento numeric, empate_tecnico boolean)
language plpgsql stable security definer set search_path = '' as $$
declare bloco record; resultado record; n bigint := 0;
begin
  if not (public.competicao_publica(public.competicao_da_fase(p_fase_id)) or public.is_admin_da_competicao(public.competicao_da_fase(p_fase_id))) then return; end if;
  for bloco in select array_agg(vc.time_id) ids from public.v_classificacao vc where vc.fase_id = p_fase_id and vc.grupo_id is not distinct from p_grupo_id group by vc.pts order by vc.pts desc loop
    for resultado in select * from public.desempatar_grupo(p_fase_id,p_grupo_id,bloco.ids,0) loop
      n := n + 1;
      return query select n, vc.time_id, t.nome, vc.j, vc.v, vc.e, vc.d, vc.wo, vc.pts, vc.pf, vc.pc, vc.saldo, vc.aproveitamento, resultado.empate_tecnico
        from public.v_classificacao vc join public.times t on t.id = vc.time_id where vc.fase_id = p_fase_id and vc.grupo_id is not distinct from p_grupo_id and vc.time_id = resultado.time_id;
    end loop;
  end loop;
end $$;
revoke all on function public.classificacao_ordenada(uuid,uuid) from public;
grant execute on function public.classificacao_ordenada(uuid,uuid) to anon, authenticated;

create function public.melhores_extras(p_fase_id uuid, p_posicao int)
returns table(posicao bigint, grupo_id uuid, time_id uuid, nome text, pts int, aproveitamento numeric, saldo int, pf int)
language sql stable security definer set search_path = '' as $$
  select row_number() over (order by c.pts desc, c.aproveitamento desc, c.saldo desc, c.pf desc, c.nome, c.time_id), g.id, c.time_id, c.nome, c.pts, c.aproveitamento, c.saldo, c.pf
  from public.grupos g cross join lateral public.classificacao_ordenada(p_fase_id,g.id) c
  where g.fase_id = p_fase_id and c.posicao = p_posicao
  order by c.pts desc, c.aproveitamento desc, c.saldo desc, c.pf desc, c.nome, c.time_id;
$$;
revoke all on function public.melhores_extras(uuid,int) from public;
grant execute on function public.melhores_extras(uuid,int) to anon, authenticated;
