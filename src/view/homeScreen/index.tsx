import { CompetitionCardGlobal } from '@/components/competitionCardGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { usePublicCompetitions } from '@/hooks/useCompetitions';
import { paths } from '@/routes/types';
import { Hero, Lead, List, SectionTitle, Title } from './style';

export function HomeScreen() {
  const { competitions, isLoading, error, refetch } = usePublicCompetitions();

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando competições" />;
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (competitions.length === 0) {
      return (
        <EmptyStateGlobal
          title="Nenhuma competição publicada ainda"
          description="Quando uma competição começar, ela aparece aqui."
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
              to={paths.publicCompetition(c.slug)}
            />
          </li>
        ))}
      </List>
    );
  };

  return (
    <>
      <Hero>
        <Title>Campeonatos</Title>
        <Lead>Acompanhe jogos, tabela, playoffs e rankings das competições.</Lead>
      </Hero>
      <section>
        <SectionTitle>Competições</SectionTitle>
        {renderContent()}
      </section>
    </>
  );
}
