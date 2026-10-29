# Ficha de tarefa — Etapa 3: Fases, jogos e eventos

Você trabalha **sozinho** neste worktree (`../torneiomais-etapa3`, ramo `etapa-3`). Outro agente faz a Etapa 4 em paralelo, em outro worktree. Não espere por ele nem mexa no trabalho dele.

## 0. Antes de começar
1. Leia `CLAUDE.md`, `docs/SPEC.md` (inteira) e `.claude/skills/front-react/SKILL.md`. Siga tudo o que está neles.
   - A skill foi escrita para React Native. Neste projeto web ela já foi adaptada: **React Router** (rotas em `src/routes/`) no lugar de React Navigation, e **Vitest + @testing-library/react** (`npm test`) no lugar de Jest/RN. O resto vale igual: estrutura de pastas, nomes `xxxGlobal`/`xxxScreen`, `index.tsx` + `style.ts` + `types.ts` + `__tests__`, styled-components com tokens de `src/constants/theme.ts`, sem `any`.
2. Leia o código existente antes de criar algo. **Reutilize** os componentes de `src/components/` (botões, inputs, modal, stepper, orderList, cards, alerts, empty/error states...), os hooks e services existentes e os helpers de `src/utils/`.
3. Leia as migrations em `supabase/migrations/`, em especial `20261029140000_contrato_estrutura_completa.sql` — ela já cria **todas** as tabelas que você vai usar (`fases`, `grupos`, `grupo_times`, `series`, `eventos`, `jogos`), com RLS e checagens de integridade. Os tipos TypeScript estão em `src/@types/database.ts`.

## 1. Ambiente (já pronto)
- Supabase local **deste worktree** já está rodando nas portas **544xx** (API `http://127.0.0.1:54421`, banco `54422`, Studio `54423`). O `.env.local` já aponta para ele.
- Comandos: `npx supabase migration up` (aplica migrations novas), `npx supabase db reset` (recria do zero com seed), `npm run db:types` (regenera os tipos), `npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- Se o Supabase deste worktree estiver parado: `npx supabase start` **dentro deste worktree**.
- Logins de teste: cabeçalho de `supabase/seed.sql`.
- O seed já tem a "Liga Amadora de Basquete 2026" **em andamento** (fases e jogos criados à mão para a Etapa 4 testar). Para testar o fluxo desta etapa do zero, crie uma competição **nova** em rascunho (pelo app ou pelo seu script de aceite), cadastre 5 times nela e configure as fases.

## 2. Escopo exato
Seção 11, **Etapa 3**: "Tabelas 4.4 e 4.5, etapa Fases do assistente com validação e resumo visual, iniciar competição, geração de jogos (6.1), criação de evento com sorteio, edição e publicação (6.2)."

Seções da spec que regem esta etapa: **4.4 e 4.4.1** (fases, grupos, séries, entrada e cruzamento), **4.5** (eventos e jogos), **5** (etapa 4 "Fases" do assistente e "Iniciar competição"), **6.1** (geração por método do círculo), **6.2** (dia de jogos e sorteio), **10.2** (RLS), **9.3** (rota `.../:id/eventos`).

Entregas:
1. **Etapa "Fases" do assistente** (`src/view/competitionWizardScreen` + novos componentes): adicionar fases em ordem com nome, tipo e os campos do tipo (4.4); **resumo visual** do formato (ex.: "Fase 1: 5 times, todos contra todos, 10 jogos → 4 avançam → Semifinal melhor de 3: 1º x 4º, 2º x 3º → Final melhor de 3"); **validação de coerência** (ex.: classificados cabem no mata-mata seguinte, que precisa de número par de times). Ao salvar, gravar as **séries do mata-mata com as origens** e os times nulos (4.4.1), para todos os modos de `cruzamento` (`por_campanha`, `cruzado_grupos`, `vencedores`, `manual`), incluindo `disputa_terceiro`. Habilitar o passo em `WIZARD_STEPS` (`src/constants/competition.ts`). Respeitar `estrutura_travada` (só master edita depois da trava — a RLS já bloqueia; a tela deve avisar).
2. **Iniciar competição** (na visão geral `src/view/competitionOverviewScreen`): exige ≥ 2 times e fase 1 configurada; status → `em_andamento`, fase 1 → `em_andamento`; grupos com sorteio aleatório equilibrado (ou distribuição manual quando `sorteio_grupos = 'manual'`, com possibilidade de sortear de novo enquanto nenhum jogo tiver súmula); gera todos os jogos da fase 1 como `pendente`, sem data.
3. **Geração de jogos (6.1)**: método do círculo; número ímpar de times → folga, todos folgam o mesmo número de vezes; `turnos = 2` repete invertendo mando; cada jogo com `rodada`. Para grupos, por grupo.
4. **Dias de jogos (6.2)** na tela `src/view/eventsScreen` (rota já registrada: `/painel/competicoes/:competitionId/eventos`): criar evento (data, local e intervalo pré-preenchidos com os padrões da competição, hora de início, quantidade de jogos); seleção com as prioridades da 6.2 (rodadas mais antigas, times com menos jogos realizados/agendados, sem time jogando duas vezes no dia, aleatório entre equivalentes; no mata-mata só o próximo jogo de cada série não decidida com os dois times definidos); aviso **"Só é possível montar X jogos sem repetir time. Deseja permitir jogo duplo?"** e só inclui com confirmação; aviso quando há menos candidatos que o pedido; ordem aleatória e `inicio_previsto = data + hora_inicio + (i × intervalo)` no fuso `America/Fortaleza`, com jogos de um mesmo time não consecutivos quando possível. Evento nasce `rascunho`; admin pode reordenar (arrastar + botões ↑/↓ no celular), trocar um jogo por outro candidato, remover um jogo (volta a `pendente`), sortear de novo e **publicar**. Jogos de evento ficam `agendado`. Excluir evento devolve jogos sem súmula para `pendente`.
5. Operações que mexem em várias tabelas (**iniciar competição, gerar jogos, montar/sortear evento, publicar, excluir evento**) em **funções SQL/RPC transacionais** `security definer` que checam `is_admin_da_competicao` (ou `is_master`) no início.

Fora do escopo (não implemente): súmula, W.O., classificação/desempate (Etapa 4); preencher times das séries, avanço de fase e jogos de série sob demanda (Etapa 5) — mas as séries **gravadas** pelo assistente precisam ficar prontas para a Etapa 5 usar; rankings e páginas públicas (Etapa 6); financeiro (Etapa 7).

## 3. O que você PODE mexer
- **Migrations novas** em `supabase/migrations/` com **`etapa3` no nome**, ex.: `20261030100000_etapa3_gerar_jogos.sql`. Toda mudança de banco (RPC, função, trigger, índice, policy, ajuste) vira migration nova.
- `src/view/eventsScreen/` (substituir a tela provisória), `src/view/competitionWizardScreen/` (passo Fases), `src/view/competitionOverviewScreen/` (botão Iniciar e próximos passos).
- `src/constants/competition.ts` (habilitar "Fases"), `src/utils/competitionChecklist.ts` (próximos passos).
- **Arquivos novos** em `src/components/`, `src/hooks/`, `src/services/`, `src/utils/`, `src/constants/`, `src/@types/`, com seus testes.
- `src/constants/queryKeys.ts`: só **acrescentar** chaves, num bloco comentado `// Etapa 3`.
- `src/@types/database.ts`: regenere com `npm run db:types` depois das suas migrations.
- `scripts/aceite-etapa3.mjs` (novo) e uma linha `aceite:etapa3` em `package.json`.
- `docs/handoff/etapa-3-relatorio.md` (novo).

