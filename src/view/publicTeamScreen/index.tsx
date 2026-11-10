import { AvatarGlobal } from '@/components/avatarGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { EntityHeaderGlobal } from '@/components/entityHeaderGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { GameCardGlobal } from '@/components/gameCardGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { usePublicCompetition, usePublicGames, usePublicTeam } from '@/hooks/usePublic';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { dayContext } from '@/utils/eventSchedule';
import { filterGames, gameCardTexts, gameStatus } from '@/utils/games';
import {
  List,
  Player,
  PlayerLink,
  PlayerName,
  PlayerNumber,
  Roster,
  Section,
  SectionTitle,
  Stack,
  Stat,
  StatLabel,
  Stats,
  StatValue,
} from './style';

// Elenco com fotos, jogos do time e estatísticas do time (seção 9.1).
export function PublicTeamScreen() {
  const { slug, teamId } = useRouteParams('slug', 'teamId');
  const { competicao } = usePublicCompetition(slug);
  const { equipe, isLoading, error, refetch } = usePublicTeam(teamId);
  const { jogos } = usePublicGames(competicao?.id);

  if (isLoading) return <LoaderGlobal label="Carregando time" />;
  if (error || !equipe) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  const jogosDoTime = filterGames(jogos, { faseId: '', timeId: teamId, status: '' });
  // Calculado com todos os jogos: o confronto do dia depende de jogos de outros times.
  const contexto = dayContext(jogos);

  return (
    <Stack>
      <EntityHeaderGlobal
        title={equipe.time.nome}
        imageUrl={equipe.time.logo_url}
        badges={equipe.time.sigla ? <BadgeGlobal label={equipe.time.sigla} /> : undefined}
      />
      <Section>
        <SectionTitle>Estatísticas do time</SectionTitle>
        <Stats>
          {equipe.totais.map(({ categoria, total }) => (
            <Stat key={categoria.id}>
              <StatValue>{total}</StatValue>
              <StatLabel>{categoria.nome}</StatLabel>
            </Stat>
          ))}
        </Stats>
      </Section>
      <Section>
        <SectionTitle>Elenco</SectionTitle>
        {equipe.jogadores.length === 0 ? (
          <EmptyStateGlobal title="Elenco ainda não cadastrado" />
        ) : (
          <Roster>
            {equipe.jogadores.map((jogador) => (
              <Player key={jogador.id}>
                <PlayerLink to={paths.publicPlayer(slug, jogador.id)}>
                  <AvatarGlobal name={jogador.nome} src={jogador.foto_url} size="lg" />
                  <PlayerNumber>{jogador.numero ?? '–'}</PlayerNumber>
                  <PlayerName>{jogador.apelido || jogador.nome}</PlayerName>
                </PlayerLink>
              </Player>
            ))}
          </Roster>
        )}
      </Section>
      <Section>
        <SectionTitle>Jogos</SectionTitle>
        {jogosDoTime.length === 0 ? (
          <EmptyStateGlobal title="Nenhum jogo publicado para este time" />
        ) : (
          <List>
            {jogosDoTime.map((jogo) => {
              const status = gameStatus(jogo.status);
              return (
                <li key={jogo.id}>
                  <GameCardGlobal
                    to={paths.publicGame(slug, jogo.id)}
                    {...gameCardTexts(jogo, contexto)}
                    homeScore={jogo.placar_casa}
                    awayScore={jogo.placar_fora}
                    statusLabel={status.label}
                    statusTone={status.tone}
                    actionLabel="Ver jogo"
                  />
                </li>
              );
            })}
          </List>
        )}
      </Section>
    </Stack>
  );
}
