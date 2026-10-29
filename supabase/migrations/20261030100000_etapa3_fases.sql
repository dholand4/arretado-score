-- Etapa 3 — Configuração das fases (seção 4.4 / 4.4.1 e etapa 4 do assistente, seção 5).
--
-- salvar_fases grava, numa transação, todas as fases da competição na ordem recebida e as
-- séries do mata-mata com as ORIGENS já definidas e os times nulos (preenchidos na Etapa 5).
--
-- Origens gravadas em series.origem_a / origem_b:
--   {"tipo":"posicao","fase_ordem":1,"posicao":1}              k-ésimo classificado da fase (em grupos:
--                                                               k-ésimo pela campanha geral entre os classificados)
--   {"tipo":"posicao_grupo","fase_ordem":1,"grupo":"A","posicao":2}
--   {"tipo":"melhor_extra","fase_ordem":1,"posicao":1}         k-ésimo entre os "melhores extras" (seção 6.3)
--   {"tipo":"vencedor","serie":"S1"} | {"tipo":"perdedor","serie":"S1"}
-- origem_a é sempre o lado de melhor campanha. A série da disputa de 3º lugar é a que tem as
-- duas origens do tipo "perdedor". Os códigos (S1, S2…) são únicos na competição, em ordem de fase.

-- ---------------------------------------------------------------------------
-- Auxiliares puros
-- ---------------------------------------------------------------------------

-- Quantos times avançam de uma fase, pelo tipo e pela configuração dela.
create or replace function public.qtd_classificados_fase(
  p_tipo text, p_classificam int, p_qtd_grupos int, p_melhores_extras int, p_qtd_series int
)
returns int
language sql
immutable
set search_path = ''
as $$
  select case p_tipo
    when 'todos_contra_todos' then p_classificam
    when 'grupos' then p_classificam * p_qtd_grupos + coalesce(p_melhores_extras, 0)
    else p_qtd_series
  end;
$$;

-- Confere se uma fase de grupos comporta a configuração com grupos equilibrados.
-- Devolve a mensagem de erro (ou null quando está tudo certo).
create or replace function public.validar_config_grupos(
  p_times int, p_qtd_grupos int, p_classificam int, p_melhores_extras int
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_base int;
  v_maiores int;
  v_com_extra int;
begin
  if p_times < 2 * p_qtd_grupos then
    return format('com %s times, cabem no máximo %s grupos (mínimo de 2 times por grupo)', p_times, p_times / 2);
  end if;
  if p_classificam is null then
    return null;
  end if;
  v_base := p_times / p_qtd_grupos;          -- tamanho do menor grupo
  v_maiores := p_times % p_qtd_grupos;       -- grupos com um time a mais
  if p_classificam > v_base then
    return format('avançam %s por grupo, mas o menor grupo terá %s times', p_classificam, v_base);
  end if;
  v_com_extra := case when p_classificam < v_base then p_qtd_grupos else v_maiores end;
  if coalesce(p_melhores_extras, 0) > v_com_extra then
    return format('só %s grupo(s) terão um %sº colocado para disputar os melhores extras', v_com_extra, p_classificam + 1);
  end if;
  return null;
end;
$$;

-- Origens que podem ser usadas num mata-mata, a partir da fase anterior (modo manual).
create or replace function public.origens_disponiveis_fase(
  p_fase_ordem int, p_tipo text, p_classificam int, p_qtd_grupos int, p_melhores_extras int, p_codigos text[]
)
returns jsonb
language sql
immutable
set search_path = ''
as $$
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
  ) s;
$$;

-- Número do código "S12" → 12 (para ordenar séries).
create or replace function public.numero_serie(p_codigo text)
returns int
language sql
immutable
set search_path = ''
as $$
  select nullif(regexp_replace(coalesce(p_codigo, ''), '\D', '', 'g'), '')::int;
$$;

