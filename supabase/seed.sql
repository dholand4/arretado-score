-- Seed de desenvolvimento local (roda em `supabase db reset`). Nunca aplicar em produção.
--
-- Usuários de teste (nenhum precisa trocar a senha):
--   master@torneiomais.local      / Master@123   master
--   admin@torneiomais.local       / Admin@1234   admin da "Liga Amadora de Basquete 2026"
--   outro.admin@torneiomais.local / Admin@1234   admin sem competição (não deve ver a liga)
--   dono@torneiomais.local        / Dono@12345   dono do time Tubarões
--   dono2@torneiomais.local       / Dono@12345   dono sem time (disponível para vincular)

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
-- Competição de exemplo (rascunho). O trigger cria a categoria "Pontos" e vincula a admin.
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
