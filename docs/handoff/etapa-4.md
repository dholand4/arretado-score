# Ficha de tarefa — Etapa 4: Súmula e classificação

Você trabalha **sozinho** neste worktree (`../torneiomais-etapa4`, ramo `etapa-4`). Outro agente faz a Etapa 3 (fases, geração de jogos e dias de jogos) em paralelo, em outro worktree. Não espere por ele nem mexa no trabalho dele: você testa com os dados do seed.

## 0. Antes de começar
1. Leia `CLAUDE.md`, `docs/SPEC.md` (inteira) e `.claude/skills/front-react/SKILL.md`. Siga tudo o que está neles.
   - A skill foi escrita para React Native. Neste projeto web ela já foi adaptada: **React Router** (rotas em `src/routes/`) no lugar de React Navigation, e **Vitest + @testing-library/react** (`npm test`) no lugar de Jest/RN. O resto vale igual: estrutura de pastas, nomes `xxxGlobal`/`xxxScreen`, `index.tsx` + `style.ts` + `types.ts` + `__tests__`, styled-components com tokens de `src/constants/theme.ts`, sem `any`.
2. Leia o código existente antes de criar algo. **Reutilize** os componentes de `src/components/` (botões, inputs, checkbox, modal, cards, alerts, avatar, badge, empty/error states, `publicLayoutGlobal`...), os hooks e services existentes e os helpers de `src/utils/`.
3. Leia as migrations em `supabase/migrations/`, em especial `20261029140000_contrato_estrutura_completa.sql`. Ela já cria `jogos`, `jogo_jogadores`, `sumula_estatisticas`, `series`, as policies e a view **`v_classificacao`** (números por fase/grupo, **sem ordenação**). Leia os comentários dela. Os tipos TypeScript estão em `src/@types/database.ts`.

