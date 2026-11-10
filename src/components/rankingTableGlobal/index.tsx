import { AvatarGlobal } from '@/components/avatarGlobal';
import { InlineLinkGlobal } from '@/components/inlineLinkGlobal';
import { formatAverage } from '@/utils/publicView';
import { matchesSearch } from '@/utils/text';
import { Name, Names, Player, PlayerCell, Scroll, Table, Team, Total } from './style';
import type { IRankingTableProps } from './types';

// Colunas da seção 6.7: posição, foto, jogador, time, total, jogos e média.
export function RankingTableGlobal({ rows, caption, limit, query = '', playerHref }: IRankingTableProps) {
  const posicionadas = (limit ? rows.slice(0, limit) : rows).map((row, index) => ({ row, posicao: index + 1 }));
  const visiveis = posicionadas.filter(({ row }) =>
    matchesSearch(query, row.jogador?.nome, row.jogador?.apelido, row.timeNome),
  );
  return (
    <Scroll>
      <Table>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Jogador</th>
            <th scope="col">Total</th>
            <th scope="col" title="Jogos disputados">J</th>
            <th scope="col">Média</th>
          </tr>
        </thead>
        <tbody>
          {visiveis.map(({ row, posicao }) => {
            const nome = row.jogador?.apelido || row.jogador?.nome || 'Jogador';
            return (
              <tr key={`${row.categoria_id}-${row.jogador_id}`}>
                <td>{posicao}º</td>
                <PlayerCell>
                  <Player>
                    <AvatarGlobal name={row.jogador?.nome ?? nome} src={row.jogador?.foto_url} size="sm" />
                    <Names>
                      <Name>{playerHref ? <InlineLinkGlobal to={playerHref(row.jogador_id)}>{nome}</InlineLinkGlobal> : nome}</Name>
                      <Team>{row.timeNome}</Team>
                    </Names>
                  </Player>
                </PlayerCell>
                <Total>{row.total}</Total>
                <td>{row.jogos}</td>
                <td>{formatAverage(row.media)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Scroll>
  );
}

export type { IRankingTableProps } from './types';
