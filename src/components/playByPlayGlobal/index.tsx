import { useState } from 'react';
import { LivePlayLogGlobal } from '@/components/livePlayLogGlobal';
import { SegmentedGlobal } from '@/components/segmentedGlobal';
import { Container, Note } from './style';
import type { IPlayByPlayProps } from './types';

const TODOS = '';

// Lance a lance de um jogo encerrado (seção 6.5.1), com filtro por período.
export function PlayByPlayGlobal({ itens, note }: IPlayByPlayProps) {
  const [periodo, setPeriodo] = useState(TODOS);
  // Os itens vêm do mais recente para o mais antigo; os períodos aparecem na ordem do jogo.
  const periodos = [...new Set(itens.map((item) => item.periodo))].reverse();
  const visiveis = periodo === TODOS ? itens : itens.filter((item) => item.periodo === periodo);

  return (
    <Container>
      {note && <Note>{note}</Note>}
      {periodos.length > 1 && (
        <SegmentedGlobal
          ariaLabel="Período"
          options={[{ value: TODOS, label: 'Todos' }, ...periodos.map((p) => ({ value: p, label: p }))]}
          value={periodo}
          onChange={setPeriodo}
        />
      )}
      <LivePlayLogGlobal itens={visiveis} />
    </Container>
  );
}

export type { IPlayByPlayProps } from './types';
