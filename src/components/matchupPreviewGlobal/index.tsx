import { CardGlobal } from '@/components/cardGlobal';
import { Games, Muted, Round, Rounds, RoundTitle } from './style';
import type { IMatchupPreviewProps } from './types';

export function MatchupPreviewGlobal({ title, rounds, note }: IMatchupPreviewProps) {
  return (
    <CardGlobal title={title}>
      {note && <Muted>{note}</Muted>}
      <Rounds>
        {rounds.map((round) => (
          <Round key={round.rodada}>
            <RoundTitle>Rodada {round.rodada}</RoundTitle>
            <Games>
              {round.jogos.map((jogo) => (
                <li key={jogo}>{jogo}</li>
              ))}
            </Games>
            {round.folga.length > 0 && <Muted>Folga: {round.folga.join(', ')}</Muted>}
          </Round>
        ))}
      </Rounds>
    </CardGlobal>
  );
}

export type { IMatchupPreviewProps } from './types';
