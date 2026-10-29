# Relatório — Etapa 3: Fases, jogos e eventos

Ramo `etapa-3`, worktree `../torneiomais-etapa3`. Supabase local deste worktree (portas 544xx).

## O que foi feito

### Banco (3 migrations novas, todas as operações de várias tabelas em RPC `security definer` com `set search_path = ''` e checagem de permissão no início)

- **Configuração das fases** — `salvar_fases(p_competicao_id, p_fases jsonb)`:
  - grava todas as fases em ordem numa transação; `entrada` = `{"tipo":"todos_os_times"}` na fase 1 e `{"tipo":"classificados","fase_ordem":N-1}` nas seguintes;
  - valida a coerência: fase 1 não pode ser mata-mata; classificados obrigatórios quando há fase seguinte; grupos (≥ 2 grupos, mínimo de 2 times por grupo, classificados cabem no menor grupo, melhores extras viáveis); mata-mata com número **par** de times; cruzamento compatível com a fase anterior; disputa de 3º só na final vinda de séries;
  - grava as **séries com as origens** e os times nulos (4.4.1) para os 4 modos: `por_campanha` (1º x último, 2º x penúltimo…), `cruzado_grupos` (1ºA x 2ºB, 1ºB x 2ºA…), `vencedores` (venc. S1 x venc. S2…) e `manual` (confrontos escolhidos entre as origens disponíveis, sem repetir); com `disputa_terceiro`, cria a série entre os perdedores (`perdedor S1 x perdedor S2`). Códigos `S1, S2…` únicos na competição, em ordem de fase (como no seed). No mata-mata, `classificam` = número de séries (vencedores que avançam), como no seed;
  - checa `is_admin_da_competicao` e `pode_editar_estrutura` (trava: só master). Depois de iniciada, fases que já começaram só mudam nome e classificados (o `id` da fase é preservado, então os jogos não se perdem); fases aguardando podem ser trocadas livremente.
- **Iniciar competição** — `iniciar_competicao(p_competicao_id, p_distribuicao jsonb default null)`: exige ≥ 2 times e fase 1; confere a fase 1 contra os times cadastrados; status → `em_andamento`, fase 1 → `em_andamento`; grupos com sorteio aleatório equilibrado (tamanhos diferem no máximo em 1) ou distribuição manual (`{"A":[ids],"B":[ids]}`, obrigatória quando `sorteio_grupos = 'manual'`); gera todos os jogos da fase 1 como `pendente`, sem data. Devolve o número de jogos.
- **Sortear grupos de novo** — `sortear_grupos(p_fase_id, p_distribuicao default null)`: só com nenhum jogo da fase com súmula; apaga e gera de novo os jogos.
- **Geração de jogos (6.1)** — `rodizio(n, turnos)` (método do círculo, função pura): número ímpar ganha um "folga" e cada time folga 1 vez por turno; `turnos = 2` repete invertendo o mando; cada jogo com `rodada`; mando equilibrado (no máximo 1 jogo de diferença entre casa e fora). RPC `gerar_jogos_fase(p_fase_id, p_times uuid[] default null)` para fases de todos contra todos/grupos em andamento (por grupo quando é fase de grupos) — já pronta para a Etapa 5 gerar as fases seguintes.
- **Dias de jogos (6.2)**:
  - `criar_evento(...)`: candidatos = jogos `pendente` das fases em andamento (no mata-mata, só o próximo jogo de cada série não decidida com os dois times definidos); seleção priorizando rodada mais antiga, depois times com menos jogos realizados/agendados, sem repetir time, sorteio entre equivalentes. Se o pedido exigir jogo duplo, **nada é gravado** e a resposta traz `precisa_confirmar = true` e `max_sem_repeticao = X`; com `p_permitir_duplo = true` completa repetindo o mínimo possível. Com menos candidatos que o pedido, cria com o que existir. Ordem aleatória, procurando uma ordem sem jogos consecutivos do mesmo time; `inicio_previsto = data + hora_inicio + (i × intervalo)` em `America/Fortaleza`. Evento nasce `rascunho`; jogos ficam `agendado`;
  - `sortear_evento(p_evento_id, p_permitir_duplo, p_qtd_jogos default null)`, `reordenar_evento`, `trocar_jogo_evento`, `remover_jogo_evento` (volta a `pendente`), `publicar_evento`, `excluir_evento` (jogos sem súmula voltam a `pendente`) e `jogos_candidatos_evento` (lista para "trocar jogo").
