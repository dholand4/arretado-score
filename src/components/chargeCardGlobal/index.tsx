import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { STATUS_COBRANCA } from '@/constants/finance';
import { formatCurrency, formatDate } from '@/utils/finance';
import { Actions, Amount, Card, Meta, Title, Top } from './style';
import type { IChargeCardProps } from './types';

export function ChargeCardGlobal({
  title,
  subtitle,
  amount,
  dueDate,
  paidAt,
  status,
  note,
  hasReceipt,
  busy = false,
  onMarkPaid,
  onExempt,
  onUndo,
  onOpenReceipt,
}: IChargeCardProps) {
  const aberto = status === 'pendente' || status === 'atrasado';
  return (
    <Card>
      <Top>
        <Title>{title}</Title>
        <Amount>{formatCurrency(amount)}</Amount>
      </Top>
      <Meta>
        {subtitle} · vence {formatDate(dueDate)}
        {paidAt && ` · pago em ${formatDate(paidAt)}`}
      </Meta>
      {note && <Meta>{note}</Meta>}
      <Actions>
        <BadgeGlobal label={STATUS_COBRANCA[status].label} tone={STATUS_COBRANCA[status].tone} />
        {aberto ? (
          <>
            <ButtonGlobal label="Marcar como pago" size="sm" disabled={busy} onClick={onMarkPaid} />
            <ButtonGlobal label="Isentar" size="sm" variant="ghost" disabled={busy} onClick={onExempt} />
          </>
        ) : (
          <ButtonGlobal label="Desfazer" size="sm" variant="ghost" disabled={busy} onClick={onUndo} />
        )}
        {hasReceipt && <ButtonGlobal label="Comprovante" size="sm" variant="outline" disabled={busy} onClick={onOpenReceipt} />}
      </Actions>
    </Card>
  );
}

export type { IChargeCardProps } from './types';
