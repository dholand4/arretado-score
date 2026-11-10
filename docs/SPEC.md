# TorneioMais — Especificação do sistema

> Documento de referência para implementação. Leia inteiro antes de começar e siga a ordem das etapas da seção 11.

---

## 1. Visão geral

O TorneioMais é uma aplicação web para organizar campeonatos amadores (foco inicial em basquete, mas preparada para outras modalidades). Um administrador cria uma competição, configura todo o formato (fases, playoffs, séries, pontuação, estatísticas), cadastra os times e jogadores, cria os dias de jogos e lança as súmulas. A tabela, os confrontos dos playoffs e os rankings são atualizados automaticamente. O público acompanha tudo sem precisar de login.

**Princípios**
- Tudo que é regra de campeonato é **configurável** por competição, com padrões sensatos já preenchidos.
- O admin configura antes de começar; depois disso o sistema **anda sozinho** (gera jogos, fecha tabela, monta playoffs).
- Interface simples, pensada para uso no celular (mobile-first), toda em português do Brasil.

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React + Vite + TypeScript, seguindo a skill de React em `.claude/skills/` |
| Rotas | React Router |
| Dados no front | TanStack Query + cliente `@supabase/supabase-js` |
| Back-end | Supabase: Postgres, Auth, Row Level Security, Storage, Realtime, Edge Functions |
| Migrations | Supabase CLI (`supabase/migrations/`) |

