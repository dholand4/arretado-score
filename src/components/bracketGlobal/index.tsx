import { useEffect, useRef } from 'react';
import type { IBracketMatch } from '@/utils/bracketLayout';
import {
  Board,
  Card,
  CardHeader,
  Center,
  CenterStack,
  Champion,
  Column,
  ColumnTitle,
  Grid,
  Hint,
  Matches,
  Pair,
  Slot,
  TeamRow,
  Third,
} from './style';
import type { BracketSide, IBracketProps } from './types';

function MatchCard({ match, highlight = false }: { match: IBracketMatch; highlight?: boolean }) {
  const decided = match.teamA.winner || match.teamB.winner;
  return (
    <Card $highlight={highlight} title={match.games.join('\n') || undefined} aria-label={`${match.teamA.name} x ${match.teamB.name}`}>
      <CardHeader>
        <span>{match.code}</span>
        <span>{match.bestOf > 1 ? `Melhor de ${match.bestOf}` : 'Jogo único'}</span>
      </CardHeader>
      {[match.teamA, match.teamB].map((team, index) => (
        <TeamRow key={index} $winner={team.winner} $loser={decided && !team.winner} $defined={team.defined}>
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

function SideColumn({ title, matches, side, incoming }: { title: string; matches: IBracketMatch[]; side: BracketSide; incoming: boolean }) {
  return (
    <Column>
      <ColumnTitle>{title}</ColumnTitle>
      <Matches>
        {chunk(matches).map((pair) => (
          <Pair key={pair[0].id} $side={side} $joined={pair.length === 2}>
            {pair.map((match) => (
              <Slot key={match.id} $side={side} $incoming={incoming} $outgoing>
                <MatchCard match={match} />
              </Slot>
            ))}
          </Pair>
        ))}
      </Matches>
    </Column>
  );
}

// Chave em dois lados que se encontram na final, no centro (lado A à esquerda, lado B à direita).
export function BracketGlobal({ layout, champion }: IBracketProps) {
  const { left, right, final, third, finalTitle } = layout;
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
      {hasSides && <Hint>Arraste para o lado para ver a chave inteira.</Hint>}
      <Board ref={boardRef}>
        <Grid aria-label="Chaveamento dos playoffs">
          {left.map((column, index) => (
            <SideColumn key={`l${index}`} {...column} side="left" incoming={index > 0} />
          ))}
          <Center>
            <ColumnTitle>{finalTitle}</ColumnTitle>
            <CenterStack>
              {champion && (
                <Champion>
                  <span aria-hidden="true">🏆</span>
                  <small>Campeão</small>
                  <strong>{champion}</strong>
                </Champion>
              )}
              <Slot $side="center" $incoming={hasSides} $outgoing={false}>
                <MatchCard match={final} highlight />
              </Slot>
              {third && (
                <Third>
                  <ColumnTitle>Disputa de 3º lugar</ColumnTitle>
                  <MatchCard match={third} />
                </Third>
              )}
            </CenterStack>
          </Center>
          {[...right].reverse().map((column, index) => (
            <SideColumn key={`r${index}`} {...column} side="right" incoming={index < right.length - 1} />
          ))}
        </Grid>
      </Board>
    </>
  );
}

export type { IBracketProps } from './types';