- A visibilidade pública já vinha da RLS do contrato: anon só vê eventos publicados e jogos de eventos publicados (ou encerrados).

### Front-end
- **Assistente → etapa "Fases"** habilitada em `WIZARD_STEPS`: adicionar/remover fases, campos por tipo, confrontos manuais com as origens disponíveis, prévia das séries geradas (ex.: "S1: 1º colocado da Fase 1 x 4º colocado da Fase 1"), **validação** (erros por campo ao salvar; avisos que dependem dos times cadastrados) e **resumo visual** do formato, ex.: `Fase 1: 5 times, todos contra todos, 10 jogos → 4 avançam → Semifinal melhor de 3: 1º x 4º, 2º x 3º → Final melhor de 3`. Estrutura travada: admin vê aviso e o passo fica só leitura; master vê aviso de recálculo. A etapa "Revisão" ganhou o card "Formato".
- **Visão geral**: "Próximos passos" inclui as fases; card "Iniciar competição" com o resumo e o que falta (times, fases, incoerências); confirmação antes de iniciar; distribuição manual dos grupos quando configurada. Em andamento: "X jogos da Fase 1 sem dia definido" (atalho para os dias de jogos), "Faltam N súmulas para fechar a Fase 1", lista de fases com status e card de grupos com "Sortear de novo"/"Redistribuir" (bloqueado com motivo quando há súmula ou jogos em dias de jogos).
- **Dias de jogos** (`/painel/competicoes/:id/eventos`): criar dia (data, local e intervalo pré-preenchidos com os padrões, hora de início, quantidade de jogos, observações); aviso **"Só é possível montar X jogos sem repetir time. Deseja permitir jogo duplo?"** com as opções "Permitir jogo duplo" / "Montar só X jogos" / "Cancelar"; aviso quando há menos jogos disponíveis que o pedido; cards por dia com reordenar (arrastar + botões ↑/↓), remover, trocar jogo (marca candidatos cujo time já joga no dia), sortear de novo, publicar e excluir; dia publicado fica só leitura (pode ser excluído).
- Verificado no navegador (Vite deste worktree) com uma competição de 5 times: fases → resumo → iniciar (10 jogos) → dia com 3 jogos (aviso de jogo duplo, jogos do time repetido não consecutivos) → trocar jogo; layout conferido em 375 px.

## Arquivos criados
- `supabase/migrations/20261030100000_etapa3_fases.sql`
- `supabase/migrations/20261030110000_etapa3_iniciar_gerar_jogos.sql`
- `supabase/migrations/20261030120000_etapa3_eventos.sql`
- `scripts/aceite-etapa3.mjs`
- `src/@types/phase.ts`, `src/@types/event.ts`
- `src/constants/phase.ts`
- `src/utils/phaseFormat.ts`, `src/utils/eventSchedule.ts` (+ testes em `src/utils/__tests__/`)
- `src/services/phasesService.ts`, `src/services/eventsService.ts`
- `src/hooks/usePhases.ts` (`usePhases`, `useGamesProgress`), `src/hooks/useEvents.ts` (`useEvents`, `useEventCandidates`) (+ testes)
- Componentes (cada um com `index.tsx`, `style.ts`, `types.ts`, `__tests__`): `formatSummaryGlobal`, `phaseFormGlobal`, `phasesEditorGlobal`, `competitionStartGlobal`, `groupsCardGlobal`, `groupsDistributionModalGlobal`, `eventFormModalGlobal`, `doubleGameDialogGlobal`, `eventCardGlobal`, `swapGameModalGlobal`
- `src/view/eventsScreen/style.ts`
- `docs/handoff/etapa-3-relatorio.md`

