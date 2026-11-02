-- Mesa por link (seção 6.5.1): o coordenador gera um link para um jogo e o mesário opera a súmula ao vivo
-- sem login. Quando o mesário encerra, o jogo fica aguardando a aprovação do coordenador (não conta na
-- tabela); aprovado, vira súmula oficial. A mesa e os lances passam a ser públicos em ligas públicas, para
-- a torcida acompanhar lance a lance e para a tela de placar (telão).

-- Links de mesa: um ativo por jogo; vale até expirar, ser cancelado ou o resultado ser aprovado/descartado.
create table public.mesa_links (
  id uuid primary key default gen_random_uuid(),
  jogo_id uuid not null references public.jogos (id) on delete cascade,
  competicao_id uuid not null references public.competicoes (id) on delete cascade,
  token text not null unique check (char_length(token) >= 32),
  expira_em timestamptz not null,
  revogado_em timestamptz,
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index mesa_links_jogo_idx on public.mesa_links (jogo_id);
comment on table public.mesa_links is 'Link de mesa por jogo: dá acesso à súmula ao vivo daquele jogo sem login.';

alter table public.mesa_links enable row level security;
revoke all on public.mesa_links from anon;
revoke insert, update, delete on public.mesa_links from authenticated;
create policy "mesa_links_select_admin" on public.mesa_links
  for select to authenticated using (public.is_admin_da_competicao(competicao_id));

-- Novo estado: encerrada pelo mesário, esperando o coordenador aprovar.
alter table public.jogo_mesa drop constraint jogo_mesa_status_check;
alter table public.jogo_mesa add constraint jogo_mesa_status_check
  check (status in ('em_andamento', 'aguardando_aprovacao', 'encerrada'));

-- Leitura pública da mesa e dos lances em ligas públicas (torcida e telão). A escrita continua só pelas RPCs.
create policy "jogo_mesa_select_publica" on public.jogo_mesa
  for select to anon, authenticated using (public.competicao_publica(competicao_id));
create policy "jogo_lances_select_publica" on public.jogo_lances
  for select to anon, authenticated using (
    exists (select 1 from public.jogo_mesa m where m.jogo_id = jogo_lances.jogo_id and public.competicao_publica(m.competicao_id))
  );

-- Link válido para o jogo (não cancelado nem expirado).
create function public.mesa_link_valido(p_jogo_id uuid, p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_token is not null and exists (
    select 1 from public.mesa_links l
    where l.jogo_id = p_jogo_id and l.token = p_token and l.revogado_em is null and l.expira_em > now()
  );
$$;

-- Quem opera a mesa: admin da competição (logado) ou quem tem um link válido do jogo.
create function public.mesa_tem_acesso(p_jogo_id uuid, p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.mesa_link_valido(p_jogo_id, p_token)
    or exists (select 1 from public.jogos j where j.id = p_jogo_id and public.is_admin_da_competicao(j.competicao_id));
$$;

-- As funções da mesa ganham o parâmetro p_token (nulo = admin logado).
drop function public.mesa_para_lancar(uuid);
drop function public.mesa_abrir(uuid);
drop function public.mesa_escalar(uuid, uuid[], jsonb);
drop function public.mesa_relogio(uuid, jsonb);
drop function public.mesa_lance(jsonb);
drop function public.mesa_anular(uuid);

-- Mesa aberta do jogo, travada para escrita, conferindo a permissão.
create function public.mesa_para_lancar(p_jogo_id uuid, p_token text default null)
returns public.jogo_mesa language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
begin
  select * into m from public.jogo_mesa where jogo_id = p_jogo_id for update;
  if not found or not public.mesa_tem_acesso(p_jogo_id, p_token) then
    raise exception 'Mesa não encontrada para este jogo.';
  end if;
  if m.status = 'aguardando_aprovacao' then
    raise exception 'O jogo foi encerrado e aguarda a aprovação do coordenador.';
  end if;
  if m.status <> 'em_andamento' then raise exception 'A súmula ao vivo deste jogo já foi encerrada.'; end if;
  return m;
end $$;

-- Abre (ou devolve) a mesa do jogo.
create function public.mesa_abrir(p_jogo_id uuid, p_token text default null)
returns public.jogo_mesa language plpgsql security definer set search_path = '' as $$
declare
  j public.jogos%rowtype;
  c public.competicoes%rowtype;
  m public.jogo_mesa%rowtype;
begin
  select * into j from public.jogos where id = p_jogo_id for update;
  if not found or not public.mesa_tem_acesso(p_jogo_id, p_token) then
    raise exception 'Sem permissão para abrir a súmula ao vivo deste jogo.';
  end if;
  select * into m from public.jogo_mesa where jogo_id = j.id;
  if found then return m; end if;
  if j.status not in ('pendente', 'agendado') then raise exception 'Este jogo já tem resultado.'; end if;
  if j.time_casa_id is null or j.time_fora_id is null then raise exception 'Os dois times do jogo ainda não estão definidos.'; end if;
  select * into c from public.competicoes where id = j.competicao_id;
  insert into public.jogo_mesa (jogo_id, competicao_id, relogio_restante_ms, posse_restante_ms, aberta_por)
  values (
    j.id, j.competicao_id, c.duracao_periodo_min * 60000,
    case when c.relogio_posse then c.posse_segundos * 1000 end, auth.uid()
  )
  returning * into m;
  return m;
end $$;

-- Escalação (quem vai jogar) e nomes da arbitragem/mesa.
create function public.mesa_escalar(p_jogo_id uuid, p_escalados uuid[], p_oficiais jsonb default '{}'::jsonb, p_token text default null)
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

-- Estado dos relógios e do período, enviado pelo aparelho (ver 20261112100000).
create function public.mesa_relogio(p_jogo_id uuid, p_estado jsonb, p_token text default null)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
  referencia timestamptz := to_timestamp((p_estado->>'referencia_ms')::double precision / 1000);
  novo_periodo int := (p_estado->>'periodo')::int;
  restante int := (p_estado->>'restante_ms')::int;
  posse int := (p_estado->>'posse_ms')::int;
begin
  m := public.mesa_para_lancar(p_jogo_id, p_token);
  if referencia is null or novo_periodo is null or novo_periodo < 1 or restante is null or restante < 0 or posse < 0 then
    raise exception 'Estado do relógio inválido.';
  end if;
  if referencia >= m.relogio_referencia_em then
    update public.jogo_mesa set
      periodo = novo_periodo,
      relogio_restante_ms = restante,
      relogio_rodando = coalesce((p_estado->>'rodando')::boolean, false),
      posse_restante_ms = posse,
      relogio_referencia_em = referencia
    where jogo_id = p_jogo_id;
  end if;
  return now();
end $$;

-- Um lance (ponto, falta ou tempo debitado). Reenviar o mesmo id não faz nada.
create function public.mesa_lance(p_lance jsonb, p_token text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
  j public.jogos%rowtype;
  c public.competicoes%rowtype;
  lance_id uuid := (p_lance->>'id')::uuid;
  jogo uuid := (p_lance->>'jogo_id')::uuid;
  equipe uuid := (p_lance->>'time_id')::uuid;
  atleta uuid := (p_lance->>'jogador_id')::uuid;
  tipo_lance text := p_lance->>'tipo';
  periodo_lance int := (p_lance->>'periodo')::int;
  faltas int; tecnicas int; desqualificado boolean; usados int; limite int; metade int;
begin
  if lance_id is null or jogo is null then raise exception 'Lance inválido.'; end if;
  if exists (select 1 from public.jogo_lances where id = lance_id) then return; end if;
  m := public.mesa_para_lancar(jogo, p_token);
  select * into j from public.jogos where id = jogo;
  select * into c from public.competicoes where id = j.competicao_id;
  if equipe is null or equipe not in (j.time_casa_id, j.time_fora_id) then raise exception 'Time inválido para este jogo.'; end if;
  if periodo_lance is null or periodo_lance < 1 then raise exception 'Período inválido.'; end if;

  if tipo_lance in ('ponto', 'falta') then
    if atleta is null or not (atleta = any (m.escalados))
       or not exists (select 1 from public.jogadores where id = atleta and time_id = equipe) then
      raise exception 'Este jogador não está escalado neste time.';
    end if;
    select count(*) filter (where l.tipo = 'falta'),
           count(*) filter (where l.tipo_falta in ('tecnica', 'antidesportiva')),
           coalesce(bool_or(l.tipo_falta = 'desqualificante'), false)
      into faltas, tecnicas, desqualificado
      from public.jogo_lances l where l.jogo_id = jogo and l.jogador_id = atleta and not l.anulado;
    if faltas >= c.faltas_exclusao_jogador or tecnicas >= 2 or desqualificado then
      raise exception 'Jogador excluído do jogo: não recebe mais lances.';
    end if;
  elsif tipo_lance = 'tempo' then
    metade := ceil(c.qtd_periodos / 2.0);
    if periodo_lance > c.qtd_periodos then
      limite := c.tempos_prorrogacao;
      select count(*) into usados from public.jogo_lances l
        where l.jogo_id = jogo and l.time_id = equipe and l.tipo = 'tempo' and not l.anulado and l.periodo = periodo_lance;
    else
      limite := case when periodo_lance <= metade then c.tempos_primeira_metade else c.tempos_segunda_metade end;
      select count(*) into usados from public.jogo_lances l
        where l.jogo_id = jogo and l.time_id = equipe and l.tipo = 'tempo' and not l.anulado
          and l.periodo <= c.qtd_periodos and (l.periodo <= metade) = (periodo_lance <= metade);
    end if;
    if usados >= limite then raise exception 'Esta equipe já usou todos os tempos desta parte do jogo.'; end if;
    atleta := null;
  else
    raise exception 'Tipo de lance inválido.';
  end if;

  insert into public.jogo_lances (id, jogo_id, periodo, tempo_restante_ms, tipo, time_id, jogador_id, valor, tipo_falta, criado_por)
  values (
    lance_id, jogo, periodo_lance, greatest(0, coalesce((p_lance->>'tempo_restante_ms')::int, 0)), tipo_lance, equipe, atleta,
    case when tipo_lance = 'ponto' then (p_lance->>'valor')::int end,
    case when tipo_lance = 'falta' then coalesce(p_lance->>'tipo_falta', 'pessoal') end,
    auth.uid()
  );
end $$;

-- "Desfazer": o lance continua no histórico, mas não conta.
create function public.mesa_anular(p_lance_id uuid, p_token text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  jogo uuid;
begin
  select jogo_id into jogo from public.jogo_lances where id = p_lance_id;
  if jogo is null then raise exception 'Lance não encontrado.'; end if;
  perform public.mesa_para_lancar(jogo, p_token);
  update public.jogo_lances set anulado = true where id = p_lance_id;
end $$;

-- Mesário encerra pelo link: o jogo fica aguardando a aprovação do coordenador (ainda não conta na tabela).
create function public.mesa_finalizar(p_jogo_id uuid, p_token text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.mesa_para_lancar(p_jogo_id, p_token);
  update public.jogo_mesa set status = 'aguardando_aprovacao', encerrada_em = now(), relogio_rodando = false
    where jogo_id = p_jogo_id;
end $$;

-- Mesa do jogo para o coordenador (aberta ou aguardando aprovação), travada para escrita.
create function public.mesa_do_coordenador(p_jogo_id uuid)
returns public.jogo_mesa language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype;
begin
  select * into m from public.jogo_mesa where jogo_id = p_jogo_id for update;
  if not found or not public.is_admin_da_competicao(m.competicao_id) then
    raise exception 'Mesa não encontrada para este jogo.';
  end if;
  if m.status not in ('em_andamento', 'aguardando_aprovacao') then
    raise exception 'A súmula ao vivo deste jogo já foi encerrada.';
  end if;
  return m;
end $$;

-- Coordenador volta a mesa para o mesário corrigir (o link continua valendo).
create function public.mesa_reabrir(p_jogo_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  m public.jogo_mesa%rowtype := public.mesa_do_coordenador(p_jogo_id);
begin
  if m.status <> 'aguardando_aprovacao' then raise exception 'A mesa já está aberta.'; end if;
  update public.jogo_mesa set status = 'em_andamento', encerrada_em = null where jogo_id = p_jogo_id;
end $$;

-- Descarta a mesa (e os lances) para voltar à súmula normal; os links do jogo deixam de valer.
create or replace function public.mesa_descartar(p_jogo_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.mesa_do_coordenador(p_jogo_id);
  update public.mesa_links set revogado_em = now() where jogo_id = p_jogo_id and revogado_em is null;
  delete from public.jogo_mesa where jogo_id = p_jogo_id;
end $$;

-- Encerra (coordenador operando) ou aprova (jogo encerrado pelo mesário): grava a súmula com a presença
-- dos escalados e os pontos na categoria de placar; os links do jogo deixam de valer.
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
      ), 0))
    )), '[]'::jsonb)
    into jogadores
    from unnest(m.escalados) as e(id);
  update public.jogo_mesa set status = 'encerrada', encerrada_em = coalesce(encerrada_em, now()), relogio_rodando = false
    where jogo_id = p_jogo_id;
  update public.mesa_links set revogado_em = now() where jogo_id = p_jogo_id and revogado_em is null;
  perform public.registrar_resultado_jogo(p_jogo_id, 'completa', null, null, null, jogadores);
end $$;

-- Coordenador gera o link de mesa do jogo (o anterior deixa de valer). Vale por 12 horas a partir do
-- horário do jogo (ou de agora, o que for depois).
create function public.mesa_gerar_link(p_jogo_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  j public.jogos%rowtype;
  novo_token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  validade timestamptz;
begin
  select * into j from public.jogos where id = p_jogo_id for update;
  if not found or not public.is_admin_da_competicao(j.competicao_id) then
    raise exception 'Sem permissão para gerar o link de mesa deste jogo.';
  end if;
  if j.status not in ('pendente', 'agendado') then raise exception 'Este jogo já tem resultado.'; end if;
  if j.time_casa_id is null or j.time_fora_id is null then raise exception 'Os dois times do jogo ainda não estão definidos.'; end if;
  if exists (select 1 from public.jogo_mesa where jogo_id = j.id and status = 'encerrada') then
    raise exception 'A súmula ao vivo deste jogo já foi encerrada.';
  end if;
  validade := greatest(now(), coalesce(j.inicio_previsto, now())) + interval '12 hours';
  update public.mesa_links set revogado_em = now() where jogo_id = j.id and revogado_em is null;
  insert into public.mesa_links (jogo_id, competicao_id, token, expira_em, criado_por)
  values (j.id, j.competicao_id, novo_token, validade, auth.uid());
  return jsonb_build_object('token', novo_token, 'expira_em', validade);
end $$;

-- Coordenador cancela o link de mesa do jogo.
create function public.mesa_cancelar_link(p_jogo_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.jogos j where j.id = p_jogo_id and public.is_admin_da_competicao(j.competicao_id)) then
    raise exception 'Sem permissão para cancelar o link de mesa deste jogo.';
  end if;
  update public.mesa_links set revogado_em = now() where jogo_id = p_jogo_id and revogado_em is null;
end $$;

-- Mesário abre o link: devolve o jogo (mesmo fora de um dia publicado) se o link valer.
create function public.mesa_pelo_link(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  l public.mesa_links%rowtype;
  resultado jsonb;
begin
  select * into l from public.mesa_links where token = p_token;
  if not found or l.revogado_em is not null or l.expira_em <= now() then
    raise exception 'Este link de mesa expirou ou foi cancelado. Peça um novo ao coordenador.';
  end if;
  select jsonb_build_object(
      'id', j.id, 'competicao_id', j.competicao_id, 'status', j.status,
      'time_casa_id', j.time_casa_id, 'time_fora_id', j.time_fora_id,
      'casa', jsonb_build_object('id', tc.id, 'nome', tc.nome, 'logo_url', tc.logo_url),
      'fora', jsonb_build_object('id', tf.id, 'nome', tf.nome, 'logo_url', tf.logo_url),
      'fase', jsonb_build_object('nome', f.nome, 'tipo', f.tipo),
      'expira_em', l.expira_em
    ) into resultado
  from public.jogos j
  join public.times tc on tc.id = j.time_casa_id
  join public.times tf on tf.id = j.time_fora_id
  join public.fases f on f.id = j.fase_id
  where j.id = l.jogo_id;
  return resultado;
end $$;

-- Permissões: as funções com link podem ser chamadas sem login; as do coordenador, só logado.
revoke all on function public.mesa_link_valido(uuid, text), public.mesa_tem_acesso(uuid, text),
  public.mesa_para_lancar(uuid, text), public.mesa_do_coordenador(uuid) from public, anon, authenticated;
grant execute on function public.hora_servidor() to anon;
do $$
declare
  f text;
begin
  foreach f in array array[
    'mesa_abrir(uuid, text)', 'mesa_escalar(uuid, uuid[], jsonb, text)', 'mesa_relogio(uuid, jsonb, text)',
    'mesa_lance(jsonb, text)', 'mesa_anular(uuid, text)', 'mesa_finalizar(uuid, text)', 'mesa_pelo_link(text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
  foreach f in array array[
    'mesa_reabrir(uuid)', 'mesa_descartar(uuid)', 'mesa_encerrar(uuid)', 'mesa_gerar_link(uuid)', 'mesa_cancelar_link(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- Súmula normal e W.O. ficam bloqueados também enquanto o jogo aguarda a aprovação do coordenador.
CREATE OR REPLACE FUNCTION public.registrar_resultado_jogo(p_jogo_id uuid, p_modo text, p_casa integer DEFAULT NULL::integer, p_fora integer DEFAULT NULL::integer, p_ausente text DEFAULT NULL::text, p_jogadores jsonb DEFAULT '[]'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  j public.jogos%rowtype; c public.competicoes%rowtype; f public.fases%rowtype;
  item jsonb; valor record; atleta public.jogadores%rowtype; categoria public.categorias_estatistica%rowtype;
  casa int := 0; fora int := 0; pontos int; vencedor uuid;
begin
  select * into j from public.jogos where id = p_jogo_id for update;
  if not found or not public.is_admin_da_competicao(j.competicao_id) then raise exception 'Sem permissão para lançar este resultado.'; end if;
  -- Com a súmula ao vivo aberta, o resultado só sai pela mesa (6.5.1).
  if exists (select 1 from public.jogo_mesa where jogo_id = j.id and status in ('em_andamento', 'aguardando_aprovacao')) then
    raise exception 'Este jogo está com a súmula ao vivo aberta. Encerre ou descarte a mesa antes.';
  end if;
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
end $function$;
