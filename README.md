# TorneioMais

Aplicação web para organizar campeonatos amadores. A especificação completa está em [`docs/SPEC.md`](docs/SPEC.md).

## Desenvolvimento local

Requisitos: Node 20+, Docker Desktop aberto. A Supabase CLI vem como dependência do projeto (`npx supabase`).

```bash
npm install
npm run db:start          # sobe o Supabase local, aplica migrations e o seed
cp .env.example .env.local
npx supabase status -o env   # copie API_URL e PUBLISHABLE_KEY para o .env.local
npm run functions:serve   # Edge Functions (deixe rodando em outro terminal)
npm run dev               # http://localhost:5173
```

O seed cria usuários de teste (master, admin, outro admin e dois donos de time) e a competição de exemplo “Liga Amadora de Basquete 2026”, com 5 times e 40 jogadores, em rascunho. Logins e senhas estão no cabeçalho de [`supabase/seed.sql`](supabase/seed.sql).

| Comando | O que faz |
|---|---|
| `npm run db:reset` | Recria o banco local do zero (migrations + seed) |
| `npm run db:types` | Regenera `src/@types/database.ts` a partir do banco local |
| `npm test` | Testes unitários (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run aceite:etapa1` | Critérios de aceite da Etapa 1 contra o Supabase local (4 perfis) |
| `npm run aceite:etapa2` | Critérios de aceite da Etapa 2: competição, times, jogadores, fotos e permissões |

Toda mudança de banco é uma migration em `supabase/migrations/`. Nada é aplicado em projeto remoto durante o desenvolvimento.

## Primeiro master (produção)

1. No painel do Supabase, em Authentication › Users, crie o usuário (e-mail + senha, com "Auto Confirm").
2. No SQL Editor, rode:

```sql
update public.profiles set papel = 'master', precisa_trocar_senha = false
where id = (select id from auth.users where email = 'SEU_EMAIL');
```

A partir daí, todos os outros usuários são criados pela tela **Painel › Usuários**.
