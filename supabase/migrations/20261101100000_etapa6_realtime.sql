-- Etapa 6 — Atualização ao vivo (seção 9.1): jogos, séries e súmula no Realtime.
-- O Realtime respeita a RLS: o público só recebe mudanças do que já pode ler.
do $$
declare
  t text;
begin
  foreach t in array array['jogos', 'series', 'sumula_estatisticas'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