## 4. O que você NÃO pode mexer
- **Migrations existentes** (qualquer arquivo que já está em `supabase/migrations/`). Ajuste = migration nova.
- `supabase/config.toml`, `supabase/seed.sql`, `.env.local`, `.env.example`, `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `docs/SPEC.md`, `.claude/`.
- Telas de outras etapas: `src/view/gamesScreen`, `scoreSheetScreen`, `publicStandingsScreen` (Etapa 4) e as telas das Etapas 1 e 2 além das listadas no item 3.
- `src/routes/` (as rotas desta etapa já estão registradas). Se realmente precisar de rota nova, explique no relatório.
- Não rode `supabase link`, não use projeto remoto, não mexa no worktree principal (`../torneiomais`) nem no da Etapa 4, não pare outros Supabase locais.
- Não instale dependências novas sem necessidade; se instalar, justifique no relatório.

## 5. Regras
- Não invente regra de campeonato. Se algo não estiver na spec ou for contraditório, escolha a opção mais conservadora, **anote em "Dúvidas"** no relatório e siga.
- Interface 100% em pt-BR, mobile-first. Datas/horários em `America/Fortaleza`.
- Toda tabela continua com RLS. Funções `security definer` com `set search_path = ''` e checagem de permissão no início.

## 6. Critérios de aceite (seção 11)
- ✅ Com **5 times em todos contra todos** são gerados **10 jogos** e **cada time folga 1 vez por turno** (e 20 jogos / 2 folgas com `turnos = 2`).
- ✅ **Evento com 2 jogos não repete time.**
- ✅ **Pedir 3 jogos com só 2 possíveis sem repetição mostra o aviso** e só cria o jogo duplo com confirmação.
- Também: resumo visual e validação das fases; séries de mata-mata gravadas com as origens; publicar/remover/trocar/reordenar/excluir evento funcionando; jogos agendados só aparecem ao público quando o evento é publicado.

Comprove assim:
1. `npx supabase db reset` sobe sem erro com todas as migrations.
2. `scripts/aceite-etapa3.mjs` (modelo: `scripts/aceite-etapa2.mjs`) cobre os critérios acima **e testa as policies com os 4 perfis** (master, admin, dono_time e anon), incluindo: outro admin não gera jogos/eventos na competição dos outros; anon não vê evento em rascunho.
3. `npm test`, `npm run lint`, `npm run typecheck` e `npm run build` passam. Testes para toda tela, componente e hook novos.
4. `npm run aceite:etapa1` e `npm run aceite:etapa2` continuam passando.

## 7. Ao terminar
1. Escreva `docs/handoff/etapa-3-relatorio.md` com: **o que foi feito**; **arquivos criados/alterados**; **migrations novas**; **decisões tomadas**; **dúvidas**; **o que ficou pendente**; e o resultado dos comandos do item 6.
2. Faça **commit no ramo `etapa-3`** (mensagem em pt-BR). Não faça push, merge nem rebase. Não commite `docs/handoff/etapa-3-log.txt`.
