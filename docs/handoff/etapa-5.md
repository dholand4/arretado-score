# Ficha de tarefa — Etapa 5: Playoffs

Você trabalha **sozinho** neste worktree (`../torneiomais-etapa5`, ramo `etapa-5`). Este ramo parte do `etapa-4` (contrato do banco + Etapa 4 já prontos). A Etapa 3 está sendo feita em paralelo em outro worktree e **ainda não está neste ramo**. Não espere por ela nem mexa no trabalho dela.

## 0. Antes de começar
1. Leia `CLAUDE.md`, `docs/SPEC.md` (inteira) e `.claude/skills/front-react/SKILL.md`. Siga tudo o que está neles.
   - A skill foi escrita para React Native. Neste projeto web ela já foi adaptada: **React Router** (rotas em `src/routes/`) e **Vitest + @testing-library/react** (`npm test`). O resto vale igual: estrutura de pastas, nomes `xxxGlobal`/`xxxScreen`, `index.tsx` + `style.ts` + `types.ts` + `__tests__`, styled-components com tokens de `src/constants/theme.ts`, sem `any`.
2. Leia `docs/handoff/etapa-4.md` e `docs/handoff/etapa-4-relatorio.md` para saber o que a Etapa 4 entregou.
3. Leia as migrations em `supabase/migrations/`, em especial `20261029140000_contrato_estrutura_completa.sql` (tabelas `fases`, `grupos`, `grupo_times`, `series`, `jogos`; view `v_classificacao`) e `20261030100000_etapa4_sumula.sql` (`registrar_resultado_jogo`, `classificacao_ordenada`, `melhores_extras` e a função vazia **`pos_resultado_jogo`**, que é o seu ponto de entrada).

## 1. Ambiente (já pronto)
- Supabase local **deste worktree** rodando nas portas **546xx** (API `http://127.0.0.1:54621`, banco `54622`, Studio `54623`). O `.env.local` já aponta para ele.
- Comandos: `npx supabase migration up`, `npx supabase db reset`, `npm run db:types`, `npm run dev -- --port 5275`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- Se o Supabase deste worktree estiver parado: `npx supabase start` **dentro deste worktree**.
- Logins de teste: cabeçalho de `supabase/seed.sql`. O seed tem a "Liga Amadora de Basquete 2026" em andamento: Fase 1 todos contra todos com 5 times e 10 jogos (4 avançam), Fase 2 semifinal melhor de 3 com as séries **S1 (1º x 4º)** e **S2 (2º x 3º)**, Fase 3 final melhor de 3 com **S3 (vencedor S1 x vencedor S2)**, todas com origens e times nulos.

## 2. Escopo exato
Seção 11, **Etapa 5**: "Séries, criação sob demanda dos jogos da série, avanço automático de fase, `cruzamento` (todos os modos), chaveamento público."

Seções da spec: **4.4 e 4.4.1** (fases, séries, origens, cruzamentos), **6.6** (séries e avanço de fase), **6.5** (ao salvar: atualiza a série e dispara o avanço), **6.4** (no mata-mata, W.O. conta como vitória na série), **6.3** (classificação e melhores extras usados nas origens), **9.1** (`/c/:slug/playoffs`), **10.2** (RLS).

