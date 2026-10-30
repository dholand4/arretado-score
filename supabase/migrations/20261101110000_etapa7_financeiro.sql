-- Etapa 7 — Financeiro (seção 8).

-- Quem marcou pago, isentou ou desfez fica registrado (seção 4.6: registrado_por).
create or replace function public.handle_cobranca_registro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.registrado_por := auth.uid();
  end if;
  if new.status <> 'pago' then
    new.pago_em := null;
  elsif new.pago_em is null then
    new.pago_em := (now() at time zone 'America/Fortaleza')::date;
  end if;
  return new;
end;
$$;

create trigger on_cobranca_registro
  before insert or update on public.cobrancas
  for each row execute function public.handle_cobranca_registro();

-- "Gerar cobranças" (8.1): idempotente — não duplica referência já existente.
--   por_time: uma por time por mês; por_jogador: uma por jogador ativo por mês,
--   e jogador cadastrado depois do início só a partir do mês do cadastro.
create or replace function public.gerar_cobrancas(p_competicao_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.competicoes%rowtype;
  v_inseridas int;
begin
  if not public.is_admin_da_competicao(p_competicao_id) then
    raise exception 'Você não tem permissão para gerar cobranças nesta competição.' using errcode = '42501';
  end if;
  select * into c from public.competicoes where id = p_competicao_id;
  if c.cobranca_modelo = 'nenhuma' then
    raise exception 'Esta competição não tem cobrança configurada.';
  end if;
  if c.cobranca_valor is null or c.cobranca_dia_vencimento is null
     or c.cobranca_mes_inicio is null or c.cobranca_qtd_meses is null then
    raise exception 'Preencha valor, dia de vencimento, mês de início e quantidade de meses na configuração.';
  end if;

  with meses as (
    select m::date as referencia
    from generate_series(
      c.cobranca_mes_inicio,
      c.cobranca_mes_inicio + make_interval(months => c.cobranca_qtd_meses - 1),
      interval '1 month'
    ) m
  ),
  alvos as (
    select t.id as time_id, null::uuid as jogador_id, m.referencia
    from public.times t cross join meses m
    where c.cobranca_modelo = 'por_time' and t.competicao_id = c.id
    union all
    select j.time_id, j.id, m.referencia
    from public.jogadores j cross join meses m
    where c.cobranca_modelo = 'por_jogador' and j.competicao_id = c.id and j.ativo
      and m.referencia >= date_trunc('month', j.created_at at time zone 'America/Fortaleza')::date
  ),
  inseridas as (
    insert into public.cobrancas (competicao_id, time_id, jogador_id, referencia, valor, vencimento)
    select c.id, a.time_id, a.jogador_id, a.referencia, c.cobranca_valor,
           make_date(extract(year from a.referencia)::int, extract(month from a.referencia)::int, c.cobranca_dia_vencimento)
    from alvos a
    on conflict do nothing
    returning 1
  )
  select count(*) into v_inseridas from inseridas;
  return v_inseridas;
end;
$$;

revoke all on function public.gerar_cobrancas(uuid) from public, anon;
grant execute on function public.gerar_cobrancas(uuid) to authenticated;

-- "Pagamentos do elenco" (8.2): o dono gera as linhas do mês para os atletas ativos.
-- Só no modelo por_time; idempotente por (time, jogador, mês).
create or replace function public.gerar_pagamentos_elenco(p_time_id uuid, p_referencia date, p_valor numeric)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_modelo text;
  v_inseridas int;
begin
  if not (public.is_dono_do_time(p_time_id) or public.is_master()) then
    raise exception 'Só o dono do time controla os pagamentos do elenco.' using errcode = '42501';
  end if;
  select c.cobranca_modelo into v_modelo
  from public.times t join public.competicoes c on c.id = t.competicao_id
  where t.id = p_time_id;
  if v_modelo is distinct from 'por_time' then
    raise exception 'Os pagamentos do elenco só existem quando a competição cobra por time.';
  end if;
  if p_valor is null or p_valor < 0 then
    raise exception 'Informe um valor válido por atleta.';
  end if;

  with inseridas as (
    insert into public.pagamentos_internos (time_id, jogador_id, referencia, valor)
    select p_time_id, j.id, date_trunc('month', p_referencia)::date, p_valor
    from public.jogadores j
    where j.time_id = p_time_id and j.ativo
    on conflict do nothing
    returning 1
  )
  select count(*) into v_inseridas from inseridas;
  return v_inseridas;
end;
$$;

revoke all on function public.gerar_pagamentos_elenco(uuid, date, numeric) from public, anon;
grant execute on function public.gerar_pagamentos_elenco(uuid, date, numeric) to authenticated;

create or replace function public.handle_pagamento_interno()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'pago' then
    new.pago_em := null;
  elsif new.pago_em is null then
    new.pago_em := (now() at time zone 'America/Fortaleza')::date;
  end if;
  return new;
end;
$$;

create trigger on_pagamento_interno
  before insert or update on public.pagamentos_internos
  for each row execute function public.handle_pagamento_interno();
