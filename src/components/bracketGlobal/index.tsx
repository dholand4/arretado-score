import { useEffect, useRef, useState } from 'react';
import type { StatusJogo } from '@/@types/event';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import type { IBracketMatch, IBracketTeam } from '@/utils/bracketLayout';
import { formatDateTime } from '@/utils/date';
import { gameStatus } from '@/utils/games';
import {
  Board,
  Card,
  CardHeader,
  Center,
  CenterStack,
  Champion,
  Column,
  ColumnTitle,
  Crest,
  GameAction,
  GameItem,
  GameList,
  GameScore,
  GameTop,
  Grid,
  Hint,
  Live,
  Matches,
  Pair,
  Round,
  RoundItem,
  RoundMatches,
  RoundNote,
  SeriesSummary,
  Slot,
  TeamRow,
  Third,
  Track,
} from './style';
import type { BracketSide, IBracketProps } from './types';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

function TeamCrest({ team }: { team: IBracketTeam }) {
  return (
    <Crest $empty={!team.defined} aria-hidden="true">
      {team.logo ? <img src={team.logo} alt="" /> : team.defined ? initials(team.name) : ''}
    </Crest>
  );
}

type OpenSeries = (match: IBracketMatch) => void;

function MatchCard({ match, highlight = false, onOpen }: { match: IBracketMatch; highlight?: boolean; onOpen: OpenSeries }) {
  const decided = match.teamA.winner || match.teamB.winner;
  return (
    <Card
      type="button"
      $highlight={highlight}
      aria-label={`Ver jogos da série ${match.code}: ${match.teamA.name} x ${match.teamB.name}`}
      onClick={() => onOpen(match)}
    >
      <CardHeader>
        <span>{match.code}</span>
        {match.live ? (
          <Live>Em andamento</Live>
        ) : (
          <span>{match.bestOf > 1 ? `Melhor de ${match.bestOf}` : 'Jogo único'}</span>
        )}
      </CardHeader>
      {[match.teamA, match.teamB].map((team, index) => (
        <TeamRow key={index} $winner={team.winner} $loser={decided && !team.winner} $defined={team.defined}>
          <TeamCrest team={team} />
          <span>{team.name}</span>
          <strong>{team.score ?? '–'}</strong>
        </TeamRow>
      ))}
    </Card>
  );
}

function chunk<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2));
  return pairs;
}

function SideColumn({
  title,
  matches,
  side,
  incoming,
  onOpen,
}: {
  title: string;
  matches: IBracketMatch[];
  side: BracketSide;
  incoming: boolean;
  onOpen: OpenSeries;
}) {
  return (
    <Column>
      <ColumnTitle>{title}</ColumnTitle>
      <Matches>
        {chunk(matches).map((pair) => (
          <Pair key={pair[0].id} $side={side} $joined={pair.length === 2}>
            {pair.map((match) => (
              <Slot key={match.id} $side={side} $incoming={incoming} $outgoing>
                <MatchCard match={match} onOpen={onOpen} />
              </Slot>
            ))}
          </Pair>
        ))}
      </Matches>
    </Column>
  );
}

// Chave em dois lados que se encontram na final, no centro (lado A à esquerda, lado B à direita).
// Jogos de uma série: resumo do confronto e cada jogo com data, placar, situação e link.
function SeriesDialog({
  match,
  gameLink,
  onClose,
}: {
  match: IBracketMatch;
  gameLink?: IBracketProps['gameLink'];
  onClose: () => void;
}) {
  const { teamA, teamB } = match;
  const placar = teamA.score !== null && teamB.score !== null ? ` ${teamA.score} x ${teamB.score} ` : ' x ';
  return (
    <ModalGlobal open title={`${match.phase} · ${match.code}`} onClose={onClose}>
      <SeriesSummary>
        <strong>
          {teamA.name}
          {placar}
          {teamB.name}
        </strong>{' '}
        · {match.bestOf > 1 ? `Melhor de ${match.bestOf}` : 'Jogo único'}
      </SeriesSummary>
      {match.games.length === 0 ? (
        <SeriesSummary>Os jogos aparecem quando os dois times da série estiverem definidos.</SeriesSummary>
      ) : (
        <GameList>
          {match.games.map((game) => {
            const status = gameStatus(game.status as StatusJogo);
            return (
              <GameItem key={game.id}>
                <GameTop>
                  <span>
                    Jogo {game.number ?? 1} · {game.startsAt ? formatDateTime(game.startsAt) : 'Sem data'}
                  </span>
                  <BadgeGlobal label={status.label} tone={status.tone} />
                </GameTop>
                <GameScore>
                  <span>{game.home}</span>
                  <strong>
                    {game.homeScore ?? '–'} × {game.awayScore ?? '–'}
                  </strong>
                  <span>{game.away}</span>
                </GameScore>
                {gameLink && (
                  <GameAction>
                    <LinkButtonGlobal to={gameLink(game.id)} label="Ver jogo →" size="sm" variant="ghost" />
                  </GameAction>
                )}
              </GameItem>
            );
          })}
        </GameList>
      )}
    </ModalGlobal>
  );
}

export function BracketGlobal({ layout, champion, gameLink }: IBracketProps) {
  const { rounds, left, right, final, third, finalTitle } = layout;
  const [open, setOpen] = useState<IBracketMatch | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const hasSides = left.length > 0 || right.length > 0;

  // Em tela estreita a chave abre centralizada na final.
  useEffect(() => {
    const board = boardRef.current;
    if (board) board.scrollLeft = (board.scrollWidth - board.clientWidth) / 2;
  }, [left.length, right.length]);

  if (!final) return null;

  return (
    <>
      {rounds.map((round) => (
        <Round key={round.title} aria-label={round.title}>
          <ColumnTitle>{round.title}</ColumnTitle>
          <RoundNote>Os classificados seguem para a próxima fase pela campanha.</RoundNote>
          <RoundMatches>
            {round.matches.map((match) => (
              <RoundItem key={match.id}>
                <MatchCard match={match} onOpen={setOpen} />
              </RoundItem>
            ))}
          </RoundMatches>
        </Round>
      ))}
      {hasSides && <Hint>Arraste para o lado para ver a chave inteira.</Hint>}
      <Board ref={boardRef}>
        <Track>
          {champion && (
            <Champion>
              <span aria-hidden="true">🏆</span>
              <small>Campeão</small>
              <strong>{champion}</strong>
            </Champion>
          )}
          <Grid aria-label="Chaveamento dos playoffs">
            {left.map((column, index) => (
              <SideColumn key={`l${index}`} {...column} side="left" incoming={index > 0} onOpen={setOpen} />
            ))}
            <Center>
              <ColumnTitle $tone="final">{finalTitle}</ColumnTitle>
              <CenterStack>
                <Slot $side="center" $incoming={hasSides} $outgoing={false}>
                  <MatchCard match={final} highlight onOpen={setOpen} />
                </Slot>
              </CenterStack>
            </Center>
            {[...right].reverse().map((column, index) => (
              <SideColumn
                key={`r${index}`}
                {...column}
                side="right"
                incoming={index < right.length - 1}
                onOpen={setOpen}
              />
            ))}
          </Grid>
          {third && (
            <Third>
              <ColumnTitle $tone="third">Disputa de 3º lugar</ColumnTitle>
              <MatchCard match={third} onOpen={setOpen} />
            </Third>
          )}
        </Track>
      </Board>
      {open && <SeriesDialog match={open} gameLink={gameLink} onClose={() => setOpen(null)} />}
    </>
  );
}

export type { IBracketProps } from './types';
