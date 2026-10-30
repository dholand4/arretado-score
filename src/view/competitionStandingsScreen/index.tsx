import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { useCompetition } from '@/hooks/useCompetitions';
import { useRouteParams } from '@/hooks/useRouteParams';
import { StandingsContent } from '@/view/publicStandingsScreen';

// Tabela da competição dentro do painel (mesmos dados da área pública).
export function CompetitionStandingsScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const { competition, isLoading, error, refetch } = useCompetition(competitionId);

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando competição" />;
    if (error || !competition) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    return <StandingsContent slug={competition.slug} />;
  };

  return (
    <>
      <PageHeaderGlobal title="Tabela" subtitle="Classificação atualizada a cada súmula lançada." />
      {renderContent()}
    </>
  );
}
