# Etapa 5 — relatório

## O que foi feito

- Avanço transacional a partir de `pos_resultado_jogo`: apuração de séries, W.O. como vitória do presente, criação dos jogos sob demanda, alternância do mando, fechamento das fases e encerramento da competição.
- Resolução das origens já configuradas de posição, posição de grupo, melhor extra, vencedor e perdedor. Isso atende os cruzamentos por campanha, grupos, vencedores e manual, inclusive disputa de terceiro.
- Rota pública `/c/:slug/playoffs`, com colunas de fases, origens ainda pendentes, times, placar das séries, jogos visíveis e campeão. O serviço respeita a RLS de jogos: pendentes sem evento publicado não são expostos.
- Testes de interface e hook, e script de aceite com os cenários e perfis solicitados.

## Arquivos criados ou alterados

- Migration `supabase/migrations/20261031100000_etapa5_series_avanco.sql` e `src/@types/database.ts` regenerado.
- `src/services/bracketService.ts`, `src/hooks/usePublicBracket.ts` e seu teste, `src/utils/bracketOrigin.ts`, `src/view/publicBracketScreen/` e testes.
- Chave em `src/constants/queryKeys.ts`, rota em `src/routes/types.ts` e `src/routes/PublicStack.tsx`.
- `scripts/aceite-etapa5.mjs`, comando `aceite:etapa5` em `package.json` e este relatório.

## Migration e decisões

- `pos_resultado_jogo` recalcula as vitórias pelos jogos encerrados ou por W.O.; ao decidir, remove jogos pendentes ou agendados da série. Uma edição que desfaça a decisão recria o próximo jogo. Se a edição tornaria inconsistentes jogos já disputados da mesma série, ela é recusada.
- Se a correção alterar os participantes de uma fase seguinte ainda sem resultados, seus jogos pendentes são substituídos; se já houver resultado posterior, a correção é recusada transacionalmente, inclusive para master, para não associar resultados a confrontos incorretos. Caso uma série volte a ficar indefinida, fases posteriores sem resultados são reiniciadas. A edição de fase anterior a uma fase classificatória já gerada exige revisão manual.
- W.O. duplo em mata-mata é recusado em `pos_resultado_jogo`; a exceção desfaz toda a RPC de resultado, sem alterar a RPC da Etapa 4. W.O. duplo nas demais fases permanece permitido.
- Funções internas não são acessíveis pela API; a função pós-resultado também verifica a administração da competição. A serialização usa os bloqueios já existentes na RPC e bloqueios das fases/séries.
- O campeão de playoffs é obtido da série final que não vem de origens de perdedores, sem criar coluna de campeão. Em fases com disputa de terceiro, ambas as séries precisam terminar para encerrar a competição.
- O cenário adicional de grupos é criado via RPC do master e mantido em rascunho durante a montagem, pois iniciar competição pertence à Etapa 3. Ao terminar a última fase, a competição é encerrada e passa a ser pública.

## Dúvidas e interpretações

- A spec não define comparação de campanha entre grupos ou vencedores de séries. Adotou-se a última fase classificatória disponível: posição no grupo primeiro; na mesma posição, PTS, aproveitamento, saldo e pontos pró, como para melhores extras. Persistindo empate, nome e ID; em todos contra todos a posição da classificação já incorpora os desempates configurados. Sem classificação anterior, nome e ID tornam a ordem determinística. Essa escolha precisa de confirmação do regulamento.
- A spec não especifica o JSON de origem de melhor extra. Foi adotado `{"tipo":"melhor_extra","fase_ordem":1,"posicao":1}` (posição na lista de extras), com `colocacao` opcional para a posição dentro do grupo; por padrão, `classificam + 1`. A Etapa 3 deve usar ou adaptar esse contrato. `posicao` em fase de grupos representa posição geral entre classificados e extras, ordenados pelos mesmos critérios.
- Séries são referenciadas pelo código; como o banco só garante unicidade por fase, a resolução usa a série concluída mais recente com o código na competição. O assistente deve manter códigos únicos por competição, como no seed.
- Uma fase manualmente marcada concluída com a seguinte ainda aguardando, mas com jogos próprios em aberto, não é reaberta por uma edição; isso preserva a regressão da Etapa 4 e não representa o fluxo automático normal.

## Pendências e integração

- Ligar e validar com a Etapa 3 `distribuir_grupos(uuid,uuid[],jsonb)` e `gerar_jogos_fase(uuid,uuid[])`; o adaptador verifica as assinaturas em tempo de execução e falha com mensagem clara se ausentes. A distribuição manual precisa receber a configuração apropriada na integração; o adaptador passa `null` enquanto o contrato não está disponível.
- Confirmar os contratos das origens, a regra de melhor campanha e o tratamento de correções com resultados posteriores. A interface de resolução manual desses casos não está nesta etapa.
- A inspeção visual em 375 px não foi possível: o navegador integrado retornou “browser access host is unavailable”. A página usa colunas com rolagem horizontal; precisa de revisão visual em celular. O servidor Vite respondeu HTTP 200 para a rota.

## Validação

- `npx supabase db reset`: passou com migrations e seed.
- `npm run db:types`: tipos gerados do banco local pelo comando equivalente `npx supabase gen types typescript --local > src/@types/database.ts`.
- `npm run aceite:etapa5`: passou após reset, incluindo cinco times, grupos, W.O., edição, mando, origens manuais, melhores extras, terceiro lugar e acesso dos perfis master, admin, outro admin, dono e anon.
- `npm run aceite:etapa4` e `npm run aceite:etapa2`: passaram, cada um após reset.
- `npm test`: 69 arquivos e 154 testes passaram. `npm run lint`, `npm run typecheck` e `npm run build` passaram. O Vite advertiu sobre chunk acima de 500 kB.
- `npm run dev -- --host 127.0.0.1 --port 5275`: iniciado; rota de playoffs respondeu HTTP 200.
