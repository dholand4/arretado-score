import { AvatarGlobal } from '@/components/avatarGlobal';
import { Balance, Dot, Note, Points, Position, Rate, RateFill, Row, Scroll, Table, TeamCell, Wrap } from './style';
import type { IStandingsTableProps } from './types';

const percent = (value: number) => `${Math.round(value * 100)}%`;
const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

// Colunas da seção 6.3; E só aparece quando a competição permite empate.
export function StandingsTableGlobal({
  rows,
  showDraws,
  qualifiedCount,
  extraQualified = [],
  caption,
  logos = {},
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
            {rows.map((row) => {
              const qualified = row.posicao <= qualifiedCount || extraQualified.includes(row.time_id);
              return (
                <Row key={row.time_id} $qualified={qualified}>
                  <Position $qualified={qualified}>
                    <span>{row.posicao}</span>
                  </Position>
                  <TeamCell>
                    <div>
                      <AvatarGlobal name={row.nome} src={logos[row.time_id]} size="sm" />
                      <span>
                        {row.nome}
                        {row.empate_tecnico && row.j > 0 && ' *'}
                      </span>
                    </div>
                  </TeamCell>
                  <Points>
                    <strong>{row.pts}</strong>
                  </Points>
                  <td>{row.j}</td>
                  <td>{row.v}</td>
                  {showDraws && <td>{row.e}</td>}
                  <td>{row.d}</td>
                  <td>{row.wo}</td>
                  <td>{row.pf}</td>
                  <td>{row.pc}</td>
                  <Balance $value={row.saldo}>{signed(row.saldo)}</Balance>
                  <Rate>
                    <div>
                      <i>
                        <RateFill $value={row.aproveitamento} />
                      </i>
                      <small>{percent(row.aproveitamento)}</small>
                    </div>
                  </Rate>
                </Row>
              );
            })}
          </tbody>
        </Table>
      </Scroll>
      {qualifiedCount > 0 && (
        <Note>
          <Dot aria-hidden="true" />
          Classificados para a próxima fase.
        </Note>
      )}
      {hasTechnicalTie && <Note>* Empate técnico: ordem alfabética até o ajuste do organizador.</Note>}
    </Wrap>
  );
}

export type { IStandingsTableProps } from './types';