## 1. Ambiente (já pronto)
- Supabase local **deste worktree** já está rodando nas portas **545xx** (API `http://127.0.0.1:54521`, banco `54522`, Studio `54523`). O `.env.local` já aponta para ele.
- Comandos: `npx supabase migration up`, `npx supabase db reset` (recria do zero com seed), `npm run db:types`, `npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- Se o Supabase deste worktree estiver parado: `npx supabase start` **dentro deste worktree**.
- Logins de teste: cabeçalho de `supabase/seed.sql`.
- **Dados para testar** (seed): "Liga Amadora de Basquete 2026" (`c0000000-...-0001`), **em andamento**, 5 times com 8 jogadores, categorias Pontos (placar), Rebotes e Assistências; Fase 1 todos contra todos (`f0000000-...-0001`, em andamento, 4 avançam) com os **10 jogos** já gerados (`d0000000-...-0001` a `...0010`; os dois primeiros `agendado` num dia publicado, os demais `pendente`); Fase 2 semifinal melhor de 3 e Fase 3 final melhor de 3 com as séries S1/S2/S3 com origens e times nulos.

## 2. Escopo exato
Seção 11, **Etapa 4**: "Súmula completa e 'só placar', W.O., trava de estrutura, `v_classificacao` com desempates (6.3), página pública de tabela."

Seções da spec que regem esta etapa: **6.3** (classificação e desempates), **6.4** (W.O.), **6.5** (súmula), **5** (trava de estrutura), **4.5** (jogos, `jogo_jogadores`, `sumula_estatisticas`), **4.7** (views e `classificacao_ordenada`), **9.1** (`/c/:slug/tabela`), **9.3** (`.../:id/jogos` e `.../:id/jogos/:jogoId/sumula`), **10.2** (RLS).

Entregas:
1. **RPCs transacionais** (`security definer`, `set search_path = ''`, checam `is_admin_da_competicao` no início). A súmula **só** é gravada por RPC: a tabela não aceita escrita direta do front.
   - **Salvar súmula completa**: presença por jogador e valores por categoria ativa; o **placar é calculado no banco** como a soma da categoria `soma_no_placar` de cada time (não confie no placar vindo do front); `status = 'encerrado'`, `so_placar = false`, `vencedor_id`; grava `jogo_jogadores` e `sumula_estatisticas`.
   - **Lançar só o placar**: placar informado, `so_placar = true`; conta para tabela e séries, não para rankings. Decida e documente o que acontece com estatísticas que já existiam.
   - **W.O.** (6.4): ausente `casa`/`fora`/`ambos`; placar automático `wo_placar_vencedor x wo_placar_perdedor` da competição; W.O. duplo = 0 x 0, sem vencedor; sem estatísticas de jogadores.
   - **Validações** (6.5): empate só se `permite_empate` **e** a fase não for `mata_mata`; no mata-mata sempre há vencedor; jogo `cancelado` não recebe súmula.
   - **Trava de estrutura** (5): a primeira súmula/W.O. da competição marca `competicoes.estrutura_travada = true`. A RLS de `fases` e o trigger de `competicoes` já impedem o admin de mexer em fases/pontuação/critérios depois disso; só o master pode.
   - **Edição**: a súmula pode ser editada depois. Se a fase do jogo já estiver `concluida` e a fase seguinte já tiver jogos encerrados, **só o master** pode editar (com aviso na tela).
   - **Ponto de extensão para a Etapa 5**: crie a função `public.pos_resultado_jogo(p_jogo_id uuid)` **vazia** (no-op, com comentário "implementada na Etapa 5: atualizar série e verificar avanço de fase — 6.5/6.6") e chame-a ao final de toda RPC que encerra, edita ou registra W.O. de um jogo. **Não** implemente série nem avanço de fase.
2. **Classificação ordenada**: função `classificacao_ordenada(fase_id, grupo_id)` (4.7) que usa `v_classificacao` e aplica PTS desc e os `criterios_desempate` da competição na ordem configurada: `confronto_direto` (PTS e depois saldo **só nos jogos entre os empatados**; com 3+ empatados, se o critério separa só parte deles, reaplica a cadeia ao subgrupo que continuou empatado), `saldo`, `pontos_pro`, `vitorias`; último recurso: ordem alfabética com indicador de **empate técnico**. Inclua o **ajuste manual de posição** (6.3: "só admin, registrado"). A spec não define a tabela: crie a estrutura que precisar numa migration nova e explique no relatório. Implemente também a comparação dos **melhores extras entre grupos** (6.3, último item: PTS, depois aproveitamento, saldo e pontos pró), que a Etapa 5 vai usar.
   - Convenção já adotada na view: **D = total de derrotas (inclui as por W.O.); WO = quantas delas foram por W.O.; J = V + E + D**. Se discordar, registre em "Dúvidas"; não mude a view sem justificar.
3. **Telas**:
   - `src/view/gamesScreen` (rota já registrada `/painel/competicoes/:competitionId/jogos`): todos os jogos com filtros (fase, time, status), acesso à súmula e ao W.O.
   - `src/view/scoreSheetScreen` (rota `/painel/competicoes/:competitionId/jogos/:gameId/sumula`): duas listas (um time em cada) com todos os jogadores **ativos**; caixa "jogou" e um campo numérico por categoria ativa na ordem das categorias; em branco = 0; preencher qualquer número marca a presença; placar em tempo real no topo (soma da categoria de placar); opção "Lançar só o placar"; marcar W.O.; edição de súmula existente; mensagens das validações. Mobile-first: precisa ser usável no celular, à beira da quadra.
   - `src/view/publicStandingsScreen` (rota pública `/c/:slug/tabela`, já registrada no `PublicStack`): classificação por fase (abas) e por grupo, com J, V, E (só se `permite_empate`), D, WO, PTS, PF, PC, SALDO, %; linhas dos classificados destacadas; indicador de empate técnico. Funciona sem login (anon). A versão completa da área pública e o Realtime são da Etapa 6.
   - Aviso ao **master** de que "a tabela será recalculada" ao editar pontuação/critérios com a estrutura travada: o assistente é arquivo de outra etapa. Você pode acrescentar uma prop opcional em `src/components/scoringFormGlobal` para exibir esse aviso; a ligação no assistente será feita na junção (registre no relatório).

Fora do escopo (não implemente): fases/geração de jogos/dias de jogos (Etapa 3); séries, jogos de série e avanço de fase (Etapa 5); rankings e Realtime (Etapa 6); financeiro (Etapa 7).

## 3. O que você PODE mexer
- **Migrations novas** em `supabase/migrations/` com **`etapa4` no nome**, ex.: `20261030100000_etapa4_sumula.sql`. Toda mudança de banco (RPC, função, trigger, tabela de ajuste manual, índice, policy, ajuste na view) vira migration nova.
- `src/view/gamesScreen/`, `src/view/scoreSheetScreen/`, `src/view/publicStandingsScreen/` (substituir as telas provisórias).
- `src/components/scoringFormGlobal/` (só a prop opcional de aviso descrita acima).
- **Arquivos novos** em `src/components/`, `src/hooks/`, `src/services/`, `src/utils/`, `src/constants/`, `src/@types/`, com seus testes.
- `src/constants/queryKeys.ts`: só **acrescentar** chaves, num bloco comentado `// Etapa 4`.
- `src/@types/database.ts`: regenere com `npm run db:types` depois das suas migrations.
- `scripts/aceite-etapa4.mjs` (novo) e uma linha `aceite:etapa4` em `package.json`.
- `docs/handoff/etapa-4-relatorio.md` (novo).

