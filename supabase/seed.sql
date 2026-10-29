-- Seed de desenvolvimento local (roda em `supabase db reset`). Nunca aplicar em produção.
--
-- Usuários de teste (nenhum precisa trocar a senha):
--   master@torneiomais.local      / Master@123   master
--   admin@torneiomais.local       / Admin@1234   admin da "Liga Amadora de Basquete 2026"
--   outro.admin@torneiomais.local / Admin@1234   admin sem competição (não deve ver a liga)
--   dono@torneiomais.local        / Dono@12345   dono do time Tubarões
--   dono2@torneiomais.local       / Dono@12345   dono sem time (disponível para vincular)
--
-- Competição "Liga Amadora de Basquete 2026" (em andamento): 5 times x 8 jogadores, categorias
-- Pontos/Rebotes/Assistências, 3 fases, 10 jogos da fase 1 (2 agendados num dia publicado).

-- ---------------------------------------------------------------------------
-- Usuários
-- ---------------------------------------------------------------------------
do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('11111111-1111-1111-1111-111111111111'::uuid, 'master@torneiomais.local',      'Master@123', 'Admin Master',   'master'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'admin@torneiomais.local',       'Admin@1234', 'Ana Organizadora', 'admin'),
      ('33333333-3333-3333-3333-333333333333'::uuid, 'outro.admin@torneiomais.local', 'Admin@1234', 'Bruno Outro Admin', 'admin'),
      ('44444444-4444-4444-4444-444444444444'::uuid, 'dono@torneiomais.local',        'Dono@12345', 'Davi Dono',       'dono_time'),
      ('55555555-5555-5555-5555-555555555555'::uuid, 'dono2@torneiomais.local',       'Dono@12345', 'Elisa Dona',      'dono_time')
    ) as t (id, email, senha, nome, papel)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
      extensions.crypt(u.senha, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('nome', u.nome),
      now(), now(), '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), u.id, u.id::text, 'email',
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
      now(), now(), now()
    );

    -- O trigger on_auth_user_created criou o profile como 'dono_time'; aqui vale o papel real
    -- (mesmo procedimento descrito no README para o primeiro master em produção).
    update public.profiles
      set papel = u.papel, nome = u.nome, precisa_trocar_senha = false
      where id = u.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Competição de exemplo, já EM ANDAMENTO (para testar súmula e tabela sem a Etapa 3):
--   Fase 1 todos contra todos (5 times, 1 turno, 10 jogos, 4 avançam)
--   → Fase 2 semifinal melhor de 3 (1º x 4º, 2º x 3º) → Fase 3 final melhor de 3.
-- O trigger cria a categoria "Pontos" e vincula a admin como administradora.
-- ---------------------------------------------------------------------------
insert into public.competicoes (id, nome, slug, modalidade, descricao, local_padrao, criado_por)
values (
  'c0000000-0000-0000-0000-000000000001',
  'Liga Amadora de Basquete 2026',
  'liga-amadora-basquete-2026',
  'basquete',
  'Liga de basquete 5x5 entre equipes do bairro.',
  'Ginásio Municipal Aldeota',
  '22222222-2222-2222-2222-222222222222'
);

insert into public.categorias_estatistica (competicao_id, nome, sigla, titulo_ranking)
values
  ('c0000000-0000-0000-0000-000000000001', 'Rebotes', 'REB', 'Reboteiro'),
  ('c0000000-0000-0000-0000-000000000001', 'Assistências', 'AST', 'Garçom');

insert into public.times (id, competicao_id, nome, sigla, dono_id)
values
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Tubarões', 'TUB', '44444444-4444-4444-4444-444444444444'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Falcões', 'FAL', null),
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Leões do Norte', 'LEO', null),
  ('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Panteras', 'PAN', null),
  ('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Trovão', 'TRV', null);

