import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { TeamLinkCardGlobal } from '@/components/teamLinkCardGlobal';
import { usePublicCompetition, usePublicTeams } from '@/hooks/usePublic';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { pluralize } from '@/utils/text';
import { List } from './style';

export function PublicTeamsScreen() {
  const { slug } = useRouteParams('slug');
  const { competicao } = usePublicCompetition(slug);
  const { times, isLoading, error, refetch } = usePublicTeams(competicao?.id);

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando times" />;
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (times.length === 0) return <EmptyStateGlobal title="Nenhum time cadastrado" />;
    return (
      <List aria-label="Times">
        {times.map((time) => (
          <li key={time.id}>
            <TeamLinkCardGlobal
              to={paths.publicTeam(slug, time.id)}
              name={time.nome}
              logoUrl={time.logo_url}
              sigla={time.sigla}
              meta={pluralize(time.jogadores[0]?.count ?? 0, 'jogador', 'jogadores')}
            />
          </li>
        ))}
      </List>
    );
  };

  return (
    <>
      <PageHeaderGlobal title="Times" />
      {renderContent()}
    </>
  );
}
