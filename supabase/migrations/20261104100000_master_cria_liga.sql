-- Só o admin master cria ligas; ele escolhe quem administra cada uma (competicao_admins).
-- O admin da liga cuida da configuração, dos times e dos donos dos times dela.

create or replace function public.criar_competicao(
  p_nome text,
  p_slug text,
  p_modalidade text,
  p_descricao text default null,
  p_local_padrao text default null,
  p_intervalo_jogos_min int default 90
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_futsal boolean := p_modalidade = 'futsal';
begin
  if not public.is_master() then
    raise exception 'Só o Admin cria ligas.' using errcode = '42501';
  end if;

  insert into public.competicoes (
    nome, slug, modalidade, descricao, local_padrao, intervalo_jogos_min,
    pontos_vitoria, pontos_derrota, permite_empate, pontos_empate, criado_por
  ) values (
    trim(p_nome), p_slug, p_modalidade, nullif(trim(p_descricao), ''), nullif(trim(p_local_padrao), ''),
    coalesce(p_intervalo_jogos_min, 90),
    -- Padrão estilo NBA; futsal liga empate (vitória 3, empate 1, derrota 0).
    case when v_futsal then 3 else 1 end, 0, v_futsal, case when v_futsal then 1 else 0 end,
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;