Entregas:
1. **Implementar `public.pos_resultado_jogo(p_jogo_id)`** numa migration nova (`create or replace`). Ela já é chamada ao final de toda súmula, "só placar", W.O. e edição. Nela:
   - **Série melhor de N**: recalcular `vitorias_a`/`vitorias_b` a partir dos jogos da série (`encerrado`/`wo`; W.O. conta como vitória para o presente); vence quem chega a ⌈N/2⌉; atualizar `status` e `vencedor_id`. Se a série não está decidida e não há jogo em aberto, **criar o próximo jogo** (`pendente`, `numero_na_serie` + 1). Mando: o time de melhor campanha (`time_a`) é mandante nos jogos ímpares. Se uma edição de resultado decidir a série antes, os jogos ainda não disputados dela devem sair. Se uma edição "desfizer" a decisão, trate de forma consistente e documente.
   - **Fase concluída** (6.6): todos contra todos / grupos quando todos os jogos estão `encerrado`, `wo` ou `cancelado`; mata-mata quando todas as séries estão `concluida`. Ao concluir: marcar a fase `concluida` e a próxima `em_andamento`; **resolver as origens** da próxima fase (`posicao`, `posicao_grupo`, `vencedor`, `perdedor`, incluindo `melhores_extras` e `disputa_terceiro`), preencher `time_a_id`/`time_b_id` (**`time_a` = melhor campanha**) e criar o **jogo 1** de cada série com os dois times definidos. Se não houver próxima fase: competição `encerrada`; o campeão é o vencedor da última série (ou o 1º da última classificação).
   - **Próxima fase do tipo todos contra todos ou grupos**: a geração desses jogos é da Etapa 3, que vai fornecer (assinaturas atuais, ainda podem mudar) `public.distribuir_grupos(p_fase_id uuid, p_times uuid[], p_distribuicao jsonb)` e `public.gerar_jogos_fase(p_fase_id uuid, p_times uuid[] default null)`. Elas **não existem neste ramo**. Isole a chamada numa função sua (ex.: `etapa5_gerar_jogos_proxima_fase`) que use `to_regprocedure` e, se a função da Etapa 3 não existir, levante uma exceção clara. **Não** crie funções com esses nomes. Esse caminho fica fora do aceite e será ligado na junção.
   - **Cruzamentos** (4.4.1), todos os modos: `por_campanha` (1º x último, 2º x penúltimo...), `cruzado_grupos` (1ºA x 2ºB, 1ºB x 2ºA, 1ºC x 2ºD...), `vencedores` (vencedor S1 x vencedor S2..., e com `disputa_terceiro` a série dos perdedores), `manual` (origens definidas pelo admin). As séries já vêm gravadas com as origens pelo assistente (Etapa 3) ou pelo seed; o seu trabalho é **resolvê-las**.
   - Tudo transacional, `security definer`, `set search_path = ''`.
2. **"Melhor campanha"**: a spec não define como comparar times vindos de grupos diferentes ou de séries anteriores. Escolha a regra mais conservadora apoiada na spec (ex.: posição na fase anterior; entre grupos, os critérios de melhores extras da 6.3), aplique de forma consistente e **registre em "Dúvidas"**.
3. **W.O. duplo no mata-mata**: hoje `registrar_resultado_jogo` aceita W.O. duplo (0 x 0, sem vencedor) em qualquer fase, mas no mata-mata "sempre precisa haver vencedor" (6.5). Decida o tratamento (recusar W.O. duplo em jogo de série é o mais conservador). Se precisar mudar a RPC da Etapa 4, faça em migration **nova** (`create or replace`) e documente.
4. **Chaveamento público** `/c/:slug/playoffs` (9.1): chaveamento visual das fases de mata-mata, com placar da série (ex.: 2–1), jogos de cada série e as **origens pendentes** ("1º colocado da Fase 1 x 4º colocado da Fase 1", "Vencedor S1") enquanto a fase anterior não termina; destaque do campeão quando a competição encerra. Funciona sem login (anon), mobile-first (no celular, uma coluna por fase com rolagem).

Fora do escopo: súmula, W.O. e classificação (Etapa 4, já pronta — só a mudança do item 3, se necessária); fases do assistente, iniciar e dias de jogos (Etapa 3); rankings, demais páginas públicas e Realtime (Etapa 6); financeiro (Etapa 7).

## 3. Qualidade do front (obrigatório)
- **Dados só em `src/services/`, regras e estado em hooks de `src/hooks/`** (com testes em `src/hooks/__tests__/`). Telas e componentes `Global` só renderizam: nada de `useQuery`/`useMutation`/`supabase` dentro deles.
- JSX formatado como o código existente (um elemento por linha, nada de linhas gigantes). Siga o estilo de `src/view/teamsScreen` e `src/view/competitionOverviewScreen`.
- Testes para toda tela, componente e hook novos (render, estados de carregamento/erro/vazio, interações).
- Confira a tela em 375 px de largura.

