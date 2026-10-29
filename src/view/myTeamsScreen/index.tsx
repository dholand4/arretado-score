import { AvatarGlobal } from '@/components/avatarGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { STATUS_COMPETICAO } from '@/constants/competition';
import { useAuth } from '@/hooks/useAuth';
import { useMyTeams } from '@/hooks/useTeams';
import { paths } from '@/routes/types';
import { List, Meta, Name, TeamLink, Texts } from './style';

export function MyTeamsScreen() {
  const { profile } = useAuth();
  const { teams, isLoading, error, refetch } = useMyTeams(profile?.id ?? '');

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando seus times" />;
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (teams.length === 0) {
      return (
        <EmptyStateGlobal
          title="Nenhum time vinculado"
          description="Quando o admin da competição vincular você a um time, ele aparece aqui."
        />
      );
    }
    return (
      <List aria-label="Meus times">
        {teams.map((team) => (
          <li key={team.id}>
            <TeamLink to={paths.myTeam(team.id)}>
              <AvatarGlobal name={team.nome} src={team.logo_url} shape="square" />
              <Texts>
                <Name>
                  {team.nome}
                  <BadgeGlobal
                    label={STATUS_COMPETICAO[team.competicao.status].label}
                    tone={STATUS_COMPETICAO[team.competicao.status].tone}
                  />
                </Name>
                <Meta>{team.competicao.nome}</Meta>
              </Texts>
            </TeamLink>
          </li>
        ))}
      </List>
    );
  };

  return (
    <>
      <PageHeaderGlobal title="Meus times" subtitle="Mantenha o elenco atualizado: nome, número e foto." />
      {renderContent()}
    </>
  );
}