## 4. O que você NÃO pode mexer
- **Migrations existentes** (qualquer arquivo que já está em `supabase/migrations/`). Ajuste = migration nova.
- `supabase/config.toml`, `supabase/seed.sql`, `.env.local`, `.env.example`, `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `docs/SPEC.md`, `.claude/`.
- Telas de outras etapas: `src/view/eventsScreen`, `competitionWizardScreen`, `competitionOverviewScreen` (Etapa 3) e as demais telas das Etapas 1 e 2.
- `src/routes/` (as rotas desta etapa já estão registradas). Se realmente precisar de rota nova, explique no relatório.
- Não rode `supabase link`, não use projeto remoto, não mexa no worktree principal (`../torneiomais`) nem no da Etapa 3, não pare outros Supabase locais.
- Não instale dependências novas sem necessidade; se instalar, justifique no relatório.

## 5. Regras
- Não invente regra de campeonato. Se algo não estiver na spec ou for contraditório, escolha a opção mais conservadora, **anote em "Dúvidas"** no relatório e siga.
- Tabela e rankings são calculados por views/funções SQL, **nunca armazenados em colunas**.
- Interface 100% em pt-BR, mobile-first. Datas/horários em `America/Fortaleza`.
- Toda tabela continua com RLS. Funções `security definer` com `set search_path = ''` e checagem de permissão no início.

## 6. Critérios de aceite (seção 11)
- ✅ **O placar sai da soma dos pontos** (categoria de placar) da súmula.
- ✅ **W.O. dá 20 x 0 e conta no saldo** (e nos pontos a favor/contra); o ausente recebe `pontos_derrota_wo` e soma 1 em WO; W.O. duplo 0 x 0 sem vencedor.
- ✅ **Dois times empatados em vitórias são ordenados por confronto direto e depois saldo.** Monte também um caso de 3 times empatados em que o confronto direto separa só um deles.
- ✅ **Editar a súmula atualiza a tabela.**
- Também: "só placar" conta na tabela e não gera estatísticas; empate recusado em basquete e em mata-mata; primeira súmula trava a estrutura (admin não altera mais pontuação/fases, master sim); tabela pública abre sem login.

Comprove assim:
1. `npx supabase db reset` sobe sem erro com todas as migrations.
2. `scripts/aceite-etapa4.mjs` (modelo: `scripts/aceite-etapa2.mjs`) cobre os critérios acima usando os jogos do seed (o script pode lançar resultados pelas suas RPCs; rode `db reset` antes de cada execução, se precisar) **e testa as policies com os 4 perfis** (master, admin, dono_time e anon), incluindo: outro admin e dono não lançam súmula; anon lê a súmula só de jogo encerrado; ninguém escreve em `sumula_estatisticas` direto pela API.
3. `npm test`, `npm run lint`, `npm run typecheck` e `npm run build` passam. Testes para toda tela, componente e hook novos.
4. `npm run aceite:etapa1` e `npm run aceite:etapa2` continuam passando.

## 7. Ao terminar
1. Escreva `docs/handoff/etapa-4-relatorio.md` com: **o que foi feito**; **arquivos criados/alterados**; **migrations novas**; **decisões tomadas**; **dúvidas**; **o que ficou pendente**; e o resultado dos comandos do item 6.
2. Faça **commit no ramo `etapa-4`** (mensagem em pt-BR). Não faça push, merge nem rebase. Não commite `docs/handoff/etapa-4-log.txt`.
