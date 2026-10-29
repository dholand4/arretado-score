import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';

// Tela provisória: implementada na Etapa 4 (docs/handoff/).
export function PublicStandingsScreen() {
  return (
    <>
      <PageHeaderGlobal title="Tabela" />
      <EmptyStateGlobal title="Em construção" description="A tabela pública chega na Etapa 4." />
    </>
  );
}
