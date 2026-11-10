-- Endurecimento apontado pelo linter do Supabase. Nenhuma regra de campeonato muda.

-- ---------------------------------------------------------------------------
-- 1. v_classificacao: sai da API
-- ---------------------------------------------------------------------------
-- A view roda de propósito com o dono (precisa enxergar os jogos ainda não publicados para
-- listar todos os times) e filtra a visibilidade no fim. O app nunca a consulta direto: a
-- tabela chega por classificacao_ordenada / classificacao_mata_mata, que são security definer
-- e conferem a permissão. Sem o select para anon/authenticated ela deixa de ser um caminho
-- que contorna a RLS.
revoke all on public.v_classificacao from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Funções de trigger não são RPC
-- ---------------------------------------------------------------------------
-- O Postgres dá execute a PUBLIC por padrão, então handle_* e check_* apareciam em
-- /rest/v1/rpc. O trigger dispara sem depender desse privilégio.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prorettype in ('pg_catalog.trigger'::regtype, 'pg_catalog.event_trigger'::regtype)
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.assinatura);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. search_path fixo nas funções utilitárias
-- ---------------------------------------------------------------------------
alter function public.try_uuid(text) set search_path = '';
alter function public.criterios_desempate_validos(jsonb) set search_path = '';
alter function public.categoria_placar_padrao(text) set search_path = '';