**Variáveis de ambiente** (`.env.local`, nunca versionado):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```
A chave `service_role` **nunca** vai para o front-end; só é usada dentro de Edge Functions.

> O projeto Supabase deste sistema é de uma conta separada. Use apenas o projeto vinculado via CLI (`supabase link`) ou o MCP configurado no Claude Code para esta pasta.

---

## 3. Perfis e permissões

| Perfil | Login | O que pode fazer |
|---|---|---|
| **Admin master** | Sim | Tudo em todas as competições. Único que cria, edita e desativa usuários (admins e donos de time). Pode alterar a estrutura de uma competição mesmo depois de iniciada. |
| **Admin** | Sim | Cria competições e administra apenas as suas: configuração, times, jogadores, dias de jogos, súmulas, W.O., financeiro da competição. Na tela de usuários, vê só os logins das equipes que enxerga (cadastradas por ele ou de times das ligas dele) e pode redefinir a senha delas. |
| **Dono do time** | Sim | Vê e edita o elenco do próprio time (nome, número, foto). Controla os pagamentos internos dos atletas do seu time (seção 8.2). Não vê o financeiro do time com a competição. |
| **Visitante** | Não | Consulta a área pública: competições, próximos jogos, resultados, tabela, playoffs, rankings, times e elencos. |

**Regras de acesso**
- Não existe cadastro aberto. Todo login é criado pelo admin master.
- No primeiro acesso, o usuário é obrigado a trocar a senha provisória.
- O admin da competição vincula um dono de time (usuário já criado pelo master) a um time da competição.
- Um admin pode administrar várias competições; uma competição pode ter mais de um admin (tabela `competicao_admins`).

---

## 4. Modelo de dados

Nomes de tabelas e colunas em português, `snake_case`. Todas as tabelas têm `id uuid default gen_random_uuid()` como PK e `created_at timestamptz default now()`, salvo indicação contrária.

### 4.1 Usuários

**`profiles`** (1:1 com `auth.users`; `id` = `auth.users.id`)
- `nome text not null`
- `papel text not null` — `'master' | 'admin' | 'dono_time'`
- `ativo boolean default true`
- `precisa_trocar_senha boolean default true`

### 4.2 Competição

**`competicoes`**
- `nome text not null`
- `slug text unique not null` — usado na URL pública
- `logo_url text`
- `modalidade text not null` — `'basquete' | 'futsal' | 'volei' | 'outro'`
- `descricao text`
- `local_padrao text` — preenche automaticamente o local dos dias de jogos
- `intervalo_jogos_min int default 90` — intervalo padrão entre o início de um jogo e o próximo
- `status text default 'rascunho'` — `'rascunho' | 'em_andamento' | 'encerrada'`
- `estrutura_travada boolean default false` — vira `true` quando a primeira súmula é lançada
- **Pontuação da tabela** (padrão estilo NBA):
  - `pontos_vitoria int default 1`
  - `pontos_derrota int default 0`
  - `pontos_derrota_wo int default 0`
  - `permite_empate boolean default false` (basquete e vôlei: `false`; futsal: `true`)
  - `pontos_empate int default 0`
- **W.O.**:
  - `wo_placar_vencedor int default 20`
  - `wo_placar_perdedor int default 0`
- `criterios_desempate jsonb default '["confronto_direto","saldo","pontos_pro"]'` — ordem aplicada após os pontos
- **Regras da partida** (usadas pela súmula ao vivo, 6.5.1; padrão FIBA, editáveis por liga na etapa "Regras" do assistente):
  - `qtd_periodos int default 4`
  - `duracao_periodo_min int default 10`
  - `duracao_prorrogacao_min int default 5`
  - `faltas_bonus_equipe int default 4` — a partir da falta seguinte a esta, no mesmo período, a equipe está em bônus (lances livres)
  - `faltas_exclusao_jogador int default 5` — com esta falta o jogador é excluído do jogo
  - `tempos_primeira_metade int default 2`, `tempos_segunda_metade int default 3`, `tempos_prorrogacao int default 1` — tempos debitados por equipe
  - `relogio_posse boolean default true`, `posse_segundos int default 24`, `posse_reset_curto int default 14` — relógio de posse
  - `falta_para_relogio boolean default true` — a falta para o cronômetro (FIBA); desligado, o jogo segue correndo e a mesa pausa quando quiser
- **Cobrança** (seção 8):
  - `cobranca_modelo text default 'nenhuma'` — `'nenhuma' | 'por_time' | 'por_jogador'`
  - `cobranca_valor numeric(10,2)`
  - `cobranca_dia_vencimento int` — 1 a 28
  - `cobranca_mes_inicio date` — primeiro dia do primeiro mês cobrado
  - `cobranca_qtd_meses int`
- `criado_por uuid references profiles`

**`competicao_admins`**
- `competicao_id uuid references competicoes on delete cascade`
- `user_id uuid references profiles`
- PK composta `(competicao_id, user_id)`. Quem cria a competição entra automaticamente.

**`categorias_estatistica`** — estatísticas que o admin escolhe registrar na súmula
- `competicao_id uuid references competicoes on delete cascade`
- `nome text not null` — ex.: "Pontos", "Rebotes", "Assistências"
- `sigla text not null` — ex.: "PTS", "REB", "AST"
- `titulo_ranking text not null` — ex.: "Cestinha", "Reboteiro", "Garçom"
- `soma_no_placar boolean default false` — exatamente **uma** categoria por competição tem `true` (a de pontos/gols); o placar do jogo sai da soma dela
- `ordem int`
- `ativa boolean default true`
- `conta_cestas_de int null` — `1`, `2` ou `3`: a categoria é preenchida sozinha pela súmula ao vivo (6.5.1) com quantos lances de +1, +2 ou +3 cada jogador converteu (ex.: "Cestas de 3"). Nulo = digitada na súmula. No máximo uma categoria por valor em cada competição; a categoria de placar não usa.

Ao criar a competição, o sistema cria automaticamente a categoria de placar conforme a modalidade:
| Modalidade | Nome | Sigla | Título do ranking |
|---|---|---|---|
| basquete | Pontos | PTS | Cestinha |
| futsal | Gols | GOL | Artilheiro |
| volei | Pontos | PTS | Maior pontuador |
| outro | Pontos | PTS | Maior pontuador |

O admin pode adicionar quantas categorias quiser (ex.: no basquete, Rebotes, Assistências, Tocos). Cada categoria ativa ganha um ranking próprio. Ao criar uma categoria com `conta_cestas_de` (ou ligar isso numa existente), os jogos já encerrados pela súmula ao vivo são preenchidos com a contagem dos lances, sem sobrescrever valores já lançados na súmula.

### 4.3 Times e jogadores

**`times`** (o time pertence a uma competição)
- `competicao_id uuid references competicoes on delete cascade`
- `nome text not null`
- `sigla text` — até 4 letras, usada em placares compactos
- `logo_url text`
- `dono_id uuid references profiles` (nullable)

**`jogadores`**
- `competicao_id uuid references competicoes on delete cascade` (redundante para facilitar índices e RLS)
- `time_id uuid references times on delete cascade`
- `nome text not null`
- `apelido text`
- `numero int`
- `foto_url text`
- `posicao text`
- `documento text` (opcional; quando preenchido, é único por competição — garante que o atleta não jogue por dois times)
- `ativo boolean default true`
- Restrições: `unique (time_id, numero)` quando `numero` não nulo; `unique (competicao_id, documento)` quando `documento` não nulo.

### 4.4 Formato: fases, grupos e séries

**`fases`**
- `competicao_id uuid references competicoes on delete cascade`
- `ordem int not null` — 1, 2, 3…
- `nome text not null` — ex.: "Fase de classificação", "Semifinal", "Final"
- `tipo text not null` — `'todos_contra_todos' | 'grupos' | 'mata_mata'`
- `turnos int default 1` — 1 ou 2 (todos contra todos e grupos)
- `qtd_grupos int` — só para `grupos`
- `sorteio_grupos text default 'aleatorio'` — `'aleatorio' | 'manual'`
- `entrada jsonb` — de onde vêm os times desta fase (ver 4.4.1)
- `classificam int` — quantos avançam (total, ou por grupo quando `tipo = 'grupos'`)
- `melhores_extras int default 0` — em `grupos`: quantos melhores colocados seguintes (ex.: melhores 3º) também avançam; em `mata_mata`: quantos **melhores perdedores** também avançam (repescagem, ver 6.6.1). Não vale na última fase.
- `melhor_de int default 1` — só em `mata_mata`: 1, 3, 5 ou 7
- `cruzamento text` — só em `mata_mata`: `'por_campanha' | 'cruzado_grupos' | 'vencedores' | 'outra_fase' | 'manual'`
- `fase_origem int` — só com `cruzamento = 'outra_fase'`: `ordem` da fase de mata-mata anterior de onde saem os times
- `resultado_origem text` — só com `cruzamento = 'outra_fase'`: `'vencedores' | 'perdedores'`
- `disputa_terceiro boolean default false` — formato antigo (3º lugar como série extra da final); a tela só mostra para fases que já o têm. O 3º lugar agora é uma fase própria com `outra_fase` (ver 4.4.1)
- `status text default 'aguardando'` — `'aguardando' | 'em_andamento' | 'concluida'`

#### 4.4.1 Entrada de times numa fase
- Fase 1: todos os times da competição.
- Fases seguintes: a partir do resultado da fase anterior, conforme `classificam` / `melhores_extras` da fase anterior.
- `mata_mata` define os confrontos pelo `cruzamento`:
  - **`por_campanha`**: ordena os classificados pela campanha geral e cruza 1º x último, 2º x penúltimo… (com 4: 1º x 4º e 2º x 3º). Também vale depois de um mata-mata com melhores perdedores: aí a ordem é a da tabela daquela fase (vencedores pela campanha, depois os melhores perdedores — ver 6.6.1).
  - **`cruzado_grupos`**: 1ºA x 2ºB, 1ºB x 2ºA, 1ºC x 2ºD, 1ºD x 2ºC…
  - **`vencedores`**: vencedor da série 1 x vencedor da série 2, vencedor da 3 x vencedor da 4… (para rodadas seguintes do mata-mata). Com `disputa_terceiro`, cria também a série entre os perdedores. Não vale depois de um mata-mata com melhores perdedores (use `por_campanha` ou `manual`).
  - **`outra_fase`** (tela: "Vencedores ou perdedores de uma fase"): o admin escolhe uma fase de mata-mata anterior (`fase_origem`, não precisa ser a imediatamente anterior) e quem entra (`resultado_origem`): vencedor (ou perdedor) da série 1 x da série 2, da 3 x da 4… A fase de origem precisa ter ao menos 2 séries. A **última fase define o campeão**, por isso não pode usar perdedores.
    - Exemplo de 3º lugar: Fase 2 "Semifinal" (por campanha) → Fase 3 "3º lugar" = perdedores da Semifinal → Fase 4 "Final" = vencedores da Semifinal.
  - **`manual`**: o admin define cada confronto na tela de configuração usando as origens disponíveis (posição X da fase anterior, posição X do grupo Y, vencedor/perdedor da série Z e, depois de um mata-mata com repescagem, o N-ésimo melhor perdedor).
  - Uma fase com `outra_fase` + perdedores não pode tirar os times de uma fase que leva melhores perdedores adiante (o mesmo time estaria em duas fases).
- Ao salvar a configuração, o sistema grava as séries do mata-mata com as **origens** já definidas (ex.: "1º colocado da Fase 1") e os times ainda nulos. Os times são preenchidos quando a fase anterior termina — ou, com `outra_fase`, quando a fase de origem termina.

**`grupos`**
- `fase_id uuid references fases on delete cascade`
- `nome text` — "A", "B", "C"…

**`grupo_times`**
- `grupo_id uuid references grupos on delete cascade`
- `time_id uuid references times on delete cascade`
- PK `(grupo_id, time_id)`

**`series`** (confrontos de mata-mata)
- `fase_id uuid references fases on delete cascade`
- `codigo text` — "S1", "S2"…
- `origem_a jsonb`, `origem_b jsonb` — ex.: `{"tipo":"posicao","fase_ordem":1,"posicao":1}`, `{"tipo":"posicao_grupo","fase_ordem":1,"grupo":"A","posicao":2}`, `{"tipo":"vencedor","serie":"S1"}`, `{"tipo":"perdedor","serie":"S1"}`, `{"tipo":"melhor_perdedor","fase_ordem":2,"posicao":1}`; com `posicao` apontando para uma fase de mata-mata, vale a posição na tabela daquela fase (6.6.1)
- `time_a_id uuid references times` (nullable até ser definido) — sempre o de **melhor campanha**
- `time_b_id uuid references times` (nullable)
- `melhor_de int`
- `vitorias_a int default 0`, `vitorias_b int default 0`
- `vencedor_id uuid references times`
- `status text default 'aguardando'` — `'aguardando' | 'em_andamento' | 'concluida'`

### 4.5 Dias de jogos e jogos

**`eventos`** (um dia de jogos)
- `competicao_id uuid references competicoes on delete cascade`
- `data date not null`
- `local text not null`
- `hora_inicio time not null`
- `qtd_jogos int not null`
- `intervalo_min int not null`
- `status text default 'rascunho'` — `'rascunho' | 'publicado'` (só publicado aparece na área pública)
- `observacoes text`

**`jogos`**
- `competicao_id uuid references competicoes on delete cascade`
- `fase_id uuid references fases`
- `grupo_id uuid references grupos` (nullable)
- `serie_id uuid references series` (nullable)
- `rodada int` (nullable; usada em todos contra todos e grupos)
- `numero_na_serie int` (nullable)
- `time_casa_id uuid references times not null`
- `time_fora_id uuid references times not null`
- `evento_id uuid references eventos on delete set null` (nullable — jogo pendente ainda sem dia)
- `ordem_no_evento int`
- `inicio_previsto timestamptz`
- `status text default 'pendente'` — `'pendente' | 'agendado' | 'encerrado' | 'wo' | 'cancelado'`
- `placar_casa int`, `placar_fora int`
- `wo_ausente text` — `'casa' | 'fora' | 'ambos'` (nullable)
- `so_placar boolean default false` — `true` quando o admin lançou apenas o placar, sem estatísticas por jogador
- `vencedor_id uuid references times` (nullable em empate)

**`jogo_jogadores`** (presença na súmula)
- `jogo_id uuid references jogos on delete cascade`
- `jogador_id uuid references jogadores on delete cascade`
- `time_id uuid references times`
- PK `(jogo_id, jogador_id)`

**`sumula_estatisticas`**
- `jogo_id uuid references jogos on delete cascade`
- `jogador_id uuid references jogadores on delete cascade`
- `time_id uuid references times`
- `categoria_id uuid references categorias_estatistica on delete cascade`
- `valor int not null default 0`
- `unique (jogo_id, jogador_id, categoria_id)`

**`jogo_mesa`** (estado da súmula ao vivo de um jogo, 6.5.1; uma linha por jogo)
- `jogo_id uuid primary key references jogos on delete cascade`
- `status text default 'em_andamento'` — `'em_andamento' | 'aguardando_aprovacao' | 'encerrada'` (aguardando: o mesário do link encerrou e o coordenador ainda não aprovou)
- `escalados uuid[]` — jogadores marcados para o jogo
- `periodo int not null default 1` — períodos depois de `qtd_periodos` são prorrogações
- `relogio_restante_ms int not null`, `posse_restante_ms int` (nulo sem relógio de posse) — quanto faltava em `relogio_referencia_em`
- `relogio_rodando boolean`, `relogio_referencia_em timestamptz` — com o relógio rodando, o restante é o valor guardado menos o que passou desde a referência (na hora do servidor)
- `apontador text`, `cronometrista text`, `operador_24 text`, `arbitro text`, `fiscal text` — nomes para a súmula impressa
- `aberta_por uuid references profiles`, `created_at`, `encerrada_em timestamptz`

**`jogo_lances`** (cada registro da mesa, na ordem em que aconteceu)
- `id uuid primary key` — gerado no aparelho, para que reenviar o mesmo lance não o duplique
- `jogo_id uuid references jogos on delete cascade`
- `seq bigint generated always as identity` — ordem de chegada
- `periodo int not null`
- `tempo_restante_ms int not null` — relógio no momento do lance
- `tipo text not null` — `'ponto' | 'falta' | 'tempo'`
- `time_id uuid references times not null`
- `jogador_id uuid references jogadores` — nulo em `tempo`
- `valor int` — em `ponto`: 1, 2 ou 3
- `tipo_falta text` — em `falta`: `'pessoal' | 'tecnica' | 'antidesportiva' | 'desqualificante'`
- `anulado boolean default false` — "desfazer" anula em vez de apagar
- `criado_por uuid references profiles`, `created_at`

**`mesa_links`** (link do mesário, 6.5.1; um ativo por jogo)
- `id uuid primary key`
- `jogo_id uuid references jogos on delete cascade`, `competicao_id uuid references competicoes on delete cascade`
- `token text unique` — 64 caracteres aleatórios; é a única credencial do link
- `expira_em timestamptz` — 12 horas depois do horário do jogo (ou de quando foi gerado, o que for depois)
- `revogado_em timestamptz` — preenchido ao gerar outro, cancelar, aprovar ou descartar
- `criado_por uuid references profiles`, `created_at`

### 4.6 Financeiro

**`cobrancas`** (time ou jogador → competição; visível só para admins da competição e master)
- `competicao_id uuid references competicoes on delete cascade`
- `time_id uuid references times on delete cascade`
- `jogador_id uuid references jogadores on delete cascade` (preenchido só no modelo `por_jogador`)
- `referencia date not null` — primeiro dia do mês cobrado
- `valor numeric(10,2) not null`
- `vencimento date not null`
- `status text default 'pendente'` — `'pendente' | 'pago' | 'isento'` (o "atrasado" é calculado: pendente com vencimento < hoje)
- `pago_em date`
- `comprovante_url text`
- `observacao text`
- `registrado_por uuid references profiles`

**`pagamentos_internos`** (atleta → time; controle do dono do time, só no modelo `por_time`)
- `time_id uuid references times on delete cascade`
- `jogador_id uuid references jogadores on delete cascade`
- `referencia date not null`
- `valor numeric(10,2) not null`
- `status text default 'pendente'` — `'pendente' | 'pago' | 'isento'`
- `pago_em date`
- `observacao text`

### 4.7 Views (cálculos)

Os números da tabela e dos rankings **não são armazenados**; são calculados por views/funções SQL a partir dos jogos e súmulas, para que qualquer correção de súmula reflita na hora.
- `v_classificacao` — por fase (e grupo): J, V, E, D, WO, PTS, PF, PC, SALDO, APROVEITAMENTO.
- `v_ranking_estatisticas` — por competição, categoria e (opcionalmente) fase: total, jogos disputados, média por jogo.
- Função `classificacao_ordenada(fase_id, grupo_id)` que aplica os critérios de desempate (seção 6.3) e devolve a posição final.
- Função `classificacao_mata_mata(fase_id)` — tabela de uma fase de mata-mata com melhores perdedores (6.6.1): posição, série, vitórias/derrotas, PF, PC, saldo, W.O., situação (`venceu`, `em_disputa`, `repescagem`, `eliminado`) e se avança.

---

## 5. Configuração da competição (assistente)

Tela em etapas, com botão "Salvar rascunho" em todas:

1. **Dados básicos** — nome, logo (upload), modalidade, descrição, local padrão, intervalo padrão entre jogos. O `slug` é gerado do nome e pode ser editado.
2. **Regras** — as regras da partida usadas pela súmula ao vivo (4.2): períodos, duração, prorrogação, bônus de faltas da equipe, faltas para exclusão, tempos debitados, relógio de posse e se a falta para o cronômetro, já com o padrão FIBA (botão "Usar padrão FIBA"). Não entram na trava de estrutura.
3. **Pontuação e W.O.** — vem preenchido com o padrão (vitória 1, derrota 0, W.O. 20 x 0, derrota por W.O. 0). Botão "Usar padrão FIBA" troca para vitória 2, derrota 1, derrota por W.O. 0. Futsal liga empate por padrão (vitória 3, empate 1, derrota 0). Ordem dos critérios de desempate arrastável.
4. **Estatísticas** — lista com a categoria de placar (fixa, só renomeável) e botão para adicionar outras (nome, sigla, título do ranking e, opcionalmente, "Preencher pela súmula ao vivo": não, lances livres convertidos, cestas de 2 ou cestas de 3).
5. **Fases** — o admin adiciona fases em ordem. Para cada uma: nome, tipo e os campos do tipo (seção 4.4). Mostra um **resumo visual** do formato (ex.: "Fase 1: 5 times, todos contra todos, 10 jogos → 4 avançam → Semifinal melhor de 3: 1º x 4º, 2º x 3º → Final melhor de 3"). Valida a coerência (ex.: classificados precisam caber no mata-mata seguinte, que precisa de número par de times).
6. **Cobrança** — nenhuma, por time ou por jogador; valor, dia de vencimento, mês de início, quantidade de meses.
7. **Times** — o cadastro de times e jogadores da competição, o mesmo da aba Times (abaixo).
8. **Revisão** — resumo completo.

**Times e jogadores** são cadastrados numa tela própria da competição (pode ser antes ou depois do assistente). O admin cadastra o time, opcionalmente vincula um dono, e cadastra jogadores; o dono vinculado também pode cadastrar e editar jogadores do seu time.

**Iniciar competição**: botão que exige ao menos 2 times e a fase 1 configurada. Ao iniciar:
- `status` → `'em_andamento'`, fase 1 → `'em_andamento'`.
- Grupos: sorteio aleatório equilibrado (ou o admin distribui manualmente, se `sorteio_grupos = 'manual'`). Admin pode sortear de novo enquanto nenhum jogo tiver súmula.
- Gera todos os jogos da fase 1 com `status = 'pendente'` (sem data) — ver 6.1.

**Trava de estrutura**: quando a primeira súmula é lançada, `estrutura_travada = true`. A partir daí, fases, pontuação e critérios só podem ser alterados pelo admin master (com aviso de que a tabela será recalculada). Dados básicos, estatísticas novas, times e jogadores continuam editáveis pelo admin.

---

## 6. Regras de negócio

### 6.1 Geração de jogos (todos contra todos e grupos)
- Algoritmo de rodízio (método do círculo). Com número ímpar de times, adiciona um "folga": em cada rodada um time descansa, e todos folgam o mesmo número de vezes.
- `turnos = 2`: o segundo turno repete os confrontos invertendo casa e fora.
- Cada jogo gerado recebe `rodada`. A rodada é só interna (prioriza a ordem no sorteio); os jogos são distribuídos nos dias pelo admin (6.2) e a rodada não aparece em nenhuma tela nem na arte.

### 6.2 Criação de dia de jogos (evento) e sorteio
O admin cria um evento informando **data, local (preenchido com o padrão), hora de início, quantidade de jogos e intervalo** (preenchido com o padrão). O sistema então seleciona os jogos:

1. **Candidatos**: jogos `pendente` da(s) fase(s) em andamento. No mata-mata, apenas o próximo jogo de cada série ainda não decidida cujos dois times já estejam definidos.
2. **Seleção** (aleatória, com prioridades):
   - Prioriza confrontos de rodadas mais antigas.
   - Prioriza times com menos jogos já realizados/agendados, para ninguém ficar muito atrás.
   - Evita que um time jogue duas vezes no mesmo dia.
   - Entre candidatos equivalentes, escolhe aleatoriamente.
3. **Se não couber**: se a quantidade pedida exigir que algum time jogue duas vezes no dia, o sistema avisa ("Só é possível montar X jogos sem repetir time. Deseja permitir jogo duplo?") e só inclui com confirmação. Se houver menos candidatos que o pedido, avisa e cria com o que existir.
4. **Ordem e horários**: ordena aleatoriamente e define `inicio_previsto = data + hora_inicio + (i × intervalo)`. Um time com jogo duplo deve ter seus jogos não consecutivos, se possível.
5. **Rascunho**: o evento nasce `rascunho`. O admin pode reordenar (arrastar), trocar um jogo por outro candidato, remover um jogo (volta a `pendente`), sortear de novo, e então **publicar**. Só eventos publicados aparecem para o público.
6. Jogos de um evento ficam `agendado`. Excluir um evento devolve os jogos sem súmula para `pendente`.
   - **Editar o dia** (rascunho ou publicado, RPC `atualizar_evento`): muda data, hora de início, local, intervalo e observações sem mexer nos jogos nem na ordem; os horários são recalculados a partir do novo início. Se algum jogo do dia já tem resultado, só local e observações mudam.
7. **Ordem conforme os resultados**: quando um jogo do dia termina, o próximo passa a ser, entre os que faltam, o que menos repete os times dele (vencedor pesa 2, perdedor 1): quem perdeu joga em seguida e quem venceu descansa, a não ser que não haja outra opção. Ex. com 3 times: A x B; depois C x perdedor; por último C x vencedor.
8. **Como os confrontos aparecem** (painel e área pública): cada jogo mostra seu número na competição ("Jogo 1", "Jogo 2"…) e a fase (com grupo ou série, quando houver), nunca a rodada. Enquanto um jogo não tem resultado, os que dependem dele aparecem como "Perdedor Jogo 1 x C" e "Vencedor Jogo 1 x C". Só quando os dois candidatos têm o mesmo adversário; nos outros casos aparecem os nomes. A numeração não recomeça a cada dia: o primeiro jogo marcado é o Jogo 1 e a contagem segue pelos dias seguintes (dias publicados antes dos rascunhos, depois data, hora de início e a ordem no dia). Jogo sem dia ou cancelado não tem número. Vem do campo calculado `numero` de `jogos` (função SQL).

### 6.3 Classificação
Colunas: **J** (jogos), **V**, **E** (só se `permite_empate`), **D**, **WO** (derrotas por W.O.), **PTS**, **PF** (pontos/gols a favor), **PC** (contra), **SALDO**, **%** (aproveitamento = V / J).

- Contam apenas jogos `encerrado` ou `wo`.
- PTS = V × `pontos_vitoria` + E × `pontos_empate` + D(normal) × `pontos_derrota` + D(W.O.) × `pontos_derrota_wo`.
- Ordenação: PTS desc e, em empate, os critérios em `criterios_desempate`, na ordem configurada:
  - **`confronto_direto`**: considerando só os jogos entre os times empatados, compara PTS nesses jogos; persistindo, saldo nesses jogos. Se o empate envolve 3 ou mais times e o critério separa só parte deles, reaplica a cadeia ao subgrupo que continuou empatado.
  - **`saldo`**: saldo geral na fase.
  - **`pontos_pro`**: pontos a favor na fase.
  - **`vitorias`**: número de vitórias (útil no modelo FIBA).
  - Último recurso, sempre: ordem alfabética, com indicação visual de "empate técnico" para o admin resolver manualmente se quiser (campo de ajuste manual de posição, só admin, registrado).
- Em `grupos`, a classificação é por grupo. Os `melhores_extras` são definidos comparando os colocados na mesma posição entre os grupos (PTS, depois aproveitamento, saldo e pontos pró, já que os grupos podem ter tamanhos diferentes).

### 6.4 W.O.
- Na tela do jogo, o admin marca W.O. e qual time faltou (`casa`, `fora` ou `ambos`).
- Placar automático: `wo_placar_vencedor` x `wo_placar_perdedor` (padrão 20 x 0). Esses pontos entram no saldo e nos pontos a favor/contra.
- O time ausente recebe `pontos_derrota_wo` e soma 1 na coluna WO.
- W.O. duplo: os dois recebem derrota por W.O., placar 0 x 0, sem vencedor.
- Jogo por W.O. não gera estatísticas de jogadores.
- No mata-mata, W.O. conta como vitória na série para o time presente.

### 6.5 Súmula
- Acesso: admin da competição e master.
- Tela do jogo mostra duas listas (um time em cada), com todos os jogadores ativos. Para cada jogador: caixa de presença ("jogou") e um campo numérico por categoria ativa, na ordem das categorias.
- Campos em branco = 0. Preencher qualquer número marca a presença automaticamente.
- O placar é calculado em tempo real como a soma da categoria `soma_no_placar` de cada time, e mostrado no topo.
- Opção **"Lançar só o placar"**: o admin informa apenas o placar final; `so_placar = true`. O jogo conta para tabela e séries, mas não para rankings.
- Validações: placar empatado só é aceito se `permite_empate` e a fase não for `mata_mata`; no mata-mata, sempre precisa haver vencedor.
- Ao salvar: `status = 'encerrado'`, grava placar e `vencedor_id`, atualiza a série (se houver) e dispara a verificação de avanço (6.6).
- Súmula pode ser editada depois. Se a fase do jogo já estiver concluída e a fase seguinte já tiver jogos encerrados, só o master pode editar, com aviso.
- Ações sensíveis (salvar súmula, W.O., edição de súmula encerrada) devem ser executadas numa função SQL/RPC transacional, para manter placar, série e avanço consistentes.

#### 6.5.1 Súmula ao vivo (mesa)
O mesário preenche a súmula durante o jogo, no celular ou tablet, do mesmo jeito que a súmula de papel: cronômetro, pontos e faltas de cada jogador, faltas da equipe e tempos debitados. No fim, o jogo é encerrado e vira uma súmula normal (6.5).

- **Quem opera**: admin da competição e master (o login do coordenador basta) ou um **mesário sem login, pelo link do jogo**.
- **Link do mesário**: na mesa, o coordenador toca em "Link do mesário" e gera um link `/mesa/:token` daquele jogo (compartilhável pelo WhatsApp). Vale 12 horas a partir do horário do jogo; gerar outro ou cancelar invalida o anterior; aprovar ou descartar a mesa também. Quem abre o link vê só a mesa daquele jogo, sem o menu e sem as opções de descartar ou voltar à súmula normal.
- **Aprovação**: quando o mesário do link encerra o jogo, a mesa fica `aguardando_aprovacao`: não aceita mais lances e o resultado ainda **não conta** na tabela. O coordenador vê o aviso na lista de jogos e na mesa e pode **aprovar o resultado** (grava como em "Encerrar o jogo"), **reabrir para o mesário** corrigir ou **descartar a mesa**. Quando o próprio coordenador opera a mesa, "Encerrar" grava direto, sem aprovação.
- **Acompanhar ao vivo**: em liga pública, a página pública do jogo mostra placar, período, relógios, faltas, tempos e o lance a lance enquanto a mesa está aberta (Realtime, sem login). A tela de placar `/placar/:gameId` mostra o mesmo em letras grandes para um segundo tablet ou TV de frente para a quadra (botão "Placar (telão)" na mesa e "Placar em tela cheia" na página do jogo), com os escudos e os nomes dos times.
- **Onde**: rota própria, sem o menu do painel, aberta pelo botão "Súmula ao vivo" da súmula do jogo. A tela se adapta: no celular, um time por vez (abas "Casa", "Fora" e "Lances"); no tablet, os dois times lado a lado; no computador, os dois times e os lances. No computador, **espaço** liga e pausa o relógio e **Ctrl/Cmd+Z** desfaz. A tela fica acesa enquanto a mesa está aberta.
- **Abrir a mesa**: em jogo `pendente` ou `agendado`, com os dois times definidos e ainda sem resultado. Abrir cria a linha em `jogo_mesa` (período 1, relógio parado com a duração do período). Jogo com mesa aberta não aceita súmula normal nem W.O. até a mesa ser encerrada ou descartada.
- **Antes de começar**: o mesário marca, em cada time, os jogadores que vão jogar (entre os ativos do elenco, com o número), **no máximo 12 por time**; com mais de 12 no elenco, ele escolhe quais entram. Só eles aparecem para lançar. Dá para incluir alguém depois, respeitando o limite. Os nomes de apontador, cronometrista, árbitro e fiscal são opcionais.
- **Cronômetro** (regressivo):
  - Iniciar e pausar; corrigir o tempo (digitar ou ajustar segundos) com o relógio parado.
  - Ao chegar a zero, para sozinho e oferece **encerrar o período**.
  - Depois do último período regulamentar: se o placar estiver empatado e o empate não for permitido (6.5), começa uma prorrogação com `duracao_prorrogacao_min`, quantas forem necessárias; senão, oferece **encerrar o jogo**.
  - O estado fica em `jogo_mesa`: recarregar a página ou trocar de aparelho continua de onde parou, com o relógio no ponto certo.
- **Relógio de posse** (se `relogio_posse`): corre e para junto com o cronômetro. Botões para reiniciar com `posse_segundos` (24) ou `posse_reset_curto` (14) e para corrigir ±1 s. Cesta de 2 ou 3 reinicia a posse cheia sozinha. No zero, os dois relógios param, toca a sirene e aparece "Estouro do relógio de posse" com o botão de nova posse. Quando falta menos tempo de jogo do que de posse, o relógio de posse fica apagado (não vale). Ao trocar de período, volta cheio.
- **Lances**: escolher o time, o jogador e a ação: **+1**, **+2**, **+3** ou **Falta** (pessoal por padrão; técnica, antidesportiva ou desqualificante numa opção). Cada lance grava o período e o tempo do relógio. Dá para lançar com o relógio parado (lances livres). Tempo debitado para o relógio. A falta para o relógio se a liga ligar `falta_para_relogio`; desligado, o jogo segue correndo e a mesa pausa quando quiser.
- **Faltas do jogador**: a tela mostra as faltas de cada um (todas contam). O jogador fica **excluído** com `faltas_exclusao_jogador` faltas, com uma desqualificante ou com duas entre técnicas e antidesportivas: aviso na hora e ele não recebe mais lances.
- **Faltas da equipe**: contam todas as faltas dos jogadores, por período; as prorrogações contam junto com o último período. Ao passar de `faltas_bonus_equipe`, a tela avisa que a equipe está **em bônus**.
- **Tempos debitados**: botão por equipe. Ao pedir, a mesa mostra a contagem de **1 minuto** embaixo dos tempos daquela equipe (no visual do relógio de posse); no fim toca a sirene e fica em 00:00. Ligar o relógio encerra o tempo (antes ou depois do minuto), e desfazer o lance tira a contagem. Limite por metade: `tempos_primeira_metade` nos primeiros `qtd_periodos / 2` períodos, `tempos_segunda_metade` nos demais e `tempos_prorrogacao` em cada prorrogação. Tempo não usado não passa para a metade seguinte.
- **Placar**: sempre a soma dos pontos dos lances não anulados. O placar por período e a "contagem de pontos" corrida saem dos lances.
- **Desfazer**: anula o último lance; a lista de lances do jogo permite anular qualquer um (com confirmação). Lance anulado não conta em nada, mas continua no histórico.
- **Encerrar o jogo** (RPC transacional, com confirmação mostrando o placar): aplica as mesmas validações e efeitos da súmula normal (6.5). Grava a presença (`jogo_jogadores`) dos jogadores marcados, os pontos de cada um na categoria `soma_no_placar` e, em cada categoria ativa com `conta_cestas_de`, quantos lances daquele valor o jogador converteu (`sumula_estatisticas`); `so_placar = false`. A mesa fica `encerrada` e só para leitura.
- **Depois de encerrado**: as outras categorias (rebotes, assistências…, menos as preenchidas pelos lances) e qualquer correção são feitas na súmula normal. A súmula normal manda; os lances ficam como histórico.
- **Lance a lance depois do jogo**: a página pública do jogo continua mostrando o lance a lance de um jogo encerrado pela mesa, abaixo do box score: os lances que valeram (anulados não aparecem), do mais recente para o mais antigo, com filtro por período. Jogo lançado só pela súmula normal não tem lance a lance. Se o placar da súmula for diferente do somado pelos lances (corrigido depois), um aviso explica que os lances mostram o que a mesa registrou.
- **Descartar a mesa**: enquanto não encerrada, o admin pode descartá-la (apaga `jogo_mesa` e os lances, com confirmação) e voltar à súmula normal.
- **Conexão**: cada lance e cada mudança do relógio vão para o servidor na hora. Sem conexão, o lance entra numa fila no aparelho, aparece como "pendente" e é reenviado quando a internet volta; como o `id` vem do aparelho, reenviar não duplica. Um aviso fixo mostra quando há lances pendentes, e o jogo não pode ser encerrado com fila pendente. O lance aparece na tela na hora e fica nela: o que o servidor já aceitou continua valendo até a consulta seguinte trazê-lo, para não sumir e voltar.
- **Sair da conta**: "Sair" encerra a sessão só naquele aparelho; não derruba o coordenador logado na mesa em outro aparelho.
- **Um aparelho por jogo**: pensado para uma mesa só. Se outro aparelho abrir a mesma mesa, ele vê o mesmo estado e pode continuar (ex.: o celular descarregou).
- Todas as escritas (abrir, lance, anular, relógio, período, encerrar, descartar) são RPCs que conferem se o jogo é da competição do usuário (ou se o token do link é válido para aquele jogo) e se a mesa está `em_andamento`. Gerar e cancelar link, aprovar, reabrir e descartar são só do coordenador.

**Decisões**: regras FIBA como padrão, editáveis por liga; o coordenador opera a mesa; relógio de posse incluído; mesário sem login só pelo link do jogo, com aprovação do coordenador; placar ao vivo para o público incluído; súmula impressa preenchida fica para a etapa 10.

### 6.6 Séries e avanço de fase
- **Série melhor de N**: vence quem chegar a ⌈N/2⌉ vitórias. O jogo 1 é criado (`pendente`) assim que os dois times da série estão definidos. Cada jogo seguinte só é criado quando o anterior termina e a série ainda não foi decidida. Mando nominal: time de melhor campanha é mandante nos jogos ímpares.
- **Fase concluída** quando:
  - todos contra todos / grupos: todos os jogos estão `encerrado`, `wo` ou `cancelado`;
  - mata-mata: todas as séries estão `concluida`.
- Ao concluir uma fase:
  1. Calcula a classificação final da fase.
  2. Marca a fase `concluida` e a próxima `em_andamento`.
  3. Resolve as origens da próxima fase: preenche `time_a_id`/`time_b_id` das séries (`time_a` = melhor campanha) ou distribui os classificados e gera os jogos (se for todos contra todos/grupos). Uma próxima fase `outra_fase` só é preenchida se a sua fase de origem já terminou.
  4. Preenche também, junto, todas as fases `outra_fase` cuja `fase_origem` é a fase que terminou (ex.: 3º lugar e final saem juntos da semifinal e podem ser jogados no mesmo dia).
  5. A competição fica `encerrada` quando **todas** as fases estão concluídas (a final pode terminar antes do 3º lugar). O campeão é o vencedor da série da última fase (ou o 1º da última classificação).
- Se uma fase deixa de estar concluída (edição de resultado), as fases que dependem dela voltam a `aguardando`; uma fase `outra_fase` cuja origem é anterior à fase editada não é afetada.
- Até a fase concluir, a área pública mostra os confrontos futuros com as origens ("1º colocado x 4º colocado").

#### 6.6.1 Melhores perdedores (repescagem)
Para quando os vencedores de um mata-mata não fecham a fase seguinte. Ex.: 6 times → quartas 1º x 6º, 2º x 5º, 3º x 4º (melhor de 3) → 3 vencedores + **1 melhor perdedor** = 4 na semifinal. Com 4 ou 8 times não é preciso.
- Configurada na fase de mata-mata (`melhores_extras`): menos que o número de séries, nunca na última fase, e sem `disputa_terceiro`. Vencedores + melhores perdedores precisam fechar a fase seguinte (número par, se for mata-mata).
- **Tabela da fase** (`classificacao_mata_mata`):
  1. Vencedores das séries, na ordem da campanha anterior (a mesma comparação usada para definir o time de melhor campanha da série).
  2. Times com a série em andamento.
  3. Perdedores, nesta ordem: quem perdeu algum jogo da série por **W.O.** fica atrás; depois **vitórias na série**, **saldo de pontos na série**, **pontos marcados na série** e, por fim, a **campanha anterior**. Os primeiros, até `melhores_extras`, avançam.
  - Em melhor de 3, quem vence a série tem 2 vitórias e quem perde tem no máximo 1: os vencedores sempre ficam à frente, e a tabela decide só a vaga da repescagem. Quem perdeu de 2 a 1 sempre jogou 3 jogos e quem perdeu de 2 a 0 jogou 2, então o saldo só compara times com o mesmo número de jogos.
  - Enquanto houver série em andamento, a repescagem é provisória.
- **Fase seguinte**: recebe os vencedores e os melhores perdedores na ordem da tabela. Com `por_campanha`, cruza 1º x último… e o melhor perdedor entra sempre depois dos vencedores (ex.: 1º x 4º = melhor vencedor x melhor perdedor). O melhor perdedor **nunca tem o mando** contra um vencedor, mesmo com campanha anterior melhor.
- Corrigir um resultado da fase antes da seguinte começar refaz a tabela e os confrontos.

### 6.7 Rankings de estatísticas
- Um ranking por categoria ativa, com título personalizado (ex.: "Cestinha").
- Colunas: posição, foto, jogador, time, total, jogos (presenças), média por jogo.
- Ordenação padrão por total; opção de ordenar por média (com mínimo de jogos configurável, padrão 1).
- Filtro por fase (padrão: competição inteira).
- Jogos `so_placar` e W.O. não entram.

#### 6.7.1 Página do jogador
Página pública de cada atleta (`/c/:slug/jogadores/:jogadorId`), aberta pelo elenco do time, pelos rankings e pelo box score do jogo.
- **Cabeçalho**: foto, nome (e apelido), número, posição e o time, com link para a página do time. Jogador inativo continua com a página (mantém o histórico) e aparece marcado como "Inativo".
- **Números na competição**: quantidade de jogos (presenças) e, para cada categoria ativa, o total e a média por jogo. Vêm de `v_ranking_estatisticas` (competição inteira), então batem com os rankings.
- **Jogo a jogo**: um jogo por linha, do mais recente para o mais antigo: data, adversário, resultado do time do jogador (V, D ou E, com o placar) e o valor de cada categoria ativa naquele jogo. Cada linha abre o detalhe do jogo.
- Entram só os jogos `encerrado` com súmula completa em que o jogador teve presença. Jogos `so_placar` e W.O. não entram, como nos rankings.
- Não há tabela nem coluna nova: tudo sai de `jogo_jogadores`, `sumula_estatisticas` e `v_ranking_estatisticas`, com a mesma RLS do visitante (10.2).

---

## 7. Usuários e autenticação

- Login por e-mail e senha (Supabase Auth). Sem cadastro público, sem login social.
- **Edge Function `admin-users`** (usa `service_role`, verifica que quem chama é `master`):
  - `create`: nome, e-mail, senha provisória, papel → cria em `auth.users` e em `profiles` com `precisa_trocar_senha = true`.
  - `update`: nome, papel, ativo.
  - `reset_password`: define nova senha provisória e marca `precisa_trocar_senha = true`. O admin também pode, mas só para as equipes que enxerga (`equipe_visivel_ao_coordenador`).
- Usuário com `ativo = false` é bloqueado no login (checagem no front e nas policies).
- Rota `/trocar-senha` obrigatória enquanto `precisa_trocar_senha = true`.
- **Primeiro master**: criado manualmente (instrução no README: criar usuário no painel do Supabase e rodar um `update profiles set papel = 'master'`).

---

## 8. Financeiro

### 8.1 Cobrança da competição (`cobrancas`)
- Quando a competição tem `cobranca_modelo` diferente de `'nenhuma'`, o admin gera as cobranças com um botão "Gerar cobranças" (idempotente: não duplica referência já existente):
  - `por_time`: uma cobrança por time por mês.
  - `por_jogador`: uma cobrança por jogador ativo por mês. Jogador cadastrado depois recebe cobranças a partir do mês corrente.
- Tela **Financeiro** (admin da competição e master):
  - Filtros por mês, time e status.
  - Cards: total previsto no mês, total recebido, total pendente, quantidade em atraso.
  - Lista com status colorido: pago, pendente, atrasado (pendente vencido), isento.
  - Ação "Marcar como pago": data do pagamento (padrão hoje), comprovante opcional (upload), observação.
  - Ação "Isentar" e "Desfazer".
- Sem integração de pagamento online nesta versão.
- **Dono do time não vê** a tabela `cobrancas`.

### 8.2 Controle interno do time (`pagamentos_internos`)
- Disponível só quando `cobranca_modelo = 'por_time'`.
- Tela "Pagamentos do elenco" na área do dono do time: o dono define o valor por atleta e o mês, gera as linhas do mês para o elenco e marca quem pagou.
- Visível e editável apenas pelo dono do time e pelo master. Não interfere no status da cobrança do time com a competição.

---

## 9. Telas e rotas

### 9.1 Área pública (sem login)
| Rota | Conteúdo |
|---|---|
| `/` | Lista de competições em andamento e encerradas recentes (logo, nome, modalidade) |
| `/c/:slug` | Início da competição: próximos jogos (eventos publicados), últimos resultados, top 3 de cada ranking, atalho para tabela e playoffs e o **formato**: fases em ordem com status, o resumo visual do caminho até a final (o mesmo do assistente) e os times de cada grupo já sorteado |
| `/c/:slug/jogos` | Jogos agrupados por dia (eventos publicados), do último para o primeiro (maior "Jogo N" no começo; sem dia no fim), com placar quando encerrados; filtros por fase e time |
| `/c/:slug/jogos/:jogoId` | Detalhe: placar, data/local, estatísticas por jogador (box score). Com a súmula ao vivo aberta: placar ao vivo e lance a lance (6.5.1). Em jogo encerrado pela mesa, o lance a lance continua abaixo do box score |
| `/placar/:gameId` | Tela de placar (telão) do jogo, em tela cheia: escudos, nomes, placar, período, relógios, faltas e tempos |
| `/mesa/:token` | Mesa do jogo para o mesário do link (6.5.1), sem login |
| `/c/:slug/tabela` | Classificação por fase (abas) e por grupo; linhas dos classificados destacadas. Fases de mata-mata com melhores perdedores também aparecem, com a tabela da fase (6.6.1) |
| `/c/:slug/playoffs` | Chaveamento visual das fases de mata-mata, com placar da série (ex.: 2–1) e origens pendentes |
| `/c/:slug/rankings` | Rankings por categoria (abas com o título de cada uma) |
| `/c/:slug/times` | Lista de times |
| `/c/:slug/times/:timeId` | Elenco com fotos, jogos do time, estatísticas do time |
| `/c/:slug/jogadores/:jogadorId` | Página do jogador (6.7.1): cabeçalho, números na competição e jogo a jogo |

Atualização ao vivo via Supabase Realtime nas páginas de jogos, tabela e detalhe do jogo.

### 9.2 Autenticação
`/login`, `/trocar-senha`.

### 9.3 Painel (com login)
| Rota | Quem | Conteúdo |
|---|---|---|
| `/painel` | todos | Atalhos conforme o papel |
| `/painel/usuarios` | master, admin | Master: lista, criar, editar, desativar, redefinir senha. Ao abrir mostra só os masters; escolhendo uma liga, os coordenadores dela e depois os logins dos times; ou todas as ligas. Admin: só os logins das equipes que enxerga, filtrando pelas suas ligas, e redefinir senha |
| `/painel/competicoes` | master, admin | Competições (master vê todas; admin vê as suas) |
| `/painel/competicoes/nova` | master, admin | Assistente (seção 5) |
| `/painel/competicoes/:id` | master, admin | Visão geral: status, fase atual, próximos passos ("Faltam 3 súmulas para fechar a Fase 1") |
| `.../:id/configuracao` | master, admin | Etapas do assistente para editar (respeitando a trava) |
| `.../:id/times` | master, admin | Times, dono vinculado, jogadores |
| `.../:id/eventos` | master, admin | Dias de jogos: criar, montar, reordenar, publicar e gerar a arte de divulgação de um dia publicado (abaixo) |
| `.../:id/jogos` | master, admin | Todos os jogos com filtros, do último para o primeiro (como em `/c/:slug/jogos`); acesso à súmula e ao W.O. |
| `.../:id/jogos/:jogoId/sumula` | master, admin | Súmula (seção 6.5) |
| `.../:id/jogos/:jogoId/mesa` | master, admin | Súmula ao vivo (seção 6.5.1): cronômetro, relógio de posse, lances, faltas e tempos. Tela para celular, tablet ou computador, sem o menu do painel |
| `.../:id/financeiro` | master, admin | Seção 8.1 |
| `.../:id/admins` | master | Quem administra a competição |
| `/painel/meus-times` | dono_time | Times vinculados ao dono |
| `/painel/meus-times/:timeId` | dono_time | Elenco (cadastro com foto) e pagamentos do elenco (8.2) |

**Arte de divulgação do dia** (botão "Gerar Arte" no cartão de um dia publicado com jogos)
- Imagem PNG para o Instagram, em dois formatos: **post** 1080 × 1350 (4:5) e **story** 1080 × 1920 (9:16, com margens livres em cima e embaixo para os botões do Instagram).
- Cabeçalho: logo da liga (ou o nome, se não houver logo), "Jogos do dia", a data por extenso, o horário de início e o local; no rodapé, a marca Arretado Score. As observações do dia não entram.
- Três opções de conteúdo:
  - **Com horários** (padrão): os jogos na ordem do dia, cada um com "Jogo N", o horário, os dois times com os logos e a fase.
  - **Só os times**: os times que jogam no dia, um abaixo do outro (duas colunas a partir de 7 times), cada um uma vez, na ordem em que entram em quadra, sem confrontos nem horários.
  - **Agora em quadra**: um confronto só, em destaque, para postar durante o dia. Vem escolhido o jogo da vez (o primeiro do dia ainda sem resultado; com todos encerrados, o último) e dá para trocar por outro. O título vira "Agora em quadra" e o cartão mostra "Jogo N", os dois times com logos grandes, "VS", o horário e a fase. Se o jogo já terminou, o título vira "Resultado" e o cartão mostra o placar final. Confronto que depende do anterior continua como "Perdedor Jogo 1" / "Vencedor Jogo 1" até sair o resultado.
- Logo do time num círculo: o fundo do círculo (e a placa do logo da liga) usa a cor da borda do próprio logo, para um logo quadrado preto não ficar dentro de um círculo branco; logo com fundo transparente fica sobre branco. Time sem logo mostra um círculo com as iniciais.
- Os confrontos aparecem como no app (6.2, item 8): os que dependem do resultado anterior saem como "Perdedor Jogo 1 x C" e "Vencedor Jogo 1 x C". Jogo já encerrado mostra o placar no lugar do horário; W.O. e cancelado mostram o status.
- Gerada no navegador (canvas), nada é gravado no banco nem no Storage. A prévia abre num modal com a escolha do formato e os botões **Compartilhar** (menu do celular com o arquivo, pela Web Share API) e **Baixar PNG**. Sem suporte a compartilhar arquivo, "Compartilhar" baixa a imagem.

---

## 10. Segurança (RLS) e armazenamento

### 10.1 Funções auxiliares (SQL, `security definer`)
- `is_master()` — papel do usuário logado é `master` e está ativo.
- `is_admin_da_competicao(competicao_id)` — `is_master()` ou existe linha em `competicao_admins`.
- `is_dono_do_time(time_id)` — o usuário é o `dono_id` do time.

### 10.2 Policies
| Tabela | Leitura | Escrita |
|---|---|---|
| `profiles` | o próprio usuário; master vê todos; admin vê nome/papel de donos (para vincular) | master (via Edge Function); o próprio usuário só altera `precisa_trocar_senha` via fluxo de troca |
| `competicoes`, `fases`, `grupos`, `grupo_times`, `series`, `categorias_estatistica` | pública (anon) se `status <> 'rascunho'`; admins da competição sempre | admin da competição (respeitando `estrutura_travada` para fases, exceto master) |
| `competicao_admins` | admins da competição | master; o criador é inserido automaticamente |
| `times`, `jogadores` | pública (anon) se a competição não está em rascunho | admin da competição; dono do time (`jogadores` do seu time e `times.logo_url`/`nome` do seu time) |
| `eventos`, `jogos` | pública só de eventos publicados / jogos de eventos publicados ou encerrados | admin da competição |
| `jogo_jogadores`, `sumula_estatisticas` | pública para jogos encerrados | admin da competição (via RPC) |
| `jogo_mesa`, `jogo_lances` | admin da competição; pública (anon) em competição pública | admin da competição ou mesário com link válido (via RPC, 6.5.1) |
| `mesa_links` | admin da competição | ninguém direto (RPCs do coordenador) |
| `cobrancas` | admin da competição | admin da competição |
| `pagamentos_internos` | dono do time, master | dono do time, master |

Testar as policies com os quatro perfis (incluindo `anon`) antes de concluir cada etapa.

### 10.3 Storage
| Bucket | Público | Uso | Quem envia |
|---|---|---|---|
| `logos` | Sim | logos de competições e times | admin; dono (logo do seu time) |
| `fotos-jogadores` | Sim | fotos dos atletas | admin; dono (seu time) |
| `comprovantes` | Não | comprovantes de pagamento | admin da competição (URLs assinadas para leitura) |

- Redimensionar imagens no navegador antes do upload (máx. 800 px no maior lado, JPEG/WebP, qualidade ~0,8). Limite de 5 MB por arquivo.
- Caminho dos arquivos: `{competicao_id}/{entidade}/{id}.{ext}`.

---

## 11. Etapas de implementação

Implemente uma etapa por vez. Ao final de cada uma, rode o projeto, confira os critérios de aceite e pare para revisão antes de seguir.

**Etapa 1 — Base**
- Projeto Vite + React + TypeScript, rotas, layout público e layout do painel, tema e componentes base conforme a skill.
- Supabase: `profiles`, funções auxiliares, Edge Function `admin-users`, login, troca de senha obrigatória, tela de usuários do master.
- ✅ Master cria um admin e um dono; ambos entram e são forçados a trocar a senha; usuário desativado não entra.

**Etapa 2 — Competição, times e jogadores**
- Tabelas da seção 4.2 e 4.3, buckets de storage, assistente (etapas 1 a 3 e 6), telas de times e jogadores com upload de foto, vínculo de dono, área do dono.
- ✅ Admin cria competição com logo e categoria extra; cadastra 5 times com jogadores e fotos; dono vinculado edita só o próprio elenco; outro admin não vê a competição.

**Etapa 3 — Fases, jogos e eventos**
- Tabelas 4.4 e 4.5, etapa "Fases" do assistente com validação e resumo visual, iniciar competição, geração de jogos (6.1), criação de evento com sorteio, edição e publicação (6.2).
- ✅ Com 5 times em todos contra todos são gerados 10 jogos e cada time folga 1 vez por turno; evento com 2 jogos não repete time; pedir 3 jogos com só 2 possíveis sem repetição mostra o aviso.

**Etapa 4 — Súmula e classificação**
- Súmula completa e "só placar", W.O., trava de estrutura, `v_classificacao` com desempates (6.3), página pública de tabela.
- ✅ Placar sai da soma dos pontos; W.O. dá 20 x 0 e conta no saldo; dois times empatados em vitórias são ordenados por confronto direto e depois saldo; editar súmula atualiza a tabela.

**Etapa 5 — Playoffs**
- Séries, criação sob demanda dos jogos da série, avanço automático de fase, `cruzamento` (todos os modos), chaveamento público.
- ✅ Cenário completo: 5 times todos contra todos → semifinal melhor de 3 (1º x 4º, 2º x 3º) → final melhor de 3. O jogo 3 só aparece em 1 x 1; o campeão é definido e a competição encerra.
- ✅ Cenário com 8 times em 2 grupos → cruzado 1ºA x 2ºB → final.

**Etapa 6 — Rankings e área pública completa**
- `v_ranking_estatisticas`, páginas públicas restantes (início da competição, jogos, detalhe do jogo, times), Realtime.
- ✅ Ranking "Cestinha" com total e média; jogos "só placar" não entram; placar atualiza na página pública sem recarregar.

**Etapa 7 — Financeiro**
- Seção 8 completa.
- ✅ Por time: dono não vê a cobrança do time, mas controla os atletas; por jogador: cobrança por atleta; status atrasado calculado.

**Etapa 8 — Acabamento**
- Estados vazios, carregamento e erro em todas as telas; revisão mobile; revisão das policies com os 4 perfis; README com instalação, variáveis, primeiro master e deploy.

**Etapa 9 — Súmula ao vivo (mesa)**
- Regras da partida em `competicoes` (e no assistente), tabelas `jogo_mesa` e `jogo_lances`, RPCs da seção 6.5.1, tela `.../jogos/:jogoId/mesa` e o atalho "Súmula ao vivo" na súmula do jogo.
- ✅ Abrir a mesa, marcar os jogadores, iniciar o relógio, lançar +2 e +3 e ver o placar mudar; pausar, recarregar a página e o relógio continuar no tempo certo.
- ✅ O relógio de posse corre com o cronômetro, reinicia em 24 ou 14, volta a 24 depois de uma cesta e para tudo no estouro.
- ✅ 5ª falta exclui o jogador; a 5ª falta da equipe no período avisa o bônus; o 3º tempo na primeira metade é recusado.
- ✅ Desfazer anula o último lance e o placar volta.
- ✅ Empate no fim do 4º período abre prorrogação; encerrar grava placar, pontos por jogador, tabela e cestinha como a súmula normal.
- ✅ Sem internet, os lances ficam pendentes e sobem quando a conexão volta, sem duplicar; não dá para encerrar com fila pendente.
- ✅ Dono do time e visitante não escrevem em `jogo_mesa`/`jogo_lances` (leitura só em liga pública).
- ✅ O coordenador gera o link; o mesário abre sem login, lança e encerra; o jogo fica aguardando aprovação e não conta na tabela até o coordenador aprovar; reabrir devolve a mesa ao mesário; link cancelado ou expirado mostra "Link de mesa indisponível".
- ✅ A página pública do jogo e `/placar/:gameId` mostram placar e lances mudando sem recarregar.

**Etapa 10 — Placar ao vivo e súmula preenchida**
- (Feito na etapa 9: página pública do jogo com placar, período e relógio ao vivo e tela de placar.)
- Súmula para imprimir já preenchida com os lances: faltas por jogador, faltas da equipe, tempos, contagem de pontos e placar por período, para as assinaturas.

**Etapa 11 — Arte de divulgação do dia**
- Botão "Gerar Arte" nos dias publicados, prévia em modal e arte em canvas (9.3), sem mudança no banco.
- ✅ A arte tem o logo da liga, a data, o horário, o local e os jogos na ordem, com horário e logos dos times.
- ✅ Confrontos que dependem do resultado anterior aparecem como "Perdedor Jogo 1 x C" / "Vencedor Jogo 1 x C".
- ✅ Post (1080 × 1350) e story (1080 × 1920), com horários ou só os times; nomes longos diminuem a fonte sem sair do cartão.
- ✅ "Agora em quadra" traz o primeiro jogo sem resultado; trocar o confronto gera a arte dele; jogo encerrado sai como "Resultado" com o placar.
- ✅ Logo com fundo preto fica num círculo preto; logo transparente, num círculo branco.
- ✅ No celular, "Compartilhar" abre o menu com a imagem; no computador, "Baixar PNG" salva o arquivo.

**Etapa 12 — Página do jogador**
- Rota pública `/c/:slug/jogadores/:jogadorId` (6.7.1), com links a partir do elenco do time, dos rankings e do box score. Sem mudança no banco.
- ✅ Tocar num jogador no elenco, no ranking ou no box score abre a página dele.
- ✅ Os totais e as médias são os mesmos do ranking; o jogo a jogo lista cada partida com adversário, resultado e os números do jogador.
- ✅ Jogo "só placar" e W.O. não aparecem no jogo a jogo nem contam nos números.
- ✅ Jogador sem jogos mostra o cabeçalho e o aviso de que ainda não há números; visitante não vê jogador de liga em rascunho.

---

## 12. Fora do escopo desta versão
- Pagamento online (Pix/cartão).
- Substituições e controle de quem está em quadra na súmula ao vivo.
- Estatísticas além dos pontos lançadas ao vivo (rebotes, assistências…): completadas na súmula normal.
- Vários jogos simultâneos / mais de uma quadra por dia.
- Notificações (e-mail, WhatsApp, push).
- App nativo (a versão web deve funcionar bem no celular).
- Cadastro aberto de usuários.

---

## 13. Glossário
- **Evento / dia de jogos**: uma data, num local, com uma sequência de jogos.
- **Série**: confronto de mata-mata disputado em melhor de N jogos.
- **Origem**: regra que diz de onde vem um time de uma série ("1º da Fase 1", "vencedor da S1").
- **Súmula**: registro do jogo com as estatísticas de cada jogador.
- **W.O.**: vitória por ausência do adversário.
- **Mesa / mesário**: quem registra a súmula durante o jogo (pontos, faltas, tempos e cronômetro).
- **Lance**: cada registro da mesa (ponto, falta ou tempo debitado), com período e tempo do relógio.
- **Bônus**: situação da equipe que passou do limite de faltas no período; as faltas seguintes dão lances livres ao adversário.
