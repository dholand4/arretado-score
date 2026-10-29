import { summaryText } from '@/utils/phaseFormat';
import { Arrow, Empty, Flow, Item, Phase, Transition } from './style';
import type { IFormatSummaryProps } from './types';

// Resumo visual do formato: fases em sequência, com o que avança entre elas.
export function FormatSummaryGlobal({ steps, emptyText = 'Nenhuma fase configurada.' }: IFormatSummaryProps) {
  if (steps.length === 0) return <Empty>{emptyText}</Empty>;
  return (
    <Flow aria-label={`Resumo do formato: ${summaryText(steps)}`}>
      {steps.map((step, index) => (
        <Item key={`${index}-${step.label}`}>
          {index > 0 && <Arrow aria-hidden="true">→</Arrow>}
          {step.kind === 'fase' ? <Phase>{step.label}</Phase> : <Transition>{step.label}</Transition>}
        </Item>
      ))}
    </Flow>
  );
}

export type { IFormatSummaryProps } from './types';
