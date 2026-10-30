import { useState } from 'react';
import type { ITabelaPublica } from '@/@types/game';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { KnockoutTableGlobal } from '@/components/knockoutTableGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { SegmentedGlobal } from '@/components/segmentedGlobal';
import { StandingsTableGlobal } from '@/components/standingsTableGlobal';
import { useClassification, useKnockoutTable, usePublicStandings } from '@/hooks/useClassification';
import { useRouteParams } from '@/hooks/useRouteParams';
import { Stack } from './style';

type Fase = ITabelaPublica['fases'][number];

function GroupStandings({ fase, grupoId, caption, showDraws }: { fase: Fase; grupoId: string | null; caption?: string; showDraws: boolean }) {
  const { linhas, extrasClassificados, isLoading, error, refetch } = useClassification(fase, grupoId);
  if (isLoading) return <LoaderGlobal label="Carregando classificação" />;
  if (error) return <ErrorStateGlobal error={error} onRetry={refetch} />;
  if (linhas.length === 0) return <EmptyStateGlobal title="Ainda não há classificação nesta fase" />;
  return (
    <StandingsTableGlobal
      rows={linhas}
      showDraws={showDraws}
      qualifiedCount={fase.classificam ?? 0}
      extraQualified={extrasClassificados}
      caption={caption}
    />
  );
}

// Mata-mata com melhores perdedores: tabela da fase (vencedores das séries + repescagem).
function KnockoutStandings({ fase }: { fase: Fase }) {
  const { linhas, provisoria, isLoading, error, refetch } = useKnockoutTable(fase.id);
  if (isLoading) return <LoaderGlobal label="Carregando tabela da fase" />;
  if (error) return <ErrorStateGlobal error={error} onRetry={refetch} />;
  if (linhas.length === 0) return <EmptyStateGlobal title="Os confrontos desta fase ainda não foram definidos" />;
  return <KnockoutTableGlobal rows={linhas} provisional={provisoria} />;
}

function Standings({ tabela }: { tabela: ITabelaPublica }) {
  const [faseId, setFaseId] = useState(tabela.fases[0]?.id ?? '');
  const fase = tabela.fases.find((item) => item.id === faseId);
  if (!fase) return <EmptyStateGlobal title="Esta competição ainda não tem fase de classificação" />;

  const grupos = tabela.grupos.filter((grupo) => grupo.fase_id === fase.id);
  const showDraws = tabela.competicao.permite_empate;

  return (
    <Stack>
      {tabela.fases.length > 1 && (
        <SegmentedGlobal
          ariaLabel="Fases"
          options={tabela.fases.map((item) => ({ value: item.id, label: item.nome }))}
          value={fase.id}
          onChange={setFaseId}
        />
      )}
      {fase.tipo === 'mata_mata' ? (
        <KnockoutStandings fase={fase} />
      ) : fase.tipo === 'grupos' ? (
        grupos.map((grupo) => (
          <GroupStandings key={grupo.id} fase={fase} grupoId={grupo.id} caption={`Grupo ${grupo.nome}`} showDraws={showDraws} />
        ))
      ) : (
        <GroupStandings fase={fase} grupoId={null} showDraws={showDraws} />
      )}
    </Stack>
  );
}

// Tabela de todas as fases de pontos corridos/grupos; usada também no painel do admin.
export function StandingsContent({ slug }: { slug: string }) {
  const { tabela, isLoading, error, refetch } = usePublicStandings(slug);
  if (isLoading) return <LoaderGlobal label="Carregando tabela" />;
  if (error || !tabela) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
  return <Standings tabela={tabela} />;
}

export function PublicStandingsScreen() {
  const { slug } = useRouteParams('slug');
  return (
    <>
      <PageHeaderGlobal title="Tabela" />
      <StandingsContent slug={slug} />
    </>
  );
}
