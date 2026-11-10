import { InlineLinkGlobal } from '@/components/inlineLinkGlobal';
import { Heading, Number, PlayerCell, Points, Scroll, Section, Table } from './style';
import type { IBoxScoreProps } from './types';

// Estatísticas por jogador de um time no jogo (detalhe público, seção 9.1).
export function BoxScoreGlobal({ teamName, score, players, categories, stats, playerHref }: IBoxScoreProps) {
  return (
    <Section aria-label={`Estatísticas de ${teamName}`}>
      <Heading>
        {teamName}
        {score !== null && <Points>{score}</Points>}
      </Heading>
      <Scroll>
        <Table>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Jogador</th>
              {categories.map((category) => (
                <th key={category.id} scope="col" title={category.nome}>
                  {category.sigla}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const nome = player.apelido || player.nome;
              return (
                <tr key={player.id}>
                  <Number>{player.numero ?? '–'}</Number>
                  <PlayerCell>
                    {playerHref ? <InlineLinkGlobal to={playerHref(player.id)}>{nome}</InlineLinkGlobal> : nome}
                  </PlayerCell>
                  {categories.map((category) => (
                    <td key={category.id}>{stats[player.id]?.[category.id] ?? 0}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Scroll>
    </Section>
  );
}

export type { IBoxScoreProps } from './types';