## Arquivos alterados
- `src/view/competitionWizardScreen/` (`index.tsx`, `style.ts`, teste): passo Fases e card "Formato" na revisão.
- `src/view/competitionOverviewScreen/` (`index.tsx`, `style.ts`, teste): iniciar competição, próximos passos, grupos.
- `src/view/eventsScreen/` (`index.tsx`, teste): tela definitiva no lugar da provisória.
- `src/constants/competition.ts`: "Fases" habilitada.
- `src/constants/queryKeys.ts`: só acréscimos, bloco `// Etapa 3`.
- `src/utils/competitionChecklist.ts`: item de fases real e `buildProgressChecklist`; `src/utils/__tests__/competition.test.ts` ajustado (o teste antigo afirmava que "Fases" estava indisponível).
- `src/@types/database.ts`: regenerado com `npm run db:types`.
- `package.json`: linha `aceite:etapa3`.
- Nenhuma dependência nova; nenhuma rota nova; nenhuma migration existente alterada.

## Decisões tomadas
1. **Fase 1 não pode ser mata-mata** (validação no front e no banco): a spec diz que a fase 1 recebe "todos os times" e não define como semear um mata-mata sem campanha anterior.
2. **Última fase de pontos corridos/grupos** grava `classificam = null` (o 1º é o campeão). No mata-mata, `classificam` = número de séries (vencedores), como no seed.
3. **Origens**: além das 4 do exemplo da spec, uso `{"tipo":"melhor_extra","fase_ordem":N,"posicao":k}` para os "melhores extras" de uma fase de grupos no modo manual (definidos pela regra da 6.3). Em `por_campanha` depois de grupos, `posicao` = k-ésimo entre os classificados pela campanha geral. A série de 3º lugar é a que tem as duas origens `perdedor`.
4. `cruzado_grupos` exige, na fase anterior, número par de grupos, 2 classificados por grupo e nenhum melhor extra (é o único caso que a spec descreve). `vencedores` só depois de mata-mata; `por_campanha` só depois de todos contra todos/grupos.
5. A série da disputa de 3º usa o mesmo `melhor_de` da final.
6. Validações que dependem do número de times da fase 1 são **avisos** no assistente (os times podem ser cadastrados depois) e **bloqueiam** no "Iniciar competição" (front e banco).
7. Ordem dos times no rodízio é sorteada antes de aplicar o método do círculo (rodada 1 não é sempre a mesma). Mando: o time fixo alterna a cada rodada; os outros pares mantêm a posição — diferença máxima de 1 jogo entre casa e fora.
8. **Pedido de jogo duplo**: sem confirmação nada é gravado (a RPC devolve `precisa_confirmar`). O admin pode permitir o jogo duplo, montar só os X jogos possíveis ou cancelar. `qtd_jogos` do evento guarda a quantidade pedida (ou X, se escolheu montar só X); "sortear de novo" usa essa quantidade.
9. Prioridade da seleção: rodada mais antiga → menor carga (jogos realizados/agendados dos dois times) → sorteio. Com jogo duplo, completa primeiro com jogos que repetem só um time. O "X" do aviso vem dessa seleção gulosa (não é um emparelhamento máximo exato; nos casos testados coincide com o máximo).
10. Dia de jogos **publicado não é mais remontado** (reordenar, trocar, remover e sortear só em rascunho); pode ser excluído. Publicar exige ao menos 1 jogo. Não criei "despublicar" (não está na spec).
11. **Sortear grupos de novo** também é bloqueado quando algum jogo da fase já está em um dia de jogos (para não sumir jogo de um dia, inclusive publicado); a tela explica o motivo. A spec só fala da súmula.
12. Dia sem nenhum candidato não é criado (erro explicativo), em vez de criar um evento vazio.
13. Funções internas (`criar_jogos_rodizio`, `distribuir_grupos`, `gerar_jogos_da_fase`, `jogos_candidatos`, `selecionar_jogos_evento`, etc.) têm `execute` revogado de `anon`/`authenticated`; só as RPCs são expostas. A seleção usa tabelas temporárias (`truncate` em vez de `delete`, por causa do `pg_safeupdate` do Supabase).

