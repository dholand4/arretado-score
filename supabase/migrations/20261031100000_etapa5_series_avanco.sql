-- Funções internas: acessíveis apenas pela RPC transacional de resultado.
create function public.resolver_origem_serie(p_competicao uuid, p_origem jsonb) returns uuid
language plpgsql stable security definer set search_path = '' as $$
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
end $$;

-- Compara a última classificação anterior disponível; em grupos, posição e os
-- critérios de melhores extras. Ordem alfabética e UUID encerram o empate.
create function public.campanha_do_time(p_competicao uuid, p_antes int, p_time uuid)
returns table(ordem_fase int, posicao bigint, pts int, aproveitamento numeric, saldo int, pf int, nome text, time_id uuid)
language sql stable security definer set search_path = '' as $$
  select f.ordem,c.posicao,c.pts,c.aproveitamento,c.saldo,c.pf,c.nome,c.time_id
  from public.fases f
  left join public.grupos g on g.fase_id=f.id
  cross join lateral public.classificacao_ordenada(f.id,g.id) c
  where f.competicao_id=p_competicao and f.ordem<p_antes and f.tipo<>'mata_mata' and c.time_id=p_time
  order by f.ordem desc limit 1;
$$;

-- Próxima fase de todos contra todos ou grupos: usa a geração da Etapa 3.
-- Grupos: sorteio equilibrado; se a fase for de distribuição manual, o admin
-- redistribui depois pela RPC sortear_grupos (enquanto não houver súmula).
create function public.gerar_jogos_proxima_fase(p_fase_id uuid, p_times uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare f public.fases%rowtype;
begin
 select * into f from public.fases where id=p_fase_id;
 if f.tipo='grupos' then
   perform public.distribuir_grupos(p_fase_id,p_times,null);
 end if;
 perform public.gerar_jogos_da_fase(p_fase_id,p_times);
end $$;

create or replace function public.pos_resultado_jogo(p_jogo_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare j public.jogos%rowtype; f public.fases%rowtype; proxima public.fases%rowtype; s public.series%rowtype;
  va int; vb int; necessario int; numero int; concluida boolean; a uuid; b uuid; troca uuid; ids uuid[]; mudou boolean;
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
   if f.status='concluida' and (proxima.id is null or proxima.status <> 'aguardando') then
     if exists(select 1 from public.jogos jj join public.fases ff on ff.id=jj.fase_id where ff.competicao_id=f.competicao_id and ff.ordem>f.ordem and jj.status in ('encerrado','wo')) then
       raise exception 'A edição desfaz uma fase e há resultados posteriores; ajuste-os antes.';
     end if;
     delete from public.jogos where fase_id in (select id from public.fases where competicao_id=f.competicao_id and ordem>f.ordem) and status in ('pendente','agendado');
     update public.series set time_a_id=null,time_b_id=null,vitorias_a=0,vitorias_b=0,vencedor_id=null,status='aguardando' where fase_id in (select id from public.fases where competicao_id=f.competicao_id and ordem>f.ordem);
     update public.fases set status='aguardando' where competicao_id=f.competicao_id and ordem>f.ordem;
     update public.fases set status='em_andamento' where id=f.id;
     update public.competicoes set status='em_andamento' where id=f.competicao_id;
   end if;
   return;
 end if;
 update public.fases set status='concluida' where id=f.id;
 if proxima.id is null then
   update public.competicoes set status='encerrada' where id=f.competicao_id;
   return;
 end if;
 if proxima.tipo<>'mata_mata' then
   if f.status='concluida' and proxima.status<>'aguardando' then
     raise exception 'A edição de uma fase anterior a jogos de classificação já gerados requer revisão manual.';
   end if;
   if proxima.status='aguardando' then
     if f.tipo='todos_contra_todos' then select array_agg(c.time_id order by c.posicao) into ids from public.classificacao_ordenada(f.id,null) c where c.posicao<=f.classificam;
     elsif f.tipo='grupos' then select array_agg(c.time_id) into ids from public.grupos g cross join lateral public.classificacao_ordenada(f.id,g.id) c where g.fase_id=f.id and (c.posicao<=f.classificam or c.time_id in (select e.time_id from public.melhores_extras(f.id,f.classificam+1) e where e.posicao<=f.melhores_extras));
     else select array_agg(vencedor_id order by public.numero_serie(codigo), codigo) into ids from public.series where fase_id=f.id and vencedor_id is not null; end if;
     update public.fases set status='em_andamento' where id=proxima.id;
     perform public.gerar_jogos_proxima_fase(proxima.id,ids);
   end if;
   return;
 end if;
 if not exists(select 1 from public.series where fase_id=proxima.id) then
   raise exception 'A próxima fase não possui séries configuradas.';
 end if;
 for s in select ss.* from public.series ss where ss.fase_id=proxima.id order by public.numero_serie(ss.codigo), ss.codigo for update loop
   a:=public.resolver_origem_serie(f.competicao_id,s.origem_a); b:=public.resolver_origem_serie(f.competicao_id,s.origem_b);
   if a is null or b is null or a=b then raise exception 'Não foi possível resolver as origens da série %.', s.codigo; end if;
   -- A campanha precede a ordem das origens; sem classificação usa nome e ID.
   if (select row(coalesce(c.posicao,9223372036854775807),-coalesce(c.pts,0),-coalesce(c.aproveitamento,0),-coalesce(c.saldo,0),-coalesce(c.pf,0),t.nome,t.id)
       from public.times t left join lateral public.campanha_do_time(f.competicao_id,proxima.ordem,t.id) c on true where t.id=a)
      > (select row(coalesce(c.posicao,9223372036854775807),-coalesce(c.pts,0),-coalesce(c.aproveitamento,0),-coalesce(c.saldo,0),-coalesce(c.pf,0),t.nome,t.id)
       from public.times t left join lateral public.campanha_do_time(f.competicao_id,proxima.ordem,t.id) c on true where t.id=b) then troca:=a; a:=b; b:=troca; end if;
   mudou := (s.time_a_id,s.time_b_id) is distinct from (a,b);
   if mudou then
     if exists(select 1 from public.jogos jj join public.fases ff on ff.id=jj.fase_id where ff.competicao_id=f.competicao_id and ff.ordem>=proxima.ordem and jj.status in ('encerrado','wo')) then
       raise exception 'A edição mudaria confrontos com resultados posteriores; ajuste-os antes.';
     end if;
     delete from public.jogos where serie_id=s.id and status in ('pendente','agendado');
     update public.series set time_a_id=a,time_b_id=b,vitorias_a=0,vitorias_b=0,vencedor_id=null,status='em_andamento' where id=s.id;
   end if;
   if not exists(select 1 from public.jogos where serie_id=s.id) then
     insert into public.jogos(competicao_id,fase_id,serie_id,numero_na_serie,time_casa_id,time_fora_id) values(f.competicao_id,proxima.id,s.id,1,a,b);
   end if;
 end loop;
 if proxima.status='aguardando' then update public.fases set status='em_andamento' where id=proxima.id; end if;
end $$;
revoke all on function public.resolver_origem_serie(uuid,jsonb), public.campanha_do_time(uuid,int,uuid), public.gerar_jogos_proxima_fase(uuid,uuid[]), public.pos_resultado_jogo(uuid) from public, anon, authenticated;
