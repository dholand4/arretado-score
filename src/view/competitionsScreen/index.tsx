import { CompetitionCardGlobal } from '@/components/competitionCardGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { useAuth } from '@/hooks/useAuth';
import { useCompetitions } from '@/hooks/useCompetitions';
import { paths, ROUTES } from '@/routes/types';
import { pluralize } from '@/utils/text';
import { List } from './style';

export function CompetitionsScreen() {
  const { profile } = useAuth();
  const { competitions, isLoading, error, refetch } = useCompetitions();
  const isMaster = profile?.papel === 'master';

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando competições" />;
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (competitions.length === 0) {
      return (
        <EmptyStateGlobal
          title="Nenhuma competição ainda"
          description="Crie a primeira: ela nasce como rascunho e só aparece para o público depois de iniciada."
          action={<LinkButtonGlobal to={ROUTES.newCompetition} label="Nova competição" variant="primary" />}
        />
      );
    }
    return (
      <List aria-label="Competições">
        {competitions.map((c) => (
          <li key={c.id}>
            <CompetitionCardGlobal
              nome={c.nome}
              modalidade={c.modalidade}
              status={c.status}
              logoUrl={c.logo_url}
              meta={pluralize(c.times[0]?.count ?? 0, 'time', 'times')}
              to={paths.competition(c.id)}
            />
          </li>
        ))}
      </List>
    );
  };

  return (
    <>
      <PageHeaderGlobal
        title="Competições"
        subtitle={isMaster ? 'Todas as competições do sistema.' : 'Competições que você administra.'}
        actions={<LinkButtonGlobal to={ROUTES.newCompetition} label="Nova competição" variant="primary" />}
      />
      {renderContent()}
    </>
  );
}
