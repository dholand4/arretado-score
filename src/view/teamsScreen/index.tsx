import { useState } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { AvatarGlobal } from '@/components/avatarGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { TeamFormModalGlobal } from '@/components/teamFormModalGlobal';
import { useDonos } from '@/hooks/useCompetitionAdmins';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useTeams } from '@/hooks/useTeams';
import { useConfirmAction } from '@/hooks/useConfirm';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { matchesSearch, pluralize } from '@/utils/text';
import { phoneDigits } from '@/utils/phone';
import { Feedback, Found, Item, List, Meta, Name, Search, TeamLink, Texts } from './style';

export function TeamsScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const { teams, isLoading, error, refetch, createTeam } = useTeams(competitionId);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const { donos } = useDonos(creating);
  const [busca, setBusca] = useState('');
  const confirmAction = useConfirmAction();

  const openCreate = () => {
    createTeam.reset();
    setCreating(true);
  };

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando times" />;
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (teams.length === 0) {
      return (
        <EmptyStateGlobal
          title="Nenhum time cadastrado"
          description="Cadastre os times; depois, entre em cada um para montar o elenco."
          action={<ButtonGlobal label="Novo time" onClick={openCreate} />}
        />
      );
    }
    // Busca por time, sigla, equipe, telefone da equipe ou jogador do elenco.
    const digitosBusca = phoneDigits(busca);
    const achouTelefone = (telefone: string | null | undefined) =>
      digitosBusca.length >= 3 && Boolean(telefone?.includes(digitosBusca));
    const resultados = teams
      .map((team) => ({
        team,
        jogadores: busca.trim() ? (team.elenco ?? []).filter((j) => matchesSearch(busca, j.nome, j.apelido)) : [],
      }))
      .filter(
        ({ team, jogadores }) =>
          jogadores.length > 0 ||
          matchesSearch(busca, team.nome, team.sigla, team.dono?.nome) ||
          achouTelefone(team.dono?.telefone),
      );

    return (
      <>
        <Search>
          <InputGlobal
            label="Buscar"
            type="search"
            placeholder="Time, sigla, equipe, telefone ou jogador"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </Search>
        {resultados.length === 0 ? (
          <EmptyStateGlobal
            title="Nada encontrado"
            description={`Nenhum time, equipe ou jogador com “${busca.trim()}”.`}
          />
        ) : (
          <List aria-label="Times">
            {resultados.map(({ team, jogadores }) => (
              <Item key={team.id}>
                <TeamLink to={paths.competitionTeam(competitionId, team.id)}>
                  <AvatarGlobal name={team.nome} src={team.logo_url} shape="square" />
                  <Texts>
                    <Name>
                      {team.nome}
                      {team.sigla && <BadgeGlobal label={team.sigla} />}
                    </Name>
                    <Meta>
                      {pluralize(team.jogadores[0]?.count ?? 0, 'jogador', 'jogadores')} ·{' '}
                      {team.dono ? `Equipe: ${team.dono.nome}` : 'Sem acesso de equipe'}
                    </Meta>
                    {jogadores.length > 0 && (
                      <Found>Jogador: {jogadores.map((j) => j.apelido || j.nome).join(', ')}</Found>
                    )}
                  </Texts>
                </TeamLink>
              </Item>
            ))}
          </List>
        )}
      </>
    );
  };

  return (
    <>
      <PageHeaderGlobal
        title="Times"
        subtitle="Cadastre os times com o acesso da equipe e monte os elencos."
        actions={teams.length > 0 && <ButtonGlobal label="Novo time" onClick={openCreate} />}
      />
      {created && (
        <Feedback>
          <AlertGlobal variant="success" message={created} onClose={() => setCreated(null)} />
        </Feedback>
      )}
      {renderContent()}
      {creating && (
        <TeamFormModalGlobal
          open
          donos={donos}
          saving={createTeam.isPending}
          error={createTeam.error ? getErrorMessage(createTeam.error) : null}
          onSubmit={(input, logo, novoDono, contato) =>
            confirmAction(`Cadastrar o time "${input.nome}"${novoDono ? ` com o acesso ${novoDono.email}` : ''}?`, () =>
              createTeam.mutate(
                { input, logo, novoDono, contato },
                {
                  onSuccess: (team) => {
                    setCreating(false);
                    setCreated(
                      novoDono
                        ? `Time ${team.nome} cadastrado. A equipe entra com ${novoDono.email} e a senha provisória.`
                        : `Time ${team.nome} cadastrado.`,
                    );
                  },
                },
              ),
            )
          }
          onClose={() => setCreating(false)}
        />
      )}
    </>
  );
}
