# Arretado Score

Aplicação web para organizar campeonatos amadores (foco inicial em basquete). O admin configura fases e playoffs, cadastra times e jogadores, monta os dias de jogos e lança as súmulas; tabela, playoffs e rankings se atualizam sozinhos e o público acompanha sem login.

A especificação completa está em [`docs/SPEC.md`](docs/SPEC.md). Os relatórios das etapas feitas por agentes estão em [`docs/handoff/`](docs/handoff/).

## Stack

- React + Vite + TypeScript, React Router, TanStack Query, styled-components
- Supabase: Postgres (RLS), Auth, Storage, Realtime e uma Edge Function (`admin-users`)
- Migrations versionadas em `supabase/migrations/` (Supabase CLI, que vem como dependência do projeto)

## Rodar localmente

Requisitos: Node 20+ e Docker Desktop aberto.

```bash
npm install
npm run db:start              # sobe o Supabase local, aplica as migrations e o seed
cp .env.example .env.local
npx supabase status -o env    # copie API_URL e PUBLISHABLE_KEY para o .env.local
npm run functions:serve       # Edge Functions (deixe rodando em outro terminal)
npm run dev                   # http://localhost:5173
```

### Variáveis de ambiente (`.env.local`, nunca versionado)

| Variável | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL da API do Supabase (local: `http://127.0.0.1:54321`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável (`sb_publishable_…`) |

A chave `service_role` **nunca** vai para o front-end: só existe dentro da Edge Function, injetada pelo próprio Supabase.

### Dados de teste

O seed (`supabase/seed.sql`) cria usuários de teste (master, admins e donos de time; logins e senhas no cabeçalho do arquivo) e a competição de exemplo **“Liga Amadora de Basquete 2026”**, em andamento: 5 times com 40 jogadores, fase de classificação com os 10 jogos gerados (2 num dia de jogos publicado), semifinal e final melhor de 3.

Área pública da liga: `http://localhost:5173/c/liga-amadora-basquete-2026`.

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` / `npm run build` | Front-end em desenvolvimento / build de produção (`dist/`) |
| `npm run db:reset` | Recria o banco local do zero (migrations + seed) |
| `npm run db:types` | Regenera `src/@types/database.ts` a partir do banco local |
| `npm test` | Testes unitários (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run aceite:etapa1` … `aceite:etapa5` | Critérios de aceite de cada etapa contra o Supabase local, com os 4 perfis |
| `npm run aceite:integracao` | Fluxo completo: assistente → iniciar → súmula → avanço até a final |

Os scripts de aceite alteram o banco: rode `npm run db:reset` antes de cada um. O da Etapa 1 precisa de `npm run functions:serve` rodando.

## Perfis

| Perfil | O que faz |
|---|---|
| Admin master | Tudo; único que cria e desativa usuários e altera a estrutura depois da primeira súmula |
| Admin | Competições que administra: configuração, times, dias de jogos, súmulas, W.O. e financeiro |
| Dono do time | Elenco do próprio time e pagamentos internos dos atletas (quando a competição cobra por time) |
| Visitante | Área pública: competições, jogos, tabela, playoffs, rankings e times |

Não existe cadastro aberto: todo login é criado pelo master (Painel › Usuários) e a senha provisória precisa ser trocada no primeiro acesso.

## Organização do código

```
src/
  @types/      tipos (inclui database.ts, gerado do banco)
  components/  componentes de interface reutilizáveis (xxxGlobal)
  constants/   tema, rótulos, chaves de consulta
  hooks/       estado e regras de tela (TanStack Query)
  providers/   tema, consulta e autenticação
  routes/      rotas (painel, autenticação, área pública), guardas e caminhos tipados
  services/    acesso ao Supabase
  utils/       funções puras
  view/        telas (xxxScreen), carregadas sob demanda
supabase/
  migrations/  esquema, RLS, funções e RPCs, por etapa
  functions/   Edge Function admin-users
  seed.sql     dados de desenvolvimento (não usar em produção)
```

Regras importantes ficam no banco: classificação e rankings são views/funções SQL; súmula, W.O., avanço de fase, dias de jogos e cobranças são RPCs transacionais. Toda tabela tem RLS.

## Deploy

### 1. Supabase (nuvem)

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push                          # aplica todas as migrations (sem o seed)
npx supabase functions deploy admin-users
```

As migrations já criam os buckets (`logos`, `fotos-jogadores`, `comprovantes`), as policies e a publicação do Realtime. No painel do projeto, em **Authentication**:

- **Sign In / Providers › Email**: deixe o login por e-mail ligado e **desligue “Allow new users to sign up”** (não há cadastro aberto).
- **Password**: tamanho mínimo 8.
- **URL Configuration**: `Site URL` com o endereço do front publicado.

### 2. Primeiro master

1. Em Authentication › Users, crie o usuário (e-mail + senha, com “Auto Confirm”).
2. No SQL Editor, rode:

```sql
update public.profiles set papel = 'master', precisa_trocar_senha = false
where id = (select id from auth.users where email = 'SEU_EMAIL');
```

A partir daí, todos os outros usuários são criados pela tela **Painel › Usuários**.

### 3. Front-end (Vercel)

O `vercel.json` já configura o build (`npm run build`, pasta `dist`) e a reescrita de todas as rotas para `/index.html` (SPA). Na Vercel:

1. **Add New › Project** e importe o repositório do GitHub.
2. Em **Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do projeto na nuvem (Project Settings › API Keys no Supabase).
3. **Deploy**. Depois, em **Settings › Domains**, aponte o seu domínio.
4. Volte ao Supabase (Authentication › URL Configuration) e coloque o domínio publicado em `Site URL`.

A versão publicada vem minificada, sem mapas de código-fonte e com atalhos de inspeção (botão direito, F12, Ctrl+U) bloqueados. Isso só dificulta a curiosidade: a proteção real dos dados é o RLS do banco.

## Fluxo de mudança no banco

Toda mudança vira uma migration nova em `supabase/migrations/` (`npx supabase migration new nome`), aplicada localmente com `npx supabase migration up` ou `npm run db:reset`, seguida de `npm run db:types`. Nada é alterado direto pelo painel.
