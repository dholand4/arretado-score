# TorneioMais

Aplicação web para organizar campeonatos amadores (foco inicial em basquete): admin configura fases e playoffs, cadastra times e jogadores, cria dias de jogos e lança súmulas; tabela, playoffs e rankings se atualizam sozinhos; o público acompanha sem login.

## Antes de qualquer coisa
1. Leia **`docs/SPEC.md` inteiro**. Ela é a fonte da verdade sobre regras, modelo de dados, permissões e telas.
2. Use a skill de React em **`.Codex/skills/`** para toda decisão de front-end (estrutura de pastas, componentes, estilos, padrões de código).
3. Implemente **uma etapa por vez**, na ordem da seção 11 da spec. Ao terminar uma etapa, rode o projeto, confira os critérios de aceite e pare para eu revisar antes de seguir.

## Stack
- React + Vite + TypeScript, React Router, TanStack Query
- Supabase: Postgres, Auth, RLS, Storage, Realtime, Edge Functions
- Migrations versionadas em `supabase/migrations/` (Supabase CLI)

## Supabase
- Este projeto usa um **projeto Supabase próprio, em uma conta separada**. Use apenas o projeto vinculado nesta pasta (`supabase link`) ou o MCP do Supabase configurado para esta pasta. Nunca crie tabelas em outro projeto.
- Toda mudança de banco vira uma migration em `supabase/migrations/`. Não altere o banco direto pelo painel sem gerar a migration correspondente.
- Variáveis em `.env.local` (não versionar): `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- A chave `service_role` nunca vai para o front-end; só dentro de Edge Functions.
- Toda tabela tem RLS ativado. Teste as policies com os 4 perfis (master, admin, dono_time e anon) ao fim de cada etapa.

## Convenções
- Interface 100% em português do Brasil, mobile-first.
- Banco: nomes de tabelas e colunas em português, `snake_case`, exatamente como na spec.
- Código (variáveis, funções, componentes): siga a skill de React.
- Tabela e rankings são calculados por views/funções SQL, nunca armazenados em colunas.
- Operações que mexem em várias tabelas (salvar súmula, W.O., avançar fase, montar evento) rodam em funções SQL/RPC transacionais.
- Datas e horários no fuso `America/Fortaleza`.

## Quando tiver dúvida
Se algo não estiver na spec ou parecer contraditório, pergunte antes de decidir. Não invente regra de campeonato.