## Dúvidas (escolhi a opção mais conservadora e segui)
1. Mata-mata como primeira fase: bloqueado (ver decisão 1). Se quiserem, dá para permitir com semeadura manual na Etapa 5.
2. **Ordem das séries no `por_campanha` com 8+ times**: segui a leitura literal (S1 = 1º x 8º, S2 = 2º x 7º, S3 = 3º x 6º, S4 = 4º x 5º). Com `vencedores` (venc. S1 x venc. S2) o 1º pode encontrar o 2º já na semifinal. Num chaveamento clássico a ordem seria 1x8, 4x5, 2x7, 3x6. Com 4 times (critério de aceite) não faz diferença.
3. Melhores extras no modo manual: criei a origem `melhor_extra` (decisão 3) — confirmar se é assim que a Etapa 5 deve resolver.
4. Edição de dia publicado (reordenar/trocar depois de publicado) e "despublicar": não implementados (decisão 10).
5. `qtd_jogos` do evento: guarda a quantidade pedida, não a montada (o card mostra "3 jogos (pedido: 4)" quando diferem).
6. O sorteio de grupos de novo é bloqueado quando há jogos da fase em dias de jogos (decisão 11).

## O que ficou pendente / observações
- `src/components/competitionReviewGlobal` (Etapa 2) ainda mostra o card "Fases e cobrança" dizendo que as fases "entram nas próximas etapas". Não alterei porque o componente não está na lista do que posso mexer; o formato aparece logo abaixo, no card "Formato" que acrescentei à revisão. Sugestão: trocar o texto do card para falar só da cobrança (Etapa 7).
- Fora do escopo, como pedido: preencher os times das séries, criar os jogos das séries, avançar de fase e gerar jogos das fases seguintes (Etapa 5 — `gerar_jogos_fase(p_fase_id, p_times)` já está pronta para isso); súmula/W.O./classificação (Etapa 4); páginas públicas (Etapa 6).
- Times cadastrados depois de iniciar a competição não ganham jogos automaticamente (só entram num novo sorteio de grupos). A spec não trata disso.
- `src/@types/database.ts` vai conflitar com a Etapa 4 no merge (os dois ramos regeneram o arquivo): basta regenerar depois de juntar as migrations.
- O aviso do Vite sobre bundle > 500 kB já existia.

## Resultado dos comandos
| Comando | Resultado |
|---|---|
| `npx supabase db reset` | ✅ sobe sem erro com as 6 migrations e o seed |
| `npm test` | ✅ 80 arquivos, 198 testes passando |
| `npm run lint` | ✅ sem erros |
| `npm run typecheck` | ✅ sem erros |
| `npm run build` | ✅ (só o aviso de bundle grande que já existia) |
| `npm run aceite:etapa3` | ✅ 95 verificações — fases/séries/validações (4 modos de cruzamento, 3º lugar), iniciar, 10 jogos e 1 folga por time (5 times), 20 jogos e 1 folga por turno (2 turnos), grupos (equilibrado, de novo, manual), eventos (2 jogos sem repetir time; pedir 3 → aviso com X = 2 e nada gravado; com confirmação, jogo duplo não consecutivo; reordenar, trocar, remover, sortear de novo, publicar, excluir, menos candidatos que o pedido), horários em America/Fortaleza, trava de estrutura, e policies com master, admin, outro admin, dono_time e anon (outro admin não gera jogos/eventos nem vê os rascunhos; anon não vê evento em rascunho nem jogos pendentes; anon vê o evento depois de publicado) |
| `npm run aceite:etapa1` | ✅ |
| `npm run aceite:etapa2` | ✅ |

O teste da trava de estrutura no `aceite:etapa3` usa a chave de serviço local obtida com `npx supabase status -o json` só para ligar `estrutura_travada` (o app não deixa ninguém fazer isso direto; quem liga é a Etapa 4). Se a chave não estiver disponível, esse teste é pulado com aviso.
