import { useMemo, useState } from 'react';
import type { ICobranca } from '@/@types/finance';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { ChargeCardGlobal } from '@/components/chargeCardGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { FinanceSummaryGlobal } from '@/components/financeSummaryGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { MarkPaidModalGlobal } from '@/components/markPaidModalGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { COBRANCA_MODELO_LABEL, STATUS_COBRANCA, type StatusExibicao } from '@/constants/finance';
import { useCompetition } from '@/hooks/useCompetitions';
import { useFinance } from '@/hooks/useFinance';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useConfirmAction } from '@/hooks/useConfirm';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import {
  displayStatus,
  filterCharges,
  firstDayOfMonth,
  formatCurrency,
  formatMonth,
  monthOptions,
  summarize,
  todayInFortaleza,
  type IChargeFilters,
} from '@/utils/finance';
import { pluralize } from '@/utils/text';
import { Feedback, Filters, List } from './style';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  ...(Object.keys(STATUS_COBRANCA) as StatusExibicao[]).map((s) => ({ value: s, label: STATUS_COBRANCA[s].label })),
];

// Financeiro da competição (seção 8.1): só admins da competição e master.
export function FinanceScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const { competition } = useCompetition(competitionId);
  const { cobrancas, isLoading, error, refetch, generate, markPaid, setStatus, openReceipt } =
    useFinance(competitionId);
  const hoje = todayInFortaleza();
  const [filtros, setFiltros] = useState<IChargeFilters>({ referencia: firstDayOfMonth(hoje), timeId: '', status: '' });
  const [pagando, setPagando] = useState<ICobranca | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const confirmAction = useConfirmAction();

  const meses = useMemo(() => monthOptions(cobrancas), [cobrancas]);
  const times = useMemo(
    () =>
      [...new Map(cobrancas.map((c) => [c.time_id, c.time?.nome ?? 'Time'])).entries()].sort((a, b) =>
        a[1].localeCompare(b[1]),
      ),
    [cobrancas],
  );
  const visiveis = filterCharges(cobrancas, filtros, hoje);
  const modelo = competition?.cobranca_modelo ?? 'nenhuma';

  const handleGenerate = () =>
    confirmAction('Gerar as cobranças da liga?', () => {
      setAviso(null);
      generate.mutate(undefined, {
        onSuccess: (qtd) =>
          setAviso(
            qtd
              ? `${pluralize(qtd, 'cobrança gerada', 'cobranças geradas')}.`
              : 'Nada novo: todas as cobranças já existiam.',
          ),
      });
    });

  const handleReceipt = (path: string) =>
    openReceipt.mutate(path, { onSuccess: (url) => window.open(url, '_blank', 'noopener') });

  const actionError = generate.error ?? setStatus.error ?? openReceipt.error;

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando cobranças" />;
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (cobrancas.length === 0) {
      return (
        <EmptyStateGlobal
          title="Nenhuma cobrança gerada"
          description={
            modelo === 'nenhuma'
              ? 'Configure a cobrança no assistente para começar.'
              : 'Use “Gerar cobranças” para criar os meses configurados.'
          }
          action={
            modelo === 'nenhuma' ? (
              <LinkButtonGlobal to={paths.competitionSettings(competitionId, 'cobranca')} label="Configurar cobrança" />
            ) : undefined
          }
        />
      );
    }
    return (
      <>
        <FinanceSummaryGlobal summary={summarize(visiveis, hoje)} />
        {visiveis.length === 0 ? (
          <EmptyStateGlobal title="Nenhuma cobrança com esses filtros" />
        ) : (
          <List aria-label="Cobranças">
            {visiveis.map((c) => (
              <ChargeCardGlobal
                key={c.id}
                title={c.jogador ? `${c.jogador.nome} — ${c.time?.nome ?? ''}` : (c.time?.nome ?? 'Time')}
                subtitle={formatMonth(c.referencia)}
                amount={Number(c.valor)}
                dueDate={c.vencimento}
                paidAt={c.pago_em}
                status={displayStatus(c, hoje)}
                note={c.observacao}
                hasReceipt={Boolean(c.comprovante_url)}
                busy={setStatus.isPending}
                onMarkPaid={() => {
                  markPaid.reset();
                  setPagando(c);
                }}
                onExempt={() =>
                  confirmAction('Marcar esta cobrança como isenta?', () =>
                    setStatus.mutate({ id: c.id, status: 'isento' }),
                  )
                }
                onUndo={() =>
                  confirmAction('Voltar esta cobrança para pendente?', () =>
                    setStatus.mutate({ id: c.id, status: 'pendente' }),
                  )
                }
                onOpenReceipt={() => c.comprovante_url && handleReceipt(c.comprovante_url)}
              />
            ))}
          </List>
        )}
      </>
    );
  };

  return (
    <>
      <PageHeaderGlobal
        title="Financeiro"
        subtitle={`Cobrança: ${COBRANCA_MODELO_LABEL[modelo]}${competition?.cobranca_valor ? ` · ${formatCurrency(Number(competition.cobranca_valor))}` : ''}`}
        actions={
          modelo !== 'nenhuma' && (
            <ButtonGlobal label="Gerar cobranças" loading={generate.isPending} onClick={handleGenerate} />
          )
        }
      />
      {(aviso || actionError) && (
        <Feedback>
          {aviso && <AlertGlobal variant="success" message={aviso} onClose={() => setAviso(null)} />}
          {actionError && <AlertGlobal variant="error" message={getErrorMessage(actionError)} />}
        </Feedback>
      )}
      {cobrancas.length > 0 && (
        <Filters>
          <SelectGlobal
            label="Mês"
            value={filtros.referencia}
            options={[{ value: '', label: 'Todos os meses' }, ...meses]}
            onChange={(event) => setFiltros((f) => ({ ...f, referencia: event.target.value }))}
          />
          <SelectGlobal
            label="Time"
            value={filtros.timeId}
            options={[{ value: '', label: 'Todos' }, ...times.map(([id, nome]) => ({ value: id, label: nome }))]}
            onChange={(event) => setFiltros((f) => ({ ...f, timeId: event.target.value }))}
          />
          <SelectGlobal
            label="Status"
            value={filtros.status}
            options={STATUS_OPTIONS}
            onChange={(event) => setFiltros((f) => ({ ...f, status: event.target.value as StatusExibicao | '' }))}
          />
        </Filters>
      )}
      {renderContent()}
      {pagando && (
        <MarkPaidModalGlobal
          open
          description={`${pagando.jogador?.nome ?? pagando.time?.nome ?? ''} · ${formatMonth(pagando.referencia)} · ${formatCurrency(Number(pagando.valor))}`}
          defaultDate={hoje}
          saving={markPaid.isPending}
          error={markPaid.error ? getErrorMessage(markPaid.error) : null}
          onSubmit={(input) =>
            confirmAction('Registrar este pagamento?', () =>
              markPaid.mutate({ cobranca: pagando, input }, { onSuccess: () => setPagando(null) }),
            )
          }
          onClose={() => setPagando(null)}
        />
      )}
    </>
  );
}
