import { BadgeGlobal } from '@/components/badgeGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { EntityHeaderGlobal } from '@/components/entityHeaderGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { MODALIDADE_LABEL, STATUS_COMPETICAO } from '@/constants/competition';
import { useCategories } from '@/hooks/useCategories';
import { useCompetition } from '@/hooks/useCompetitions';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useTeams } from '@/hooks/useTeams';
import { paths } from '@/routes/types';
import { buildChecklist } from '@/utils/competitionChecklist';
import {
  CheckItem,
  CheckLabel,
  Checklist,
  Description,
  Grid,
  Mark,
  Stat,
  StatLabel,
  Stats,
  StatValue,
} from './style';

export function CompetitionOverviewScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const { competition, isLoading, error, refetch } = useCompetition(competitionId);
  const { categories } = useCategories(competitionId);
  const { teams, isLoading: loadingTeams } = useTeams(competitionId);

  if (isLoading || loadingTeams) return <LoaderGlobal label="Carregando competição" />;
  if (error || !competition) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  const status = STATUS_COMPETICAO[competition.status];
  const jogadores = teams.reduce((sum, t) => sum + (t.jogadores[0]?.count ?? 0), 0);
  const checklist = buildChecklist(categories, teams);

  return (
    <>
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
        actions={<LinkButtonGlobal to={paths.competitionSettings(competitionId, 'revisao')} label="Revisar configuração" />}
      />
      <Grid>
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
              </CheckItem>
            ))}
          </Checklist>
        </CardGlobal>
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
              <StatValue>{categories.filter((c) => c.ativa).length}</StatValue>
              <StatLabel>Estatísticas</StatLabel>
            </Stat>
          </Stats>
          {competition.descricao && <Description>{competition.descricao}</Description>}
          {competition.local_padrao && <Description>Local padrão: {competition.local_padrao}</Description>}
        </CardGlobal>
      </Grid>
    </>
  );
}
