import { useState } from 'react';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { RankingTableGlobal } from '@/components/rankingTableGlobal';
import { SegmentedGlobal } from '@/components/segmentedGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { usePublicCompetition, useRanking } from '@/hooks/usePublic';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { sortRanking, type RankingOrder } from '@/utils/publicView';
import { matchesSearch } from '@/utils/text';
import { Controls, Stack } from './style';

const ORDENS: { value: RankingOrder; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'media', label: 'Média por jogo' },
];

// Um ranking por categoria ativa, com filtro de fase e ordem por total ou média (seção 6.7).
// Usado também nos destaques do painel do admin. Com o slug da liga, o nome abre a página do jogador.
export function RankingsContent({ competicaoId, slug }: { competicaoId: string | undefined; slug?: string }) {
  const [faseId, setFaseId] = useState('');
  const { ranking, isLoading, error, refetch } = useRanking(competicaoId, faseId || null);
  const [categoriaId, setCategoriaId] = useState('');
  const [ordem, setOrdem] = useState<RankingOrder>('total');
  const [minimo, setMinimo] = useState('1');
  const [busca, setBusca] = useState('');

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando rankings" />;
    if (error || !ranking) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (ranking.categorias.length === 0) return <EmptyStateGlobal title="Nenhuma estatística ativa" />;

    const categoria = ranking.categorias.find((c) => c.id === categoriaId) ?? ranking.categorias[0];
    const linhas = sortRanking(
      ranking.linhas.filter((l) => l.categoria_id === categoria.id),
      ordem,
      Math.max(1, Number(minimo) || 1),
    );

    return (
      <Stack>
        <SegmentedGlobal
          ariaLabel="Rankings"
          options={ranking.categorias.map((c) => ({ value: c.id, label: c.titulo_ranking }))}
          value={categoria.id}
          onChange={setCategoriaId}
        />
        <Controls>
          <InputGlobal
            label="Buscar"
            type="search"
            placeholder="Jogador ou time"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
          <SelectGlobal
            label="Fase"
            value={faseId}
            options={[{ value: '', label: 'Competição inteira' }, ...ranking.fases.map((f) => ({ value: f.id, label: f.nome }))]}
            onChange={(event) => setFaseId(event.target.value)}
          />
          {ordem === 'media' && (
            <InputGlobal
              label="Mínimo de jogos"
              type="number"
              inputMode="numeric"
              min={1}
              value={minimo}
              onChange={(event) => setMinimo(event.target.value)}
            />
          )}
        </Controls>
        <SegmentedGlobal ariaLabel="Ordenar por" options={ORDENS} value={ordem} onChange={setOrdem} />
        {linhas.length === 0 ? (
          <EmptyStateGlobal
            title="Ainda sem números"
            description="O ranking aparece depois das súmulas completas. Jogos só com placar e W.O. não entram."
          />
        ) : !linhas.some((l) => matchesSearch(busca, l.jogador?.nome, l.jogador?.apelido, l.timeNome)) ? (
          <EmptyStateGlobal title="Ninguém encontrado" description={`Nenhum jogador ou time com “${busca.trim()}” neste ranking.`} />
        ) : (
          <RankingTableGlobal
            rows={linhas}
            caption={`${categoria.titulo_ranking} — ${categoria.nome}`}
            query={busca}
            playerHref={slug ? (jogadorId) => paths.publicPlayer(slug, jogadorId) : undefined}
          />
        )}
      </Stack>
    );
  };

  return renderContent();
}

export function PublicRankingsScreen() {
  const { slug } = useRouteParams('slug');
  const { competicao } = usePublicCompetition(slug);
  return (
    <>
      <PageHeaderGlobal title="Rankings" />
      <RankingsContent competicaoId={competicao?.id} slug={slug} />
    </>
  );
}
