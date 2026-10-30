import { Check, Heading, Number, PlayerCell, Points, Scroll, Section, StatInput, Table } from './style';
import type { IScoreSheetTeamProps } from './types';

// Uma linha por jogador: presença, número, nome e um campo por estatística (seção 6.5).
export function ScoreSheetTeamGlobal({
  teamName,
  score,
  players,
  categories,
  present,
  values,
  disabled = false,
  onTogglePresent,
  onChangeValue,
}: IScoreSheetTeamProps) {
  return (
    <Section aria-label={`Súmula de ${teamName}`}>
      <Heading>
        {teamName}
        <Points>{score} pts</Points>
      </Heading>
      <Scroll>
        <Table>
          <thead>
            <tr>
              <th scope="col">Jogou</th>
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
            {players.map((player) => (
              <tr key={player.id}>
                <td>
                  <Check
                    type="checkbox"
                    aria-label={`${player.nome} jogou`}
                    checked={present.includes(player.id)}
                    disabled={disabled}
                    onChange={(event) => onTogglePresent(player.id, event.target.checked)}
                  />
                </td>
                <Number>{player.numero ?? '–'}</Number>
                <PlayerCell>{player.apelido || player.nome}</PlayerCell>
                {categories.map((category) => (
                  <td key={category.id}>
                    <StatInput
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      aria-label={`${category.sigla} de ${player.nome}`}
                      value={values[player.id]?.[category.id] ?? ''}
                      disabled={disabled}
                      onChange={(event) => onChangeValue(player.id, category.id, event.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Scroll>
    </Section>
  );
}

export type { IScoreSheetCategory, IScoreSheetPlayer, IScoreSheetTeamProps } from './types';
