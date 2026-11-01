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
| **Admin** | Sim | Cria competições e administra apenas as suas: configuração, times, jogadores, dias de jogos, súmulas, W.O., financeiro da competição. |
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

Ao criar a competição, o sistema cria automaticamente a categoria de placar conforme a modalidade:
| Modalidade | Nome | Sigla | Título do ranking |
|---|---|---|---|
| basquete | Pontos | PTS | Cestinha |
| futsal | Gols | GOL | Artilheiro |
| volei | Pontos | PTS | Maior pontuador |
| outro | Pontos | PTS | Maior pontuador |

O admin pode adicionar quantas categorias quiser (ex.: no basquete, Rebotes, Assistências, Tocos). Cada categoria ativa ganha um ranking próprio.

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
2. **Pontuação e W.O.** — vem preenchido com o padrão (vitória 1, derrota 0, W.O. 20 x 0, derrota por W.O. 0). Botão "Usar padrão FIBA" troca para vitória 2, derrota 1, derrota por W.O. 0. Futsal liga empate por padrão (vitória 3, empate 1, derrota 0). Ordem dos critérios de desempate arrastável.
3. **Estatísticas** — lista com a categoria de placar (fixa, só renomeável) e botão para adicionar outras (nome, sigla, título do ranking).
4. **Fases** — o admin adiciona fases em ordem. Para cada uma: nome, tipo e os campos do tipo (seção 4.4). Mostra um **resumo visual** do formato (ex.: "Fase 1: 5 times, todos contra todos, 10 jogos → 4 avançam → Semifinal melhor de 3: 1º x 4º, 2º x 3º → Final melhor de 3"). Valida a coerência (ex.: classificados precisam caber no mata-mata seguinte, que precisa de número par de times).
5. **Cobrança** — nenhuma, por time ou por jogador; valor, dia de vencimento, mês de início, quantidade de meses.
6. **Revisão** — resumo completo.

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
- Cada jogo gerado recebe `rodada`. A rodada serve para priorizar a ordem, mas os jogos são distribuídos nos dias pelo admin (6.2).

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
8. **Como os confrontos aparecem** (painel e área pública): cada jogo mostra seu número no dia ("Jogo 1", "Jogo 2"…). Enquanto um jogo não tem resultado, os que dependem dele aparecem como "Perdedor Jogo 1 x C" e "Vencedor Jogo 1 x C" (sem a rodada, que só se define depois). Só quando os dois candidatos têm o mesmo adversário; nos outros casos aparecem os nomes.

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

---

## 7. Usuários e autenticação

- Login por e-mail e senha (Supabase Auth). Sem cadastro público, sem login social.
- **Edge Function `admin-users`** (usa `service_role`, verifica que quem chama é `master`):
  - `create`: nome, e-mail, senha provisória, papel → cria em `auth.users` e em `profiles` com `precisa_trocar_senha = true`.
  - `update`: nome, papel, ativo.
  - `reset_password`: define nova senha provisória e marca `precisa_trocar_senha = true`.
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
| `/c/:slug/jogos` | Jogos agrupados por dia (eventos publicados), com placar quando encerrados; filtros por fase e time |
| `/c/:slug/jogos/:jogoId` | Detalhe: placar, data/local, estatísticas por jogador (box score) |
| `/c/:slug/tabela` | Classificação por fase (abas) e por grupo; linhas dos classificados destacadas. Fases de mata-mata com melhores perdedores também aparecem, com a tabela da fase (6.6.1) |
| `/c/:slug/playoffs` | Chaveamento visual das fases de mata-mata, com placar da série (ex.: 2–1) e origens pendentes |
| `/c/:slug/rankings` | Rankings por categoria (abas com o título de cada uma) |
| `/c/:slug/times` | Lista de times |
| `/c/:slug/times/:timeId` | Elenco com fotos, jogos do time, estatísticas do time |

Atualização ao vivo via Supabase Realtime nas páginas de jogos, tabela e detalhe do jogo.

### 9.2 Autenticação
`/login`, `/trocar-senha`.

### 9.3 Painel (com login)
| Rota | Quem | Conteúdo |
|---|---|---|
| `/painel` | todos | Atalhos conforme o papel |
| `/painel/usuarios` | master | Lista, criar, editar, desativar, redefinir senha |
| `/painel/competicoes` | master, admin | Competições (master vê todas; admin vê as suas) |
| `/painel/competicoes/nova` | master, admin | Assistente (seção 5) |
| `/painel/competicoes/:id` | master, admin | Visão geral: status, fase atual, próximos passos ("Faltam 3 súmulas para fechar a Fase 1") |
| `.../:id/configuracao` | master, admin | Etapas do assistente para editar (respeitando a trava) |
| `.../:id/times` | master, admin | Times, dono vinculado, jogadores |
| `.../:id/eventos` | master, admin | Dias de jogos: criar, montar, reordenar, publicar |
| `.../:id/jogos` | master, admin | Todos os jogos com filtros; acesso à súmula e ao W.O. |
| `.../:id/jogos/:jogoId/sumula` | master, admin | Súmula (seção 6.5) |
| `.../:id/financeiro` | master, admin | Seção 8.1 |
| `.../:id/admins` | master | Quem administra a competição |
| `/painel/meus-times` | dono_time | Times vinculados ao dono |
| `/painel/meus-times/:timeId` | dono_time | Elenco (cadastro com foto) e pagamentos do elenco (8.2) |

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

---

## 12. Fora do escopo desta versão
- Pagamento online (Pix/cartão).
- Súmula lance a lance e cronômetro.
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
