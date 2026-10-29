import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';

// Tela provisória: implementada na Etapa 4 (docs/handoff/).
export function ScoreSheetScreen() {
  return (
    <>
      <PageHeaderGlobal title="Súmula" />
      <EmptyStateGlobal title="Em construção" description="A súmula chega na Etapa 4." />
    </>
  );
}
