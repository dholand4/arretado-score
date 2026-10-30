import { useMemo, useState } from 'react';
import type { IDistribuicaoGrupos } from '@/@types/phase';
import { AlertGlobal } from '@/components/alertGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { CompetitionStartGlobal } from '@/components/competitionStartGlobal';
import { ConfirmDialogGlobal } from '@/components/confirmDialogGlobal';
import { EntityHeaderGlobal } from '@/components/entityHeaderGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { FormatSummaryGlobal } from '@/components/formatSummaryGlobal';
import { GroupsCardGlobal } from '@/components/groupsCardGlobal';
import { GroupsDistributionModalGlobal } from '@/components/groupsDistributionModalGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { MIN_TIMES_PARA_INICIAR, MODALIDADE_LABEL, STATUS_COMPETICAO } from '@/constants/competition';
import { STATUS_FASE, TIPO_FASE_LABEL } from '@/constants/phase';
import { useCategories } from '@/hooks/useCategories';
import { useCompetition } from '@/hooks/useCompetitions';
import { useGamesProgress, usePhases } from '@/hooks/usePhases';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useTeams } from '@/hooks/useTeams';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { buildChecklist, buildProgressChecklist } from '@/utils/competitionChecklist';
import { analyzeFormat, buildFormatSummary, groupName, phaseFromDb } from '@/utils/phaseFormat';
import { pluralize } from '@/utils/text';
import {
  CheckItem,
  CheckLabel,
  Checklist,
  Column,
  Description,
  Feedback,
  Grid,
  Mark,
  Stat,
  StatLabel,
  Stats,
  StatValue,
} from './style';

type Dialog = null | 'start' | 'distribute-start' | 'redraw' | 'distribute-redraw';

