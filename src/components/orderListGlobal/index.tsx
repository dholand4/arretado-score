import { useState } from 'react';
import { Controls, Description, IconButton, Item, List, Position, Texts } from './style';
import type { IOrderListProps } from './types';

function move(ids: string[], from: number, to: number): string[] {
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// Lista ordenável: arrastar (desktop) ou botões ↑/↓ (celular e teclado).
export function OrderListGlobal({ items, onChange, onRemove, disabled = false, ariaLabel }: IOrderListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const ids = items.map((item) => item.id);

  return (
    <List aria-label={ariaLabel}>
      {items.map((item, index) => (
        <Item
          key={item.id}
          draggable={!disabled}
          $dragging={dragIndex === index}
          onDragStart={() => setDragIndex(index)}
          onDragEnd={() => setDragIndex(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && dragIndex !== index) onChange(move(ids, dragIndex, index));
            setDragIndex(null);
          }}
        >
          <Position>{index + 1}º</Position>
          <Texts>
            <span>{item.label}</span>
            {item.description && <Description>{item.description}</Description>}
          </Texts>
          <Controls>
            <IconButton
              type="button"
              aria-label={`Subir ${item.label}`}
              disabled={disabled || index === 0}
              onClick={() => onChange(move(ids, index, index - 1))}
            >
              ↑
            </IconButton>
            <IconButton
              type="button"
              aria-label={`Descer ${item.label}`}
              disabled={disabled || index === items.length - 1}
              onClick={() => onChange(move(ids, index, index + 1))}
            >
              ↓
            </IconButton>
            {onRemove && (
              <IconButton
                type="button"
                aria-label={`Remover ${item.label}`}
                disabled={disabled}
                onClick={() => onRemove(item.id)}
              >
                ×
              </IconButton>
            )}
          </Controls>
        </Item>
      ))}
    </List>
  );
}

export type { IOrderItem, IOrderListProps } from './types';
