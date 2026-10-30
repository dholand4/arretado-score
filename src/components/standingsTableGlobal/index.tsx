import { Note, Points, Row, Scroll, Table, TeamCell, Wrap } from './style';
import type { IStandingsTableProps } from './types';

const percent = (value: number) => `${Math.round(value * 100)}%`;

// Colunas da seção 6.3; E só aparece quando a competição permite empate.
export function StandingsTableGlobal({
  rows,
  showDraws,
  qualifiedCount,
  extraQualified = [],
  caption,
}: IStandingsTableProps) {
  const hasTechnicalTie = rows.some((row) => row.empate_tecnico && row.j > 0);
  return (
    <Wrap>
      <Scroll>
        <Table>
          {caption && <caption>{caption}</caption>}
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Time</th>
              <th scope="col" title="Pontos">PTS</th>
              <th scope="col" title="Jogos">J</th>
              <th scope="col" title="Vitórias">V</th>
              {showDraws && (
                <th scope="col" title="Empates">
                  E
                </th>
              )}
              <th scope="col" title="Derrotas (inclui W.O.)">D</th>
              <th scope="col" title="Derrotas por W.O.">WO</th>
              <th scope="col" title="Pontos a favor">PF</th>
              <th scope="col" title="Pontos contra">PC</th>
              <th scope="col">SALDO</th>
              <th scope="col" title="Aproveitamento">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row
                key={row.time_id}
                $qualified={row.posicao <= qualifiedCount || extraQualified.includes(row.time_id)}
              >
                <td>{row.posicao}º</td>
                <TeamCell>
                  {row.nome}
                  {row.empate_tecnico && row.j > 0 && ' *'}
                </TeamCell>
                <Points>{row.pts}</Points>
                <td>{row.j}</td>
                <td>{row.v}</td>
                {showDraws && <td>{row.e}</td>}
                <td>{row.d}</td>
                <td>{row.wo}</td>
                <td>{row.pf}</td>
                <td>{row.pc}</td>
                <td>{row.saldo}</td>
                <td>{percent(row.aproveitamento)}</td>
              </Row>
            ))}
          </tbody>
        </Table>
      </Scroll>
      {qualifiedCount > 0 && <Note>Linhas em verde: classificados para a próxima fase.</Note>}
      {hasTechnicalTie && <Note>* Empate técnico: ordem alfabética até o ajuste do organizador.</Note>}
    </Wrap>
  );
}

export type { IStandingsTableProps } from './types';