## 4. O que você PODE mexer
- **Migrations novas** em `supabase/migrations/` com **`etapa5` no nome** e versão **`20261031…`** (ex.: `20261031100000_etapa5_series_avanco.sql`). Não use versões `20261030…` (já ocupadas).
- **Rota pública nova**: em `src/routes/types.ts` acrescente só `publicPlayoffs: '/c/:slug/playoffs'` (padrão e construtor em `paths`) e registre-a em `src/routes/PublicStack.tsx`. Nada além disso em `src/routes/`.
- Tela nova `src/view/publicBracketScreen/`.
- **Arquivos novos** em `src/components/`, `src/hooks/`, `src/services/`, `src/utils/`, `src/constants/`, `src/@types/`, com seus testes.
- `src/constants/queryKeys.ts`: só **acrescentar** chaves num bloco `// Etapa 5`.
- `src/@types/database.ts`: regenere com `npm run db:types`.
- `scripts/aceite-etapa5.mjs` (novo) e uma linha `aceite:etapa5` em `package.json`.
- `docs/handoff/etapa-5-relatorio.md` (novo).

## 5. O que você NÃO pode mexer
- **Migrations existentes**. Ajuste = migration nova.
- `supabase/config.toml`, `supabase/seed.sql`, `.env.local`, `.env.example`, `AGENTS.md`, `CLAUDE.md`, `docs/SPEC.md`, `.claude/`, os arquivos de `docs/handoff/` das outras etapas.
- Telas das Etapas 3 e 4 (`eventsScreen`, `competitionWizardScreen`, `competitionOverviewScreen`, `gamesScreen`, `scoreSheetScreen`, `publicStandingsScreen`) e das Etapas 1 e 2.
- Não rode `supabase link`, não use projeto remoto, não mexa em `../torneiomais`, `../torneiomais-etapa3` nem `../torneiomais-etapa4`, não pare outros Supabase locais.
- Não instale dependências novas sem necessidade; se instalar, justifique.

## 6. Regras
- Não invente regra de campeonato. Se algo não estiver na spec ou for contraditório, escolha a opção mais conservadora, **anote em "Dúvidas"** no relatório e siga.
- Interface 100% em pt-BR, mobile-first. Datas/horários em `America/Fortaleza`.
- Toda tabela continua com RLS. Funções `security definer` com `set search_path = ''` e checagem de permissão quando chamáveis pela API.
- Nada de classificação ou campeão armazenado em coluna além do que o modelo da seção 4 já prevê (`series.vitorias_*`, `series.vencedor_id`, `status`).

## 7. Critérios de aceite (seção 11)
- ✅ **Cenário completo: 5 times todos contra todos → semifinal melhor de 3 (1º x 4º, 2º x 3º) → final melhor de 3.** Ao encerrar o último jogo da Fase 1, as semifinais recebem os times certos (pela `classificacao_ordenada`) e o jogo 1 de cada série; **o jogo 3 só aparece quando a série está 1 x 1**; ao fim da final, **o campeão é definido e a competição fica `encerrada`**. Use o seed (lance os 10 jogos pela `registrar_resultado_jogo`).
- ✅ **Cenário com 8 times em 2 grupos → cruzado 1ºA x 2ºB → final.** Monte no script: competição nova, 8 times, fase de grupos com 2 grupos e os jogos, fase de mata-mata `cruzado_grupos` e final `vencedores`, com as séries e origens gravadas (como o assistente da Etapa 3 gravaria).
- Também: W.O. em série conta como vitória do presente; edição de resultado recalcula a série; mando nos jogos ímpares para `time_a`; chaveamento público mostra origens pendentes e depois os times; anon lê o chaveamento de competição pública e não de rascunho; outro admin e dono não alteram séries.

Comprove assim:
1. `npx supabase db reset` sobe sem erro.
2. `scripts/aceite-etapa5.mjs` (modelo: `scripts/aceite-etapa4.mjs`) cobre os dois cenários e os itens acima, **com os 4 perfis** (master, admin, dono_time e anon).
3. `npm run aceite:etapa4` e `npm run aceite:etapa2` continuam passando (rode `db reset` antes de cada um).
4. `npm test`, `npm run lint`, `npm run typecheck` e `npm run build` passam.

## 8. Ao terminar
1. Escreva `docs/handoff/etapa-5-relatorio.md` com: **o que foi feito**; **arquivos criados/alterados**; **migrations novas**; **decisões tomadas**; **dúvidas**; **o que ficou pendente** (inclua o ponto de ligação com a Etapa 3); e o resultado dos comandos do item 7.
2. Faça **commit no ramo `etapa-5`** (mensagem em pt-BR). Não faça push, merge nem rebase. Não commite `docs/handoff/etapa-5-log.txt`.
