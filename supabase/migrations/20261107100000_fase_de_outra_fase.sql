-- Mata-mata com times de uma fase anterior à escolha: "vencedores" ou "perdedores" da fase X.
-- Ex.: Fase 3 "3º lugar" = perdedores da Semifinal; Fase 4 "Final" = vencedores da Semifinal.
-- Quando a fase de origem termina, todas as fases que dependem dela são preenchidas juntas,
-- e a competição só encerra quando todas as fases terminam.

alter table public.fases
  add column fase_origem int check (fase_origem > 0),
  add column resultado_origem text check (resultado_origem in ('vencedores', 'perdedores'));

comment on column public.fases.fase_origem is
  'Só com cruzamento outra_fase: ordem da fase de mata-mata de onde saem os times.';
comment on column public.fases.resultado_origem is
  'Só com cruzamento outra_fase: entram os vencedores ou os perdedores das séries da fase de origem.';

alter table public.fases drop constraint fases_cruzamento_check;
alter table public.fases add constraint fases_cruzamento_check
  check (cruzamento in ('por_campanha', 'cruzado_grupos', 'vencedores', 'outra_fase', 'manual'));

create or replace function public.salvar_fases(p_competicao_id uuid, p_fases jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
      v_extras := 0;
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
        if v_ant_tipo not in ('todos_contra_todos', 'grupos') then
          raise exception '%: o cruzamento por campanha vale depois de uma fase de todos contra todos ou de grupos.', v_rotulo;
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
  end loop;
end;
$$;

-- Preenche os times das séries de uma fase de mata-mata a partir das origens e cria o jogo 1.
create or replace function public.preencher_series_fase(p_fase_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.fases%rowtype; s public.series%rowtype; a uuid; b uuid; troca uuid; mudou boolean;
begin
 select * into p from public.fases where id=p_fase_id for update;
 if not exists(select 1 from public.series where fase_id=p.id) then
   raise exception 'A fase "%" não possui séries configuradas.', p.nome;
 end if;
 for s in select ss.* from public.series ss where ss.fase_id=p.id order by public.numero_serie(ss.codigo), ss.codigo for update loop
   a:=public.resolver_origem_serie(p.competicao_id,s.origem_a); b:=public.resolver_origem_serie(p.competicao_id,s.origem_b);
   if a is null or b is null or a=b then raise exception 'Não foi possível resolver as origens da série %.', s.codigo; end if;
   -- A campanha precede a ordem das origens; sem classificação usa nome e ID.
   if (select row(coalesce(c.posicao,9223372036854775807),-coalesce(c.pts,0),-coalesce(c.aproveitamento,0),-coalesce(c.saldo,0),-coalesce(c.pf,0),t.nome,t.id)
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
end $$;

create or replace function public.pos_resultado_jogo(p_jogo_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
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
       else select array_agg(vencedor_id order by public.numero_serie(codigo), codigo) into ids from public.series where fase_id=f.id and vencedor_id is not null; end if;
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
end $$;

revoke all on function public.preencher_series_fase(uuid), public.pos_resultado_jogo(uuid) from public, anon, authenticated;
