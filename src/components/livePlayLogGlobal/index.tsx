import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { Empty, Item, List, Text, When } from './style';
import type { ILivePlayLogProps } from './types';

// Histórico de lances da mesa; anulados ficam riscados.
export function LivePlayLogGlobal({ itens, disabled = false, onAnular }: ILivePlayLogProps) {
  if (itens.length === 0) return <Empty>Nenhum lance ainda.</Empty>;
  return (
    <List aria-label="Lances">
      {itens.map((item) => (
        <Item key={item.id} $anulado={item.anulado}>
          <When>
            {item.periodo} {item.tempo}
          </When>
          <Text>
            {item.texto}
            {item.pendente && <BadgeGlobal label="Enviando" tone="warning" />}
            {item.anulado && <BadgeGlobal label="Anulado" />}
          </Text>
          {onAnular && !item.anulado ? (
            <ButtonGlobal
              label="Anular"
              size="sm"
              variant="ghost"
              disabled={disabled}
              aria-label={`Anular: ${item.texto}`}
              onClick={() => onAnular(item.id)}
            />
          ) : (
            <span />
          )}
        </Item>
      ))}
    </List>
  );
}

export type { ILivePlayItem, ILivePlayLogProps } from './types';
