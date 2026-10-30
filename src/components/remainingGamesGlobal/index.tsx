import { CardGlobal } from '@/components/cardGlobal';
import { pluralize } from '@/utils/text';
import { Detail, Group, List, Phase, Summary } from './style';
import type { IRemainingGamesProps } from './types';

// Quanto falta para terminar cada fase em andamento: jogos sem dia e jogos já marcados.
export function RemainingGamesGlobal({ phases }: IRemainingGamesProps) {
  if (phases.length === 0) return null;
  return (
    <CardGlobal title="Faltam para terminar a fase">
      {phases.map((fase) => {
        const total = fase.semDia.length + fase.agendados.length;
        return (
          <Phase key={fase.fase}>
            <Summary>
              {fase.fase}:{' '}
              {total === 0 ? 'todos os jogos já têm resultado.' : `${pluralize(total, 'jogo', 'jogos')} sem resultado`}
            </Summary>
            {fase.semDia.length > 0 && (
              <Group open>
                <summary>{pluralize(fase.semDia.length, 'jogo sem dia marcado', 'jogos sem dia marcado')}</summary>
                <List>
                  {fase.semDia.map((jogo) => (
                    <li key={jogo.id}>
                      {jogo.confronto} {jogo.detalhe && <Detail>· {jogo.detalhe}</Detail>}
                    </li>
                  ))}
                </List>
              </Group>
            )}
            {fase.agendados.length > 0 && (
              <Group>
                <summary>{pluralize(fase.agendados.length, 'jogo já lançado', 'jogos já lançados')}</summary>
                <List>
                  {fase.agendados.map((jogo) => (
                    <li key={jogo.id}>
                      {jogo.confronto} {jogo.detalhe && <Detail>· {jogo.detalhe}</Detail>}
                    </li>
                  ))}
                </List>
              </Group>
            )}
          </Phase>
        );
      })}
    </CardGlobal>
  );
}

export type { IRemainingGamesProps } from './types';
