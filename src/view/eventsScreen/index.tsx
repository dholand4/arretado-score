import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';

// Tela provisória: implementada na Etapa 3 (docs/handoff/).
export function EventsScreen() {
  return (
    <>
      <PageHeaderGlobal title="Dias de jogos" />
      <EmptyStateGlobal title="Em construção" description="Criação e sorteio dos dias de jogos chegam na Etapa 3." />
    </>
  );
}
