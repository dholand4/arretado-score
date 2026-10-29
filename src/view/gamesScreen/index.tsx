import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';

// Tela provisória: implementada na Etapa 4 (docs/handoff/).
export function GamesScreen() {
  return (
    <>
      <PageHeaderGlobal title="Jogos" />
      <EmptyStateGlobal title="Em construção" description="Lista de jogos com súmula e W.O. chega na Etapa 4." />
    </>
  );
}
