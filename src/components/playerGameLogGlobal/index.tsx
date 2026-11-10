import { BadgeGlobal, type BadgeTone } from '@/components/badgeGlobal';
import { InlineLinkGlobal } from '@/components/inlineLinkGlobal';
import { playerGameLine, type PlayerGameOutcome } from '@/utils/publicView';
import { DateCell, Game, GameCell, Opponent, Result, Scroll, Table } from './style';
import type { IPlayerGameLogProps } from './types';

const RESULTADO: Record<PlayerGameOutcome, { label: string; tone: BadgeTone }> = {
  V: { label: 'Vitória', tone: 'success' },
  D: { label: 'Derrota', tone: 'danger' },
  E: { label: 'Empate', tone: 'neutral' },
};

// Jogo a jogo do jogador (seção 6.7.1): data, adversário, resultado e o valor de cada categoria.
export function PlayerGameLogGlobal({ games, categories, gameHref }: IPlayerGameLogProps) {
  return (
    <Scroll>
      <Table>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Jogo</th>
            {categories.map((category) => (
              <th key={category.id} scope="col" title={category.nome}>
                {category.sigla}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {games.map(({ jogo, time_id, valores }) => {
            const linha = playerGameLine(jogo, time_id);
            const resultado = RESULTADO[linha.resultado];
            return (
              <tr key={jogo.id}>
                <DateCell>{linha.data}</DateCell>
                <GameCell>
                  <Game>
                    <Opponent>
                      <InlineLinkGlobal to={gameHref(jogo.id)}>x {linha.adversario}</InlineLinkGlobal>
                    </Opponent>
                    <Result>
                      <BadgeGlobal label={resultado.label} tone={resultado.tone} />
                      {linha.placar}
                    </Result>
                  </Game>
                </GameCell>
                {categories.map((category) => (
                  <td key={category.id}>{valores[category.id] ?? 0}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Scroll>
  );
}

export type { IPlayerGameLogProps } from './types';