-- 8 jogadores por time.
insert into public.jogadores (time_id, nome, apelido, numero, posicao)
select t.id, j.nome || ' ' || t.sufixo, j.apelido, j.numero, j.posicao
from (values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Albuquerque'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'Barbosa'),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'Cavalcante'),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'Damasceno'),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'Esmeraldo')
) as t (id, sufixo)
cross join (values
  ('Carlos',   null,      4,  'Armador'),
  ('Rafael',   'Rafinha', 7,  'Ala-armador'),
  ('Thiago',   null,      9,  'Ala'),
  ('Lucas',    'Luquinha', 11, 'Ala-pivô'),
  ('Marcelo',  null,      13, 'Pivô'),
  ('Pedro',    'Pedrão',  15, 'Pivô'),
  ('Felipe',   null,      21, 'Armador'),
  ('Gustavo',  'Guga',    23, 'Ala')
) as j (nome, apelido, numero, posicao);

-- ---------------------------------------------------------------------------
-- Fases (seção 4.4)
-- ---------------------------------------------------------------------------
insert into public.fases (id, competicao_id, ordem, nome, tipo, turnos, entrada, classificam, melhor_de, cruzamento, status)
values
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1, 'Fase de classificação',
   'todos_contra_todos', 1, '{"tipo":"todos_os_times"}', 4, 1, null, 'em_andamento'),
  ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 2, 'Semifinal',
   'mata_mata', 1, '{"tipo":"classificados","fase_ordem":1}', 2, 3, 'por_campanha', 'aguardando'),
  ('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 3, 'Final',
   'mata_mata', 1, '{"tipo":"classificados","fase_ordem":2}', 1, 3, 'vencedores', 'aguardando');

-- Séries com as origens definidas e os times ainda nulos (4.4.1). Códigos únicos na competição.
insert into public.series (fase_id, codigo, origem_a, origem_b, melhor_de)
values
  ('f0000000-0000-0000-0000-000000000002', 'S1',
   '{"tipo":"posicao","fase_ordem":1,"posicao":1}', '{"tipo":"posicao","fase_ordem":1,"posicao":4}', 3),
  ('f0000000-0000-0000-0000-000000000002', 'S2',
   '{"tipo":"posicao","fase_ordem":1,"posicao":2}', '{"tipo":"posicao","fase_ordem":1,"posicao":3}', 3),
  ('f0000000-0000-0000-0000-000000000003', 'S3',
   '{"tipo":"vencedor","serie":"S1"}', '{"tipo":"vencedor","serie":"S2"}', 3);

update public.competicoes set status = 'em_andamento' where id = 'c0000000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------
-- Jogos da fase 1 (método do círculo, 5 times + folga; cada time folga 1 vez).
-- Times: 1 Tubarões, 2 Falcões, 3 Leões do Norte, 4 Panteras, 5 Trovão.
-- ---------------------------------------------------------------------------
insert into public.jogos (id, competicao_id, fase_id, rodada, time_casa_id, time_fora_id)
select
  ('d0000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid,
  'c0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001',
  rodada,
  ('a0000000-0000-0000-0000-00000000000' || casa)::uuid,
  ('a0000000-0000-0000-0000-00000000000' || fora)::uuid
from (values
  (1, 1, 2, 5), (2, 1, 3, 4),   -- rodada 1: folga Tubarões
  (3, 2, 1, 5), (4, 2, 2, 3),   -- rodada 2: folga Panteras
  (5, 3, 1, 4), (6, 3, 5, 3),   -- rodada 3: folga Falcões
  (7, 4, 1, 3), (8, 4, 4, 2),   -- rodada 4: folga Trovão
  (9, 5, 1, 2), (10, 5, 4, 5)   -- rodada 5: folga Leões do Norte
) as t (n, rodada, casa, fora);

-- Dia de jogos publicado com os 2 jogos da rodada 1 (prontos para lançar súmula).
insert into public.eventos (id, competicao_id, data, local, hora_inicio, qtd_jogos, intervalo_min, status)
values (
  'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
  '2026-10-25', 'Ginásio Municipal Aldeota', '19:00', 2, 90, 'publicado'
);

update public.jogos
  set evento_id = 'e0000000-0000-0000-0000-000000000001',
      status = 'agendado',
      ordem_no_evento = t.ordem,
      inicio_previsto = ('2026-10-25 19:00'::timestamp + (t.ordem - 1) * interval '90 minutes') at time zone 'America/Fortaleza'
  from (values
    ('d0000000-0000-0000-0000-000000000001'::uuid, 1),
    ('d0000000-0000-0000-0000-000000000002'::uuid, 2)
  ) as t (id, ordem)
  where jogos.id = t.id;
