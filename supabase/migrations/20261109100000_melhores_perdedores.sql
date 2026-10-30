-- Mata-mata com melhores perdedores (repescagem).
-- Quando os vencedores de uma fase de mata-mata não fecham a próxima (ex.: 6 times → 3 séries → 3 vencedores),
-- a fase pode levar adiante também os N melhores perdedores (coluna melhores_extras, que nos grupos já
-- significa "melhores N-ésimos colocados"). A fase ganha uma tabela própria (classificacao_mata_mata):
--   1. vencedores das séries, na ordem da campanha anterior;
--   2. perdedores: quem perdeu algum jogo por W.O. fica atrás; depois vitórias na série, saldo na série,
--      pontos marcados na série e a campanha anterior.
-- A fase seguinte usa essa tabela: "por campanha" cruza 1º x último, 2º x penúltimo… (os melhores
-- perdedores entram sempre depois dos vencedores), e "manual" ganha a origem "melhor perdedor".

comment on column public.fases.melhores_extras is
  'Grupos: quantos melhores N-ésimos colocados também avançam. Mata-mata: quantos melhores perdedores também avançam (repescagem).';

-- Quantos times saem de uma fase (mata-mata: vencedores + melhores perdedores).
CREATE OR REPLACE FUNCTION public.qtd_classificados_fase(p_tipo text, p_classificam integer, p_qtd_grupos integer, p_melhores_extras integer, p_qtd_series integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case p_tipo
    when 'todos_contra_todos' then p_classificam
    when 'grupos' then p_classificam * p_qtd_grupos + coalesce(p_melhores_extras, 0)
    else p_qtd_series + coalesce(p_melhores_extras, 0)
  end;
$function$;


-- Tabela de uma fase de mata-mata: vencedores primeiro (pela campanha anterior), depois os times com a
-- série em andamento e por fim os perdedores pelos critérios da repescagem. Os primeiros perdedores, até
-- melhores_extras, ficam com situacao 'repescagem' (provisório enquanto houver série em andamento).
create function public.classificacao_mata_mata(p_fase_id uuid)
returns table (
  posicao bigint, time_id uuid, nome text, serie text, situacao text,
  vitorias int, derrotas int, jogos int, pf int, pc int, saldo int, perdeu_wo boolean, campanha bigint, classificado boolean
)
language plpgsql stable security definer set search_path = '' as $$
declare f public.fases%rowtype;
begin
  select * into f from public.fases where id = p_fase_id;
  if f.id is null or f.tipo <> 'mata_mata' then return; end if;
  if not (public.competicao_publica(f.competicao_id) or public.is_admin_da_competicao(f.competicao_id)) then return; end if;
  return query
  with serie as (
    -- Séries de 3º lugar do formato antigo (perdedores de séries desta mesma fase) ficam de fora.
    select s.* from public.series s
    where s.fase_id = f.id and s.time_a_id is not null and s.time_b_id is not null
      and coalesce(s.origem_a ->> 'serie', '') not in (select s2.codigo from public.series s2 where s2.fase_id = f.id)
  ), lado as (
    select s.id as serie_id, s.codigo, s.vencedor_id, x.time_id
    from serie s cross join lateral (values (s.time_a_id), (s.time_b_id)) x (time_id)
  ), numeros as (
    select l.serie_id, l.codigo, l.vencedor_id, l.time_id,
      (count(*) filter (where j.vencedor_id = l.time_id))::int as v,
      (count(*) filter (where j.vencedor_id is not null and j.vencedor_id <> l.time_id))::int as d,
      count(j.id)::int as qtd,
      coalesce(sum(case when j.time_casa_id = l.time_id then j.placar_casa else j.placar_fora end), 0)::int as pontos_pro,
      coalesce(sum(case when j.time_casa_id = l.time_id then j.placar_fora else j.placar_casa end), 0)::int as pontos_contra,
      coalesce(bool_or(j.status = 'wo' and j.vencedor_id is distinct from l.time_id), false) as wo
    from lado l
    left join public.jogos j on j.serie_id = l.serie_id and j.status in ('encerrado', 'wo')
    group by l.serie_id, l.codigo, l.vencedor_id, l.time_id
  ), base as (
    select n.*, t.nome as time_nome,
      case when n.vencedor_id is null then 1 when n.vencedor_id = n.time_id then 0 else 2 end as grupo,
      c.posicao as c_posicao, c.pts as c_pts, c.aproveitamento as c_aprov, c.saldo as c_saldo, c.pf as c_pf
    from numeros n
    join public.times t on t.id = n.time_id
    left join lateral public.campanha_do_time(f.competicao_id, f.ordem, n.time_id) c on true
  ), ordenada as (
    select b.*,
      row_number() over (order by b.grupo,
        case when b.grupo = 2 then b.wo::int end,
        case when b.grupo = 2 then -b.v end,
        case when b.grupo = 2 then -(b.pontos_pro - b.pontos_contra) end,
        case when b.grupo = 2 then -b.pontos_pro end,
        coalesce(b.c_posicao, 9223372036854775807), -coalesce(b.c_pts, 0), -coalesce(b.c_aprov, 0),
        -coalesce(b.c_saldo, 0), -coalesce(b.c_pf, 0), b.time_nome, b.time_id) as pos
    from base b
  ), final as (
    select o.*, case when o.grupo = 2 then row_number() over (partition by o.grupo order by o.pos) end as pos_perdedor
    from ordenada o
  )
  select fi.pos, fi.time_id, fi.time_nome, fi.codigo,
    case fi.grupo when 0 then 'venceu' when 1 then 'em_disputa'
      else case when fi.pos_perdedor <= f.melhores_extras then 'repescagem' else 'eliminado' end end,
    fi.v, fi.d, fi.qtd, fi.pontos_pro, fi.pontos_contra, fi.pontos_pro - fi.pontos_contra, fi.wo, fi.c_posicao,
    fi.grupo = 0 or (fi.grupo = 2 and fi.pos_perdedor <= f.melhores_extras)
  from final fi
  order by fi.pos;
end $$;

comment on function public.classificacao_mata_mata(uuid) is
  'Tabela de uma fase de mata-mata: vencedores pela campanha anterior e perdedores pelos critérios da repescagem.';

revoke all on function public.classificacao_mata_mata(uuid) from public;
grant execute on function public.classificacao_mata_mata(uuid) to anon, authenticated, service_role;

-- Origens "posicao" de um mata-mata (tabela da fase) e "melhor_perdedor" (N-ésimo melhor perdedor).
CREATE OR REPLACE FUNCTION public.resolver_origem_serie(p_competicao uuid, p_origem jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare f public.fases%rowtype; s public.series%rowtype; resultado uuid; g uuid; pos int;
begin
  if p_origem is null then return null; end if;
  if p_origem->>'tipo' in ('vencedor','perdedor') then
    select s1.* into s from public.series s1 join public.fases f1 on f1.id=s1.fase_id
      where f1.competicao_id=p_competicao and s1.codigo=p_origem->>'serie' and s1.status='concluida'
      order by f1.ordem desc limit 1;
    if s.id is null then return null; end if;
    return case when p_origem->>'tipo'='vencedor' then s.vencedor_id
      when s.vencedor_id=s.time_a_id then s.time_b_id else s.time_a_id end;
  end if;
  select * into f from public.fases where competicao_id=p_competicao and ordem=(p_origem->>'fase_ordem')::int and status='concluida';
  if f.id is null then return null; end if;
  pos := (p_origem->>'posicao')::int;
  -- Mata-mata com melhores perdedores: posição na tabela da fase ou o N-ésimo melhor perdedor.
  if f.tipo = 'mata_mata' and p_origem->>'tipo' = 'posicao' then
    select c.time_id into resultado from public.classificacao_mata_mata(f.id) c where c.posicao = pos and c.classificado;
    return resultado;
  elsif f.tipo = 'mata_mata' and p_origem->>'tipo' = 'melhor_perdedor' then
    select x.time_id into resultado from (
      select c.time_id, row_number() over (order by c.posicao) n from public.classificacao_mata_mata(f.id) c where c.situacao = 'repescagem'
    ) x where x.n = pos;
    return resultado;
  end if;
  if p_origem->>'tipo' = 'posicao_grupo' then
    select id into g from public.grupos where fase_id=f.id and nome=p_origem->>'grupo';
    select c.time_id into resultado from public.classificacao_ordenada(f.id,g) c where c.posicao=pos;
  elsif p_origem->>'tipo' = 'posicao' and f.tipo <> 'grupos' then
    select c.time_id into resultado from public.classificacao_ordenada(f.id,null) c where c.posicao=pos;
  elsif p_origem->>'tipo' = 'posicao' and f.tipo = 'grupos' then
    -- Campanha geral: primeiro a posição no grupo, depois a comparação da seção 6.3.
    select x.time_id into resultado from (
      select c.time_id, row_number() over (order by c.posicao, c.pts desc, c.aproveitamento desc, c.saldo desc, c.pf desc, c.nome, c.time_id) n
      from public.grupos gr cross join lateral public.classificacao_ordenada(f.id,gr.id) c
      where gr.fase_id=f.id and (c.posicao <= f.classificam or c.time_id in (
        select e.time_id from public.melhores_extras(f.id,f.classificam+1) e where e.posicao<=f.melhores_extras))
    ) x where x.n=pos;
  elsif p_origem->>'tipo' = 'melhor_extra' then
    select e.time_id into resultado from public.melhores_extras(f.id,coalesce((p_origem->>'colocacao')::int,f.classificam+1)) e
      where e.posicao=pos and e.posicao<=f.melhores_extras;
  else raise exception 'Origem de série inválida: %', p_origem;
  end if;
  return resultado;
end $function$;

-- Confrontos manuais: depois de um mata-mata com melhores perdedores, eles também são origens.
CREATE OR REPLACE FUNCTION public.origens_disponiveis_fase(p_fase_ordem integer, p_tipo text, p_classificam integer, p_qtd_grupos integer, p_melhores_extras integer, p_codigos text[])
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select coalesce(jsonb_agg(o order by ord), '[]'::jsonb)
  from (
    select jsonb_build_object('tipo', 'posicao', 'fase_ordem', p_fase_ordem, 'posicao', k) as o, k as ord
    from generate_series(1, coalesce(p_classificam, 0)) k
    where p_tipo = 'todos_contra_todos'
    union all
    select jsonb_build_object('tipo', 'posicao_grupo', 'fase_ordem', p_fase_ordem, 'grupo', chr(64 + g), 'posicao', k),
           k * 1000 + g
    from generate_series(1, coalesce(p_classificam, 0)) k, generate_series(1, coalesce(p_qtd_grupos, 0)) g
    where p_tipo = 'grupos'
    union all
    select jsonb_build_object('tipo', 'melhor_extra', 'fase_ordem', p_fase_ordem, 'posicao', k), 1000000 + k
    from generate_series(1, coalesce(p_melhores_extras, 0)) k
    where p_tipo = 'grupos'
    union all
    select jsonb_build_object('tipo', 'vencedor', 'serie', c), i
    from unnest(coalesce(p_codigos, '{}'::text[])) with ordinality as x (c, i)
    where p_tipo = 'mata_mata'
    union all
    select jsonb_build_object('tipo', 'melhor_perdedor', 'fase_ordem', p_fase_ordem, 'posicao', k), 1000000 + k
    from generate_series(1, coalesce(p_melhores_extras, 0)) k
    where p_tipo = 'mata_mata'
  ) s;
$function$;

-- Mando: melhor perdedor nunca recebe o mando contra um vencedor.
CREATE OR REPLACE FUNCTION public.preencher_series_fase(p_fase_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.fases%rowtype; s public.series%rowtype; a uuid; b uuid; troca uuid; mudou boolean; semeada boolean;
begin
 select * into p from public.fases where id=p_fase_id for update;
 if not exists(select 1 from public.series where fase_id=p.id) then
   raise exception 'A fase "%" não possui séries configuradas.', p.nome;
 end if;
 for s in select ss.* from public.series ss where ss.fase_id=p.id order by public.numero_serie(ss.codigo), ss.codigo for update loop
   a:=public.resolver_origem_serie(p.competicao_id,s.origem_a); b:=public.resolver_origem_serie(p.competicao_id,s.origem_b);
   if a is null or b is null or a=b then raise exception 'Não foi possível resolver as origens da série %.', s.codigo; end if;
   -- Melhor perdedor nunca fica com o mando contra um vencedor; posições da tabela de um mata-mata
   -- já vêm na ordem certa (vencedores antes dos melhores perdedores).
   semeada := (s.origem_a->>'tipo' = 'posicao' and exists (select 1 from public.fases ff where ff.competicao_id = p.competicao_id
       and ff.ordem = (s.origem_a->>'fase_ordem')::int and ff.tipo = 'mata_mata'))
     or (s.origem_b->>'tipo' = 'melhor_perdedor' and s.origem_a->>'tipo' is distinct from 'melhor_perdedor');
   if s.origem_a->>'tipo' = 'melhor_perdedor' and s.origem_b->>'tipo' is distinct from 'melhor_perdedor' then
     troca:=a; a:=b; b:=troca;
   elsif semeada then
     null;
   -- A campanha precede a ordem das origens; sem classificação usa nome e ID.
   elsif (select row(coalesce(c.posicao,9223372036854775807),-coalesce(c.pts,0),-coalesce(c.aproveitamento,0),-coalesce(c.saldo,0),-coalesce(c.pf,0),t.nome,t.id)
       from public.times t left join lateral public.campanha_do_time(p.competicao_id,p.ordem,t.id) c on true where t.id=a)
      > (select row(coalesce(c.posicao,9223372036854775807),-coalesce(c.pts,0),-coalesce(c.aproveitamento,0),-coalesce(c.saldo,0),-coalesce(c.pf,0),t.nome,t.id)
       from public.times t left join lateral public.campanha_do_time(p.competicao_id,p.ordem,t.id) c on true where t.id=b) then troca:=a; a:=b; b:=troca; end if;
   mudou := (s.time_a_id,s.time_b_id) is distinct from (a,b);
   if mudou then
     if exists(select 1 from public.jogos jj join public.fases ff on ff.id=jj.fase_id where ff.competicao_id=p.competicao_id and ff.ordem>=p.ordem and jj.status in ('encerrado','wo')) then
       raise exception 'A edição mudaria confrontos com resultados posteriores; ajuste-os antes.';
     end if;
     delete from public.jogos where serie_id=s.id and status in ('pendente','agendado');
     update public.series set time_a_id=a,time_b_id=b,vitorias_a=0,vitorias_b=0,vencedor_id=null,status='em_andamento' where id=s.id;
   end if;
   if not exists(select 1 from public.jogos where serie_id=s.id) then
     insert into public.jogos(competicao_id,fase_id,serie_id,numero_na_serie,time_casa_id,time_fora_id) values(p.competicao_id,p.id,s.id,1,a,b);
   end if;
 end loop;
 if p.status='aguardando' then update public.fases set status='em_andamento' where id=p.id; end if;
end $function$;

-- Fase de pontos depois de um mata-mata recebe também os melhores perdedores.
CREATE OR REPLACE FUNCTION public.pos_resultado_jogo(p_jogo_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare j public.jogos%rowtype; f public.fases%rowtype; proxima public.fases%rowtype; s public.series%rowtype;
  va int; vb int; necessario int; numero int; concluida boolean; ids uuid[]; dependente uuid;
begin
 select * into j from public.jogos where id=p_jogo_id;
 if j.id is null or not public.is_admin_da_competicao(j.competicao_id) then raise exception 'Sem permissão para atualizar o resultado.'; end if;
 select * into f from public.fases where id=j.fase_id for update;
 if f.tipo='mata_mata' and j.status='wo' and j.vencedor_id is null then raise exception 'W.O. duplo não é permitido no mata-mata.'; end if;
 if j.serie_id is not null then
   select * into s from public.series where id=j.serie_id for update;
   select count(*) filter (where vencedor_id=s.time_a_id), count(*) filter (where vencedor_id=s.time_b_id)
     into va,vb from public.jogos where serie_id=s.id and status in ('encerrado','wo');
   necessario := (s.melhor_de+1)/2;
   if va>necessario or vb>necessario or (va>=necessario and vb>=necessario) or exists (
     select 1 from (select numero_na_serie,
       count(*) filter (where vencedor_id=s.time_a_id) over (order by numero_na_serie) ca,
       count(*) filter (where vencedor_id=s.time_b_id) over (order by numero_na_serie) cb,
       lead(numero_na_serie) over (order by numero_na_serie) seguinte
       from public.jogos where serie_id=s.id and status in ('encerrado','wo')) historico
     where seguinte is not null and (ca>=necessario or cb>=necessario)
   ) then
     raise exception 'A edição tornaria inconsistentes jogos já disputados da série.';
   end if;
   update public.series set vitorias_a=va,vitorias_b=vb,
     vencedor_id=case when va>=necessario then s.time_a_id when vb>=necessario then s.time_b_id else null end,
     status=case when va>=necessario or vb>=necessario then 'concluida' else 'em_andamento' end where id=s.id;
   if va>=necessario or vb>=necessario then
     delete from public.jogos where serie_id=s.id and status in ('pendente','agendado');
   elsif not exists(select 1 from public.jogos where serie_id=s.id and status in ('pendente','agendado')) then
     select coalesce(max(numero_na_serie),0)+1 into numero from public.jogos where serie_id=s.id;
     if numero>s.melhor_de then raise exception 'Não há número de jogo disponível nesta série.'; end if;
     insert into public.jogos(competicao_id,fase_id,serie_id,numero_na_serie,time_casa_id,time_fora_id)
       values(j.competicao_id,f.id,s.id,numero,case when numero%2=1 then s.time_a_id else s.time_b_id end,
         case when numero%2=1 then s.time_b_id else s.time_a_id end);
   end if;
 end if;
 -- Uma fase aguardando não avança por dados de teste ou configuração antecipada.
 if f.status='aguardando' then return; end if;
 if f.tipo='mata_mata' then
   select exists(select 1 from public.series where fase_id=f.id) and not exists(select 1 from public.series where fase_id=f.id and status<>'concluida') into concluida;
 else
   select exists(select 1 from public.jogos where fase_id=f.id) and not exists(select 1 from public.jogos where fase_id=f.id and status not in ('encerrado','wo','cancelado')) into concluida;
 end if;
 select * into proxima from public.fases where competicao_id=f.competicao_id and ordem>f.ordem order by ordem limit 1 for update;
 if not concluida then
   -- A fase deixou de estar concluída: desfaz as fases que dependem dela. Uma fase que tira os
   -- times de outra fase anterior a esta (ex.: final vinda da semifinal, depois do 3º lugar) não depende dela.
   if f.status='concluida' then
     if exists(select 1 from public.jogos jj join public.fases ff on ff.id=jj.fase_id where ff.competicao_id=f.competicao_id and ff.ordem>f.ordem
                 and not (ff.cruzamento='outra_fase' and ff.fase_origem<f.ordem) and jj.status in ('encerrado','wo')) then
       raise exception 'A edição desfaz uma fase e há resultados posteriores; ajuste-os antes.';
     end if;
     delete from public.jogos where status in ('pendente','agendado') and fase_id in (
       select id from public.fases where competicao_id=f.competicao_id and ordem>f.ordem and not (cruzamento='outra_fase' and fase_origem<f.ordem));
     update public.series set time_a_id=null,time_b_id=null,vitorias_a=0,vitorias_b=0,vencedor_id=null,status='aguardando' where fase_id in (
       select id from public.fases where competicao_id=f.competicao_id and ordem>f.ordem and not (cruzamento='outra_fase' and fase_origem<f.ordem));
     update public.fases set status='aguardando'
       where competicao_id=f.competicao_id and ordem>f.ordem and not (cruzamento='outra_fase' and fase_origem<f.ordem);
     update public.fases set status='em_andamento' where id=f.id;
     update public.competicoes set status='em_andamento' where id=f.competicao_id;
   end if;
   return;
 end if;
 update public.fases set status='concluida' where id=f.id;
 if proxima.id is not null then
   if proxima.tipo<>'mata_mata' then
     if f.status='concluida' and proxima.status<>'aguardando' then
       raise exception 'A edição de uma fase anterior a jogos de classificação já gerados requer revisão manual.';
     end if;
     if proxima.status='aguardando' then
       if f.tipo='todos_contra_todos' then select array_agg(c.time_id order by c.posicao) into ids from public.classificacao_ordenada(f.id,null) c where c.posicao<=f.classificam;
       elsif f.tipo='grupos' then select array_agg(c.time_id) into ids from public.grupos g cross join lateral public.classificacao_ordenada(f.id,g.id) c where g.fase_id=f.id and (c.posicao<=f.classificam or c.time_id in (select e.time_id from public.melhores_extras(f.id,f.classificam+1) e where e.posicao<=f.melhores_extras));
       -- Mata-mata: vencedores e melhores perdedores, na ordem da tabela da fase.
       else select array_agg(c.time_id order by c.posicao) into ids from public.classificacao_mata_mata(f.id) c where c.classificado; end if;
       update public.fases set status='em_andamento' where id=proxima.id;
       perform public.gerar_jogos_proxima_fase(proxima.id,ids);
     end if;
   -- Fase que tira os times de outra fase só é preenchida quando aquela fase termina.
   elsif proxima.cruzamento is distinct from 'outra_fase'
      or exists(select 1 from public.fases where competicao_id=f.competicao_id and ordem=proxima.fase_origem and status='concluida') then
     perform public.preencher_series_fase(proxima.id);
   end if;
 end if;
 -- Outras fases que escolheram vencedores ou perdedores desta (ex.: 3º lugar e final saindo da semifinal).
 for dependente in select id from public.fases where competicao_id=f.competicao_id and cruzamento='outra_fase'
     and fase_origem=f.ordem and ordem>f.ordem+1 order by ordem loop
   perform public.preencher_series_fase(dependente);
 end loop;
 if not exists(select 1 from public.fases where competicao_id=f.competicao_id and status<>'concluida') then
   update public.competicoes set status='encerrada' where id=f.competicao_id;
 end if;
end $function$;

-- Validações dos melhores perdedores no assistente de fases.
CREATE OR REPLACE FUNCTION public.salvar_fases(p_competicao_id uuid, p_fases jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_total int;
  v_i int;
  v_k int;
  v_f jsonb;
  v_rotulo text;
  v_nome text;
  v_tipo text;
  v_turnos int;
  v_qtd_grupos int;
  v_sorteio text;
  v_classificam int;
  v_extras int;
  v_melhor_de int;
  v_cruzamento text;
  v_terceiro boolean;
  v_melhor_de_terceiro int;
  v_fase_origem int;
  v_resultado_origem text;
  v_fonte_codigos text[];
  v_codigos_fases jsonb := '{}';
  v_tipos_fases jsonb := '{}';
  v_extras_fases jsonb := '{}';
  v_entram int;
  v_msg text;
  -- fase anterior
  v_ant_tipo text;
  v_ant_classificam int;
  v_ant_qtd_grupos int;
  v_ant_extras int;
  v_ant_codigos text[];
  -- séries
  v_series jsonb;
  v_serie jsonb;
  v_disponiveis jsonb;
  v_usadas jsonb;
  v_origem jsonb;
  v_lado text;
  v_codigos text[];
  v_prox_serie int := 0;
  v_existente public.fases;
  v_existe boolean;
  v_iniciada boolean;
  v_fase_id uuid;
begin
  if p_competicao_id is null or not exists (select 1 from public.competicoes where id = p_competicao_id) then
    raise exception 'Competição não encontrada.';
  end if;
  if not public.is_admin_da_competicao(p_competicao_id) then
    raise exception 'Você não tem permissão para alterar as fases desta competição.' using errcode = '42501';
  end if;
  if not public.pode_editar_estrutura(p_competicao_id) then
    raise exception 'A estrutura da competição está travada: só o admin master pode alterar as fases.';
  end if;
  perform 1 from public.competicoes where id = p_competicao_id for update;

  if p_fases is null or jsonb_typeof(p_fases) <> 'array' or jsonb_array_length(p_fases) = 0 then
    raise exception 'Adicione ao menos uma fase.';
  end if;
  v_total := jsonb_array_length(p_fases);

  -- Fases removidas (as que sobram no fim) só podem sair se ainda não começaram.
  select f.nome into v_nome
  from public.fases f
  where f.competicao_id = p_competicao_id and f.ordem > v_total
    and (f.status <> 'aguardando' or exists (select 1 from public.jogos j where j.fase_id = f.id))
  order by f.ordem
  limit 1;
  if found then
    raise exception 'A fase "%" já começou e não pode ser removida.', v_nome;
  end if;
  delete from public.fases where competicao_id = p_competicao_id and ordem > v_total;

  for v_i in 1 .. v_total loop
    v_f := p_fases -> (v_i - 1);
    v_nome := nullif(trim(coalesce(v_f ->> 'nome', '')), '');
    if v_nome is null then
      raise exception 'Fase %: informe o nome.', v_i;
    end if;
    v_rotulo := format('Fase %s ("%s")', v_i, v_nome);

    v_tipo := v_f ->> 'tipo';
    if v_tipo is null or v_tipo not in ('todos_contra_todos', 'grupos', 'mata_mata') then
      raise exception '%: escolha o tipo da fase.', v_rotulo;
    end if;
    if v_i = 1 and v_tipo = 'mata_mata' then
      raise exception '%: a primeira fase precisa ser todos contra todos ou grupos.', v_rotulo;
    end if;

    v_turnos := coalesce((v_f ->> 'turnos')::int, 1);
    v_qtd_grupos := (v_f ->> 'qtd_grupos')::int;
    v_sorteio := coalesce(v_f ->> 'sorteio_grupos', 'aleatorio');
    v_classificam := (v_f ->> 'classificam')::int;
    v_extras := coalesce((v_f ->> 'melhores_extras')::int, 0);
    v_melhor_de := coalesce((v_f ->> 'melhor_de')::int, 1);
    v_cruzamento := nullif(v_f ->> 'cruzamento', '');
    v_terceiro := coalesce((v_f ->> 'disputa_terceiro')::boolean, false);
    v_melhor_de_terceiro := (v_f ->> 'melhor_de_terceiro')::int;
    v_fase_origem := (v_f ->> 'fase_origem')::int;
    v_resultado_origem := nullif(v_f ->> 'resultado_origem', '');
    v_series := '[]'::jsonb;
    v_codigos := '{}';

    -- Times que chegam da fase anterior (fase 1: os times da competição, conferidos ao iniciar).
    v_entram := null;
    if v_tipo = 'mata_mata' and v_cruzamento = 'outra_fase' then
      -- Vencedores ou perdedores de uma fase de mata-mata anterior (ex.: 3º lugar e final saindo da semifinal).
      if v_fase_origem is null or v_fase_origem < 1 or v_fase_origem >= v_i then
        raise exception '%: escolha uma fase anterior para tirar os times.', v_rotulo;
      end if;
      if v_tipos_fases ->> v_fase_origem::text is distinct from 'mata_mata' then
        raise exception '%: a fase escolhida precisa ser de mata-mata.', v_rotulo;
      end if;
      if v_resultado_origem is null or v_resultado_origem not in ('vencedores', 'perdedores') then
        raise exception '%: escolha se entram os vencedores ou os perdedores.', v_rotulo;
      end if;
      if v_resultado_origem = 'perdedores' and coalesce((v_extras_fases ->> v_fase_origem::text)::int, 0) > 0 then
        raise exception '%: a fase escolhida leva melhores perdedores adiante; os perdedores dela não podem formar outra fase.', v_rotulo;
      end if;
      if v_i = v_total and v_resultado_origem = 'perdedores' then
        raise exception '%: a última fase define o campeão; use os vencedores (o 3º lugar vem antes da final).', v_rotulo;
      end if;
      select coalesce(array_agg(c), '{}') into v_fonte_codigos
        from jsonb_array_elements_text(v_codigos_fases -> v_fase_origem::text) c;
      v_entram := coalesce(array_length(v_fonte_codigos, 1), 0);
      if v_entram < 2 then
        raise exception '%: a fase escolhida tem só % série(s); são necessárias ao menos 2.', v_rotulo, v_entram;
      end if;
    elsif v_i > 1 then
      v_fase_origem := null;
      v_resultado_origem := null;
      v_entram := public.qtd_classificados_fase(
        v_ant_tipo, v_ant_classificam, v_ant_qtd_grupos, v_ant_extras, coalesce(array_length(v_ant_codigos, 1), 0)
      );
      if coalesce(v_entram, 0) < 2 then
        raise exception '%: chegam só % time(s) da fase anterior; são necessários ao menos 2.', v_rotulo, coalesce(v_entram, 0);
      end if;
    end if;

    if v_cruzamento is distinct from 'outra_fase' or v_tipo <> 'mata_mata' then
      v_fase_origem := null;
      v_resultado_origem := null;
    end if;

    if v_tipo in ('todos_contra_todos', 'grupos') then
      if v_turnos not in (1, 2) then
        raise exception '%: escolha 1 ou 2 turnos.', v_rotulo;
      end if;
      v_melhor_de := 1;
      v_cruzamento := null;
      v_terceiro := false;
      v_melhor_de_terceiro := null;
      if v_i < v_total then
        if v_classificam is null or v_classificam < 1 then
          raise exception '%: informe quantos times avançam.', v_rotulo;
        end if;
      else
        -- Última fase: o 1º colocado é o campeão.
        v_classificam := null;
        v_extras := 0;
      end if;
    end if;

    if v_tipo = 'todos_contra_todos' then
      v_qtd_grupos := null;
      v_sorteio := 'aleatorio';
      v_extras := 0;
      if v_entram is not null and v_classificam > v_entram then
        raise exception '%: avançam % times, mas só % disputam a fase.', v_rotulo, v_classificam, v_entram;
      end if;
    elsif v_tipo = 'grupos' then
      if v_qtd_grupos is null or v_qtd_grupos < 2 then
        raise exception '%: informe ao menos 2 grupos.', v_rotulo;
      end if;
      if v_sorteio not in ('aleatorio', 'manual') then
        raise exception '%: escolha como os grupos são definidos.', v_rotulo;
      end if;
      if v_extras < 0 or (v_classificam is not null and v_extras >= v_qtd_grupos) then
        raise exception '%: os melhores extras precisam ser menos que o número de grupos.', v_rotulo;
      end if;
      if v_entram is not null then
        v_msg := public.validar_config_grupos(v_entram, v_qtd_grupos, v_classificam, v_extras);
        if v_msg is not null then
          raise exception '%: %.', v_rotulo, v_msg;
        end if;
      end if;
    else
      -- mata_mata
      v_turnos := 1;
      v_qtd_grupos := null;
      v_sorteio := 'aleatorio';
      if v_melhor_de not in (1, 3, 5, 7) then
        raise exception '%: a série precisa ser melhor de 1, 3, 5 ou 7.', v_rotulo;
      end if;
      if v_cruzamento is null or v_cruzamento not in ('por_campanha', 'cruzado_grupos', 'vencedores', 'outra_fase', 'manual') then
        raise exception '%: escolha como os confrontos são definidos.', v_rotulo;
      end if;
      if v_entram % 2 <> 0 then
        raise exception '%: o mata-mata precisa de número par de times (chegam %).', v_rotulo, v_entram;
      end if;

      if v_cruzamento = 'por_campanha' then
        if v_ant_tipo not in ('todos_contra_todos', 'grupos') and not (v_ant_tipo = 'mata_mata' and v_ant_extras > 0) then
          raise exception '%: o cruzamento por campanha vale depois de uma fase de todos contra todos, de grupos ou de mata-mata com melhores perdedores.', v_rotulo;
        end if;
        for v_k in 1 .. v_entram / 2 loop
          v_series := v_series || jsonb_build_array(jsonb_build_object(
            'origem_a', jsonb_build_object('tipo', 'posicao', 'fase_ordem', v_i - 1, 'posicao', v_k),
            'origem_b', jsonb_build_object('tipo', 'posicao', 'fase_ordem', v_i - 1, 'posicao', v_entram + 1 - v_k)
          ));
        end loop;
      elsif v_cruzamento = 'cruzado_grupos' then
        if v_ant_tipo <> 'grupos' or v_ant_qtd_grupos % 2 <> 0 or v_ant_classificam <> 2 or v_ant_extras <> 0 then
          raise exception '%: o cruzamento entre grupos exige, na fase anterior, um número par de grupos com 2 classificados cada e sem melhores extras.', v_rotulo;
        end if;
        for v_k in 1 .. v_ant_qtd_grupos / 2 loop
          -- 1ºA x 2ºB, 1ºB x 2ºA, 1ºC x 2ºD, 1ºD x 2ºC…
          v_series := v_series || jsonb_build_array(
            jsonb_build_object(
              'origem_a', jsonb_build_object('tipo', 'posicao_grupo', 'fase_ordem', v_i - 1, 'grupo', chr(64 + 2 * v_k - 1), 'posicao', 1),
              'origem_b', jsonb_build_object('tipo', 'posicao_grupo', 'fase_ordem', v_i - 1, 'grupo', chr(64 + 2 * v_k), 'posicao', 2)
            ),
            jsonb_build_object(
              'origem_a', jsonb_build_object('tipo', 'posicao_grupo', 'fase_ordem', v_i - 1, 'grupo', chr(64 + 2 * v_k), 'posicao', 1),
              'origem_b', jsonb_build_object('tipo', 'posicao_grupo', 'fase_ordem', v_i - 1, 'grupo', chr(64 + 2 * v_k - 1), 'posicao', 2)
            )
          );
        end loop;
      elsif v_cruzamento = 'vencedores' then
        if v_ant_tipo <> 'mata_mata' then
          raise exception '%: o cruzamento por vencedores vale depois de outra fase de mata-mata.', v_rotulo;
        end if;
        if v_ant_extras > 0 then
          raise exception '%: a fase anterior leva melhores perdedores; use o cruzamento por campanha ou o manual.', v_rotulo;
        end if;
        for v_k in 1 .. v_entram / 2 loop
          v_series := v_series || jsonb_build_array(jsonb_build_object(
            'origem_a', jsonb_build_object('tipo', 'vencedor', 'serie', v_ant_codigos[2 * v_k - 1]),
            'origem_b', jsonb_build_object('tipo', 'vencedor', 'serie', v_ant_codigos[2 * v_k])
          ));
        end loop;
      elsif v_cruzamento = 'outra_fase' then
        for v_k in 1 .. v_entram / 2 loop
          v_series := v_series || jsonb_build_array(jsonb_build_object(
            'origem_a', jsonb_build_object('tipo', case v_resultado_origem when 'vencedores' then 'vencedor' else 'perdedor' end,
                                           'serie', v_fonte_codigos[2 * v_k - 1]),
            'origem_b', jsonb_build_object('tipo', case v_resultado_origem when 'vencedores' then 'vencedor' else 'perdedor' end,
                                           'serie', v_fonte_codigos[2 * v_k])
          ));
        end loop;
      else
        -- manual: o admin define cada confronto com as origens disponíveis.
        v_disponiveis := public.origens_disponiveis_fase(
          v_i - 1, v_ant_tipo, v_ant_classificam, v_ant_qtd_grupos, v_ant_extras, v_ant_codigos
        );
        if jsonb_typeof(v_f -> 'confrontos') is distinct from 'array'
           or jsonb_array_length(v_f -> 'confrontos') <> v_entram / 2 then
          raise exception '%: defina os % confrontos.', v_rotulo, v_entram / 2;
        end if;
        v_usadas := '[]'::jsonb;
        for v_serie in select value from jsonb_array_elements(v_f -> 'confrontos') loop
          foreach v_lado in array array['origem_a', 'origem_b'] loop
            v_origem := v_serie -> v_lado;
            if v_origem is null or not exists (
              select 1 from jsonb_array_elements(v_disponiveis) d where d.value = v_origem
            ) then
              raise exception '%: há confronto com origem vazia ou inválida.', v_rotulo;
            end if;
            if exists (select 1 from jsonb_array_elements(v_usadas) u where u.value = v_origem) then
              raise exception '%: cada origem só pode aparecer em um confronto.', v_rotulo;
            end if;
            v_usadas := v_usadas || jsonb_build_array(v_origem);
          end loop;
          v_series := v_series || jsonb_build_array(jsonb_build_object(
            'origem_a', v_serie -> 'origem_a', 'origem_b', v_serie -> 'origem_b'
          ));
        end loop;
      end if;

      if v_terceiro then
        v_serie := v_series -> 0;
        if v_entram <> 2
           or v_serie #>> '{origem_a,tipo}' is distinct from 'vencedor'
           or v_serie #>> '{origem_b,tipo}' is distinct from 'vencedor' then
          raise exception '%: a disputa de 3º lugar só vale na final, quando os finalistas vêm de séries do mata-mata.', v_rotulo;
        end if;
        if v_melhor_de_terceiro is not null and v_melhor_de_terceiro not in (1, 3, 5, 7) then
          raise exception '%: a disputa de 3º lugar precisa ser jogo único ou melhor de 3, 5 ou 7.', v_rotulo;
        end if;
      else
        v_melhor_de_terceiro := null;
      end if;
      -- Melhores perdedores (repescagem): completam a fase seguinte quando só os vencedores não bastam.
      if v_extras < 0 then
        raise exception '%: informe quantos melhores perdedores avançam (0 ou mais).', v_rotulo;
      end if;
      if v_extras > 0 and v_i = v_total then
        raise exception '%: a última fase define o campeão; ela não leva melhores perdedores.', v_rotulo;
      end if;
      if v_extras > 0 and v_extras >= v_entram / 2 then
        raise exception '%: os melhores perdedores precisam ser menos que os confrontos (%).', v_rotulo, v_entram / 2;
      end if;
      if v_extras > 0 and v_terceiro then
        raise exception '%: a disputa de 3º lugar não combina com melhores perdedores.', v_rotulo;
      end if;
      v_classificam := v_entram / 2;
    end if;

    -- Grava a fase (mantém o id da fase de mesma ordem para não perder jogos já gerados).
    select * into v_existente from public.fases where competicao_id = p_competicao_id and ordem = v_i;
    v_existe := found;
    v_iniciada := v_existe and (
      v_existente.status <> 'aguardando' or exists (select 1 from public.jogos where fase_id = v_existente.id)
    );

    if v_iniciada then
      if (v_tipo, v_turnos, v_qtd_grupos, v_sorteio, v_melhor_de, v_cruzamento, v_terceiro, v_melhor_de_terceiro,
          v_fase_origem, v_resultado_origem)
         is distinct from (
           v_existente.tipo, v_existente.turnos, v_existente.qtd_grupos, v_existente.sorteio_grupos,
           v_existente.melhor_de, v_existente.cruzamento, v_existente.disputa_terceiro, v_existente.melhor_de_terceiro,
           v_existente.fase_origem, v_existente.resultado_origem
         ) then
        raise exception '%: a fase já começou; só é possível alterar o nome e os classificados.', v_rotulo;
      end if;
      if v_existente.status = 'concluida'
         and (v_classificam, v_extras) is distinct from (v_existente.classificam, v_existente.melhores_extras) then
        raise exception '%: a fase já foi concluída; os classificados não podem mudar.', v_rotulo;
      end if;
      update public.fases
        set nome = v_nome, classificam = v_classificam, melhores_extras = v_extras
        where id = v_existente.id;
      v_fase_id := v_existente.id;
      -- Séries de uma fase iniciada ficam como estão.
      select coalesce(array_agg(codigo order by public.numero_serie(codigo)), '{}')
        into v_codigos
        from public.series
        where fase_id = v_fase_id and origem_a ->> 'tipo' is distinct from 'perdedor';
      v_prox_serie := greatest(
        v_prox_serie,
        coalesce((select max(public.numero_serie(codigo)) from public.series where fase_id = v_fase_id), 0)
      );
    else
      if v_existe then
        update public.fases set
          nome = v_nome, tipo = v_tipo, turnos = v_turnos, qtd_grupos = v_qtd_grupos,
          sorteio_grupos = v_sorteio,
          entrada = case when v_i = 1 then '{"tipo":"todos_os_times"}'::jsonb
                         else jsonb_build_object('tipo', 'classificados', 'fase_ordem', coalesce(v_fase_origem, v_i - 1)) end,
          classificam = v_classificam, melhores_extras = v_extras, melhor_de = v_melhor_de,
          cruzamento = v_cruzamento, disputa_terceiro = v_terceiro, melhor_de_terceiro = v_melhor_de_terceiro,
          fase_origem = v_fase_origem, resultado_origem = v_resultado_origem
        where id = v_existente.id;
        v_fase_id := v_existente.id;
        delete from public.series where fase_id = v_fase_id;
        delete from public.grupos where fase_id = v_fase_id;
      else
        insert into public.fases (
          competicao_id, ordem, nome, tipo, turnos, qtd_grupos, sorteio_grupos, entrada,
          classificam, melhores_extras, melhor_de, cruzamento, disputa_terceiro, melhor_de_terceiro,
          fase_origem, resultado_origem
        ) values (
          p_competicao_id, v_i, v_nome, v_tipo, v_turnos, v_qtd_grupos, v_sorteio,
          case when v_i = 1 then '{"tipo":"todos_os_times"}'::jsonb
               else jsonb_build_object('tipo', 'classificados', 'fase_ordem', coalesce(v_fase_origem, v_i - 1)) end,
          v_classificam, v_extras, v_melhor_de, v_cruzamento, v_terceiro, v_melhor_de_terceiro,
          v_fase_origem, v_resultado_origem
        )
        returning id into v_fase_id;
      end if;

      for v_serie in select value from jsonb_array_elements(v_series) loop
        v_prox_serie := v_prox_serie + 1;
        insert into public.series (fase_id, codigo, origem_a, origem_b, melhor_de)
        values (v_fase_id, 'S' || v_prox_serie, v_serie -> 'origem_a', v_serie -> 'origem_b', v_melhor_de);
        v_codigos := v_codigos || ('S' || v_prox_serie);
      end loop;

      if v_terceiro then
        v_serie := v_series -> 0;
        v_prox_serie := v_prox_serie + 1;
        insert into public.series (fase_id, codigo, origem_a, origem_b, melhor_de)
        values (
          v_fase_id, 'S' || v_prox_serie,
          jsonb_build_object('tipo', 'perdedor', 'serie', v_serie #>> '{origem_a,serie}'),
          jsonb_build_object('tipo', 'perdedor', 'serie', v_serie #>> '{origem_b,serie}'),
          coalesce(v_melhor_de_terceiro, v_melhor_de)
        );
      end if;
    end if;

    v_ant_tipo := v_tipo;
    v_ant_classificam := v_classificam;
    v_ant_qtd_grupos := v_qtd_grupos;
    v_ant_extras := v_extras;
    v_ant_codigos := v_codigos;
    v_codigos_fases := v_codigos_fases || jsonb_build_object(v_i::text, to_jsonb(v_codigos));
    v_tipos_fases := v_tipos_fases || jsonb_build_object(v_i::text, v_tipo);
    v_extras_fases := v_extras_fases || jsonb_build_object(v_i::text, v_extras);
  end loop;
end;
$function$;
