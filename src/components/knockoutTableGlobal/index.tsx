import type { SituacaoMataMata } from '@/@types/game';
import { BadgeGlobal, type BadgeTone } from '@/components/badgeGlobal';
import { Note, Row, Scroll, Table, TeamCell, Wrap } from './style';
import type { IKnockoutTableProps } from './types';

const SITUACAO: Record<SituacaoMataMata, { label: string; tone: BadgeTone }> = {
  venceu: { label: 'Venceu a série', tone: 'success' },
  em_disputa: { label: 'Em disputa', tone: 'neutral' },
  repescagem: { label: 'Melhor perdedor', tone: 'info' },
  eliminado: { label: 'Eliminado', tone: 'danger' },
};

// Tabela de uma fase de mata-mata com melhores perdedores: vencedores primeiro, depois a repescagem.
export function KnockoutTableGlobal({ rows, provisional, caption }: IKnockoutTableProps) {
  return (
    <Wrap>
      <Scroll>
        <Table>
          {caption && <caption>{caption}</caption>}
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Time</th>
              <th scope="col" title="Série">SÉRIE</th>
              <th scope="col" title="Vitórias na série">V</th>
              <th scope="col" title="Derrotas na série">D</th>
              <th scope="col" title="Pontos a favor">PF</th>
              <th scope="col" title="Pontos contra">PC</th>
              <th scope="col">SALDO</th>
              <th scope="col">SITUAÇÃO</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row key={row.time_id} $qualified={row.classificado}>
                <td>{row.posicao}º</td>
                <TeamCell>
                  {row.nome}
                  {row.perdeu_wo && ' (W.O.)'}
                </TeamCell>
                <td>{row.serie}</td>
                <td>{row.vitorias}</td>
                <td>{row.derrotas}</td>
                <td>{row.pf}</td>
                <td>{row.pc}</td>
                <td>{row.saldo}</td>
                <td>
                  <BadgeGlobal label={SITUACAO[row.situacao].label} tone={SITUACAO[row.situacao].tone} />
                </td>
              </Row>
            ))}
          </tbody>
        </Table>
      </Scroll>
      <Note>Linhas em verde: avançam para a próxima fase (vencedores das séries e melhores perdedores).</Note>
      <Note>
        Entre os perdedores: quem perdeu algum jogo por W.O. fica atrás; depois contam vitórias na série, saldo, pontos
        marcados e a campanha anterior.
      </Note>
      {provisional && <Note>Repescagem provisória: ainda há série em andamento.</Note>}
    </Wrap>
  );
}

export type { IKnockoutTableProps } from './types';
