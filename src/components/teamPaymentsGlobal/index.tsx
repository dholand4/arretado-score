import { useState, type FormEvent } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { STATUS_COBRANCA } from '@/constants/finance';
import { formatCurrency, formatMonth } from '@/utils/finance';
import { Actions, Generate, List, MonthTitle, Muted, Row, Wrapper } from './style';
import type { ITeamPaymentsProps } from './types';

// Controle interno do dono do time (8.2): valor por atleta, linhas do mês e quem pagou.
export function TeamPaymentsGlobal({
  payments,
  defaultMonth,
  busy = false,
  error,
  notice,
  onGenerate,
  onSetStatus,
}: ITeamPaymentsProps) {
  const [mes, setMes] = useState(defaultMonth.slice(0, 7));
  const [valor, setValor] = useState('');
  const [erroForm, setErroForm] = useState<string | null>(null);

  const meses = [...new Set(payments.map((p) => p.referencia))];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const numero = Number(valor.replace(',', '.'));
    if (!mes || !valor.trim() || Number.isNaN(numero) || numero < 0) {
      setErroForm('Informe o mês e um valor válido por atleta.');
      return;
    }
    setErroForm(null);
    onGenerate(`${mes}-01`, numero);
  };

  return (
    <Wrapper>
      <Generate onSubmit={handleSubmit} noValidate aria-label="Gerar mês">
        <InputGlobal label="Mês" type="month" value={mes} onChange={(event) => setMes(event.target.value)} />
        <InputGlobal label="Valor por atleta (R$)" inputMode="decimal" value={valor} onChange={(event) => setValor(event.target.value)} />
        <ButtonGlobal label="Gerar linhas do mês" type="submit" loading={busy} />
      </Generate>
      {erroForm && <AlertGlobal variant="error" message={erroForm} />}
      {error && <AlertGlobal variant="error" message={error} />}
      {notice && <AlertGlobal variant="success" message={notice} />}
      {meses.length === 0 ? (
        <EmptyStateGlobal title="Nenhum mês gerado" description="Gere o mês para listar os atletas ativos do elenco." />
      ) : (
        meses.map((referencia) => {
          const doMes = payments.filter((p) => p.referencia === referencia);
          const pagos = doMes.filter((p) => p.status === 'pago').length;
          return (
            <section key={referencia}>
              <MonthTitle>
                {formatMonth(referencia)}
                <Muted>
                  {pagos} de {doMes.length} pagos
                </Muted>
              </MonthTitle>
              <List>
                {doMes.map((pagamento) => (
                  <Row key={pagamento.id}>
                    <span>
                      {pagamento.jogador?.numero !== null && pagamento.jogador?.numero !== undefined && `${pagamento.jogador.numero} · `}
                      {pagamento.jogador?.nome ?? 'Atleta'} — {formatCurrency(Number(pagamento.valor))}
                    </span>
                    <Actions>
                      <BadgeGlobal label={STATUS_COBRANCA[pagamento.status].label} tone={STATUS_COBRANCA[pagamento.status].tone} />
                      {pagamento.status === 'pendente' ? (
                        <>
                          <ButtonGlobal label="Pagou" size="sm" disabled={busy} onClick={() => onSetStatus(pagamento.id, 'pago')} />
                          <ButtonGlobal
                            label="Isentar"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => onSetStatus(pagamento.id, 'isento')}
                          />
                        </>
                      ) : (
                        <ButtonGlobal
                          label="Desfazer"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => onSetStatus(pagamento.id, 'pendente')}
                        />
                      )}
                    </Actions>
                  </Row>
                ))}
              </List>
            </section>
          );
        })
      )}
    </Wrapper>
  );
}

export type { ITeamPaymentsProps } from './types';
