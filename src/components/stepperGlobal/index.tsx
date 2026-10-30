import { useEffect, useRef } from 'react';
import { useScrollEdges } from '@/hooks/useScrollEdges';
import { List, Number, StepButton } from './style';
import type { IStepperProps } from './types';

export function StepperGlobal({ steps, current, onSelect }: IStepperProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const { ref: listRef, edges } = useScrollEdges<HTMLOListElement>();

  // No celular a lista rola na horizontal: mantém a etapa atual visível.
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [current]);

  return (
    <nav aria-label="Etapas">
      <List ref={listRef} $fadeStart={edges.start} $fadeEnd={edges.end}>
        {steps.map((step, index) => {
          const active = step.key === current;
          return (
            <li key={step.key}>
              <StepButton
                ref={active ? activeRef : undefined}
                type="button"
                $active={active}
                disabled={step.disabled}
                aria-current={active ? 'step' : undefined}
                title={step.hint}
                onClick={() => onSelect(step.key)}
              >
                <Number $active={active}>{index + 1}</Number>
                {step.label}
              </StepButton>
            </li>
          );
        })}
      </List>
    </nav>
  );
}

export type { IStep, IStepperProps } from './types';
