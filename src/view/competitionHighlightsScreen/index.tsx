import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { useRouteParams } from '@/hooks/useRouteParams';
import { RankingsContent } from '@/view/publicRankingsScreen';

// Destaques da competição no painel: um ranking por estatística cadastrada (cestinha etc.).
export function CompetitionHighlightsScreen() {
  const { competitionId } = useRouteParams('competitionId');
  return (
    <>
      <PageHeaderGlobal title="Destaques" subtitle="Rankings das estatísticas cadastradas, como o cestinha." />
      <RankingsContent competicaoId={competitionId} />
    </>
  );
}