-- ---------------------------------------------------------------------------
-- RPC: salvar a configuração das fases
-- p_fases: [{nome, tipo, turnos, qtd_grupos, sorteio_grupos, classificam, melhores_extras,
--            melhor_de, cruzamento, disputa_terceiro, confrontos: [{origem_a, origem_b}]}]
-- ---------------------------------------------------------------------------
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
    v_series := '[]'::jsonb;
    v_codigos := '{}';

    -- Times que chegam da fase anterior (fase 1: os times da competição, conferidos ao iniciar).
    v_entram := null;
    if v_i > 1 then
      v_entram := public.qtd_classificados_fase(
        v_ant_tipo, v_ant_classificam, v_ant_qtd_grupos, v_ant_extras, coalesce(array_length(v_ant_codigos, 1), 0)
      );
      if coalesce(v_entram, 0) < 2 then
        raise exception '%: chegam só % time(s) da fase anterior; são necessários ao menos 2.', v_rotulo, coalesce(v_entram, 0);
      end if;
    end if;

    if v_tipo in ('todos_contra_todos', 'grupos') then
      if v_turnos not in (1, 2) then
        raise exception '%: escolha 1 ou 2 turnos.', v_rotulo;
      end if;
      v_melhor_de := 1;
      v_cruzamento := null;
      v_terceiro := false;
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
      if v_cruzamento is null or v_cruzamento not in ('por_campanha', 'cruzado_grupos', 'vencedores', 'manual') then
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
      if (v_tipo, v_turnos, v_qtd_grupos, v_sorteio, v_melhor_de, v_cruzamento, v_terceiro)
         is distinct from (
           v_existente.tipo, v_existente.turnos, v_existente.qtd_grupos, v_existente.sorteio_grupos,
           v_existente.melhor_de, v_existente.cruzamento, v_existente.disputa_terceiro
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
                         else jsonb_build_object('tipo', 'classificados', 'fase_ordem', v_i - 1) end,
          classificam = v_classificam, melhores_extras = v_extras, melhor_de = v_melhor_de,
          cruzamento = v_cruzamento, disputa_terceiro = v_terceiro
        where id = v_existente.id;
        v_fase_id := v_existente.id;
        delete from public.series where fase_id = v_fase_id;
        delete from public.grupos where fase_id = v_fase_id;
      else
        insert into public.fases (
          competicao_id, ordem, nome, tipo, turnos, qtd_grupos, sorteio_grupos, entrada,
          classificam, melhores_extras, melhor_de, cruzamento, disputa_terceiro
        ) values (
          p_competicao_id, v_i, v_nome, v_tipo, v_turnos, v_qtd_grupos, v_sorteio,
          case when v_i = 1 then '{"tipo":"todos_os_times"}'::jsonb
               else jsonb_build_object('tipo', 'classificados', 'fase_ordem', v_i - 1) end,
          v_classificam, v_extras, v_melhor_de, v_cruzamento, v_terceiro
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
          v_melhor_de
        );
      end if;
    end if;

    v_ant_tipo := v_tipo;
    v_ant_classificam := v_classificam;
    v_ant_qtd_grupos := v_qtd_grupos;
    v_ant_extras := v_extras;
    v_ant_codigos := v_codigos;
  end loop;
end;
$$;

revoke all on function public.qtd_classificados_fase(text, int, int, int, int) from public;
revoke all on function public.validar_config_grupos(int, int, int, int) from public;
revoke all on function public.origens_disponiveis_fase(int, text, int, int, int, text[]) from public;
revoke all on function public.numero_serie(text) from public;
grant execute on function public.qtd_classificados_fase(text, int, int, int, int) to anon, authenticated, service_role;
grant execute on function public.validar_config_grupos(int, int, int, int) to anon, authenticated, service_role;
grant execute on function public.origens_disponiveis_fase(int, text, int, int, int, text[]) to anon, authenticated, service_role;
grant execute on function public.numero_serie(text) to anon, authenticated, service_role;

revoke all on function public.salvar_fases(uuid, jsonb) from public, anon;
grant execute on function public.salvar_fases(uuid, jsonb) to authenticated;