// Andamento e início da competição. `embedded`: sem cabeçalho, dentro da Revisão da
// configuração ou da aba Jogos (antes de iniciar).
export function CompetitionOverviewScreen({ embedded = false }: { embedded?: boolean }) {
  const { competitionId } = useRouteParams('competitionId');
  const { competition, isLoading, error, refetch } = useCompetition(competitionId);
  const { categories } = useCategories(competitionId);
  const { teams, isLoading: loadingTeams } = useTeams(competitionId);
  const { phases, isLoading: loadingPhases, startCompetition, redrawGroups } = usePhases(competitionId);
  const running = Boolean(competition && competition.status !== 'rascunho');
  const { games } = useGamesProgress(competitionId, running);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const forms = useMemo(() => phases.map(phaseFromDb), [phases]);
  const analysis = useMemo(() => analyzeFormat(forms, teams.length), [forms, teams.length]);
  const summary = useMemo(() => buildFormatSummary(forms, analysis), [forms, analysis]);

  if (isLoading || loadingTeams || loadingPhases) return <LoaderGlobal label="Carregando competição" />;
  if (error || !competition) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  const status = STATUS_COMPETICAO[competition.status];
  const jogadores = teams.reduce((sum, t) => sum + (t.jogadores[0]?.count ?? 0), 0);
  const checklist = running ? buildProgressChecklist(phases, games) : buildChecklist(categories, teams, phases.length);
  const firstPhase = phases[0];
  const currentPhase = phases.find((p) => p.status === 'em_andamento');

  const blockers = [
    ...(teams.length < MIN_TIMES_PARA_INICIAR
      ? [`Cadastre ao menos ${MIN_TIMES_PARA_INICIAR} times (${teams.length} até agora).`]
      : []),
    ...(phases.length === 0 ? ['Configure as fases da competição.'] : []),
    ...analysis.errors.map((e) => e.message),
    ...(teams.length >= MIN_TIMES_PARA_INICIAR ? analysis.warnings.map((w) => w.message) : []),
  ].filter((message, index, all) => all.indexOf(message) === index);

  const phaseGames = currentPhase ? games.filter((g) => g.fase_id === currentPhase.id) : [];
  const redrawBlocked = phaseGames.some((g) => g.status === 'encerrado' || g.status === 'wo')
    ? 'Já há súmula lançada nesta fase: os grupos não podem ser sorteados de novo.'
    : phaseGames.some((g) => g.evento_id)
      ? 'Há jogos desta fase já lançados. Exclua esses dias em Lançar jogos para sortear de novo.'
      : null;

  const closeDialog = () => {
    startCompetition.reset();
    redrawGroups.reset();
    setDialog(null);
  };
  const start = (distribuicao?: IDistribuicaoGrupos) =>
    startCompetition.mutate(distribuicao, {
      onSuccess: (total) => {
        setDialog(null);
        setFeedback(`Competição iniciada: ${pluralize(total, 'jogo gerado', 'jogos gerados')} na primeira fase.`);
      },
    });
  const redraw = (distribuicao?: IDistribuicaoGrupos) => {
    if (!currentPhase) return;
    redrawGroups.mutate(
      { faseId: currentPhase.id, distribuicao },
      {
        onSuccess: (total) => {
          setDialog(null);
          setFeedback(`Grupos definidos de novo: ${pluralize(total, 'jogo gerado', 'jogos gerados')}.`);
        },
      },
    );
  };
  const groupPhase = dialog === 'distribute-start' ? firstPhase : currentPhase;
  const distributionTeams =
    dialog === 'distribute-redraw' && currentPhase && currentPhase.ordem > 1
      ? currentPhase.grupos.flatMap((g) => g.grupo_times.map((gt) => ({ id: gt.time_id, nome: gt.time?.nome ?? '?' })))
      : teams.map((t) => ({ id: t.id, nome: t.nome }));

  return (
    <>
      {!embedded && (
        <EntityHeaderGlobal
          title={competition.nome}
          subtitle={MODALIDADE_LABEL[competition.modalidade]}
          imageUrl={competition.logo_url}
          badges={
            <>
              <BadgeGlobal label={status.label} tone={status.tone} />
              {competition.estrutura_travada && <BadgeGlobal label="Estrutura travada" tone="info" />}
            </>
          }
          actions={
            running ? (
              <LinkButtonGlobal to={paths.competitionEvents(competitionId)} label="Lançar jogos" />
            ) : (
              <LinkButtonGlobal to={paths.competitionSettings(competitionId, 'revisao')} label="Revisar configuração" />
            )
          }
        />
      )}
      {feedback && (
        <Feedback>
          <AlertGlobal variant="success" message={feedback} onClose={() => setFeedback(null)} />
        </Feedback>
      )}
      <Grid>
        <Column>
          <CardGlobal title="Próximos passos">
            <Checklist>
              {checklist.map((item) => (
                <CheckItem key={item.key}>
                  <Mark $done={item.done} $pending={Boolean(item.pending)} aria-hidden="true">
                    {item.done ? '✓' : item.pending ? '…' : '!'}
                  </Mark>
                  <CheckLabel>{item.label}</CheckLabel>
                  {item.step && !item.done && (
                    <LinkButtonGlobal to={paths.competitionSettings(competitionId, item.step)} label="Abrir" size="sm" variant="ghost" />
                  )}
                  {item.goToTeams && !item.done && (
                    <LinkButtonGlobal to={paths.competitionTeams(competitionId)} label="Times" size="sm" variant="ghost" />
                  )}
                  {item.goToEvents && !item.done && (
                    <LinkButtonGlobal to={paths.competitionEvents(competitionId)} label="Lançar jogos" size="sm" variant="ghost" />
                  )}
                </CheckItem>
              ))}
            </Checklist>
          </CardGlobal>

          {!running && (
            <CompetitionStartGlobal
              steps={summary}
              blockers={blockers}
              starting={startCompetition.isPending}
              onStart={() =>
                setDialog(firstPhase?.tipo === 'grupos' && firstPhase.sorteio_grupos === 'manual' ? 'distribute-start' : 'start')
              }
            />
          )}

          {running && currentPhase?.tipo === 'grupos' && (
            <GroupsCardGlobal
              phase={currentPhase}
              blockedReason={redrawBlocked}
              busy={redrawGroups.isPending}
              onRedraw={() => setDialog(currentPhase.sorteio_grupos === 'manual' ? 'distribute-redraw' : 'redraw')}
            />
          )}

          {running && (
            <CardGlobal title="Fases">
              <Checklist>
                {phases.map((p) => (
                  <CheckItem key={p.id}>
                    <CheckLabel>
                      {p.ordem}. {p.nome} — {TIPO_FASE_LABEL[p.tipo]}
                    </CheckLabel>
                    <BadgeGlobal label={STATUS_FASE[p.status].label} tone={STATUS_FASE[p.status].tone} />
                  </CheckItem>
                ))}
              </Checklist>
              <FormatSummaryGlobal steps={summary} />
            </CardGlobal>
          )}
        </Column>
        <CardGlobal title="Resumo">
          <Stats>
            <Stat>
              <StatValue>{teams.length}</StatValue>
              <StatLabel>Times</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{jogadores}</StatValue>
              <StatLabel>Jogadores</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{running ? games.length : categories.filter((c) => c.ativa).length}</StatValue>
              <StatLabel>{running ? 'Jogos' : 'Estatísticas'}</StatLabel>
            </Stat>
          </Stats>
          {competition.descricao && <Description>{competition.descricao}</Description>}
          {competition.local_padrao && <Description>Local padrão: {competition.local_padrao}</Description>}
        </CardGlobal>
      </Grid>

      <ConfirmDialogGlobal
        open={dialog === 'start'}
        title="Iniciar competição"
        message="A primeira fase começa e todos os jogos dela são gerados, sem data. A competição passa a aparecer na área pública. Deseja continuar?"
        confirmLabel="Iniciar"
        loading={startCompetition.isPending}
        error={startCompetition.error ? getErrorMessage(startCompetition.error) : null}
        onConfirm={() => start()}
        onClose={closeDialog}
      />
      <ConfirmDialogGlobal
        open={dialog === 'redraw'}
        title="Sortear os grupos de novo"
        message="Os grupos são sorteados outra vez e os jogos da fase são gerados de novo. Deseja continuar?"
        confirmLabel="Sortear de novo"
        loading={redrawGroups.isPending}
        error={redrawGroups.error ? getErrorMessage(redrawGroups.error) : null}
        onConfirm={() => redraw()}
        onClose={closeDialog}
      />
      {(dialog === 'distribute-start' || dialog === 'distribute-redraw') && groupPhase && (
        <GroupsDistributionModalGlobal
          open
          groupNames={Array.from({ length: groupPhase.qtd_grupos ?? 2 }, (_, i) => groupName(i))}
          teams={distributionTeams}
          initial={
            dialog === 'distribute-redraw'
              ? Object.fromEntries(groupPhase.grupos.map((g) => [g.nome, g.grupo_times.map((gt) => gt.time_id)]))
              : undefined
          }
          confirmLabel={dialog === 'distribute-start' ? 'Iniciar competição' : 'Salvar grupos'}
          saving={startCompetition.isPending || redrawGroups.isPending}
          error={
            dialog === 'distribute-start'
              ? startCompetition.error && getErrorMessage(startCompetition.error)
              : redrawGroups.error && getErrorMessage(redrawGroups.error)
          }
          onConfirm={(distribuicao) => (dialog === 'distribute-start' ? start(distribuicao) : redraw(distribuicao))}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
