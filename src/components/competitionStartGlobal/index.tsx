import { ButtonGlobal } from '@/components/buttonGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { FormatSummaryGlobal } from '@/components/formatSummaryGlobal';
import { Blockers, Footer, Text } from './style';
import type { ICompetitionStartProps } from './types';

// "Iniciar competição" (seção 5): exige ao menos 2 times e a fase 1 configurada.
export function CompetitionStartGlobal({ steps, blockers, starting = false, onStart }: ICompetitionStartProps) {
  return (
    <CardGlobal title="Iniciar competição">
      <Text>
        Ao iniciar, a primeira fase começa e todos os jogos dela são gerados, ainda sem data. A competição passa a
        aparecer na área pública.
      </Text>
      <FormatSummaryGlobal steps={steps} emptyText="Configure as fases para ver o formato." />
      {blockers.length > 0 && (
        <Blockers aria-label="Antes de iniciar">
          {blockers.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </Blockers>
      )}
      <Footer>
        <ButtonGlobal label="Iniciar competição" loading={starting} disabled={blockers.length > 0} onClick={onStart} />
      </Footer>
    </CardGlobal>
  );
}

export type { ICompetitionStartProps } from './types';
