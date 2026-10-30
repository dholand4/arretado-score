import { formatCurrency } from '@/utils/finance';
import { Card, Grid, Label, Value } from './style';
import type { IFinanceSummaryProps } from './types';

export function FinanceSummaryGlobal({ summary }: IFinanceSummaryProps) {
  return (
    <Grid aria-label="Resumo financeiro">
      <Card $tone="neutral">
        <Value>{formatCurrency(summary.previsto)}</Value>
        <Label>Previsto</Label>
      </Card>
      <Card $tone="success">
        <Value>{formatCurrency(summary.recebido)}</Value>
        <Label>Recebido</Label>
      </Card>
      <Card $tone="warning">
        <Value>{formatCurrency(summary.pendente)}</Value>
        <Label>Pendente</Label>
      </Card>
      <Card $tone="danger">
        <Value>{summary.emAtraso}</Value>
        <Label>Em atraso</Label>
      </Card>
    </Grid>
  );
}

export type { IFinanceSummaryProps } from './types';
