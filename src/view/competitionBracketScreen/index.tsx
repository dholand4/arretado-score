import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { useCompetition } from '@/hooks/useCompetitions';
import { useRouteParams } from '@/hooks/useRouteParams';
import { BracketContent } from '@/view/publicBracketScreen';

// Chave dos playoffs dentro do painel (mesmos dados da área pública).
export function CompetitionBracketScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const { competition, isLoading, error, refetch } = useCompetition(competitionId);

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando competição" />;
    if (error || !competition) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    return <BracketContent slug={competition.slug} />;
  };

  return (
    <>
      <PageHeaderGlobal title="Playoffs" subtitle="Confrontos e séries do mata-mata." />
      {renderContent()}
    </>
  );
}
