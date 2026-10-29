import { AvatarGlobal } from '@/components/avatarGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { pluralize } from '@/utils/text';
import { Actions, Count, Header, Item, List, Meta, Name, Number, Texts, Wrapper } from './style';
import type { IRosterProps } from './types';

export function RosterGlobal({
  players,
  canDelete = false,
  busy = false,
  onAdd,
  onEdit,
  onToggleActive,
  onDelete,
}: IRosterProps) {
  const ativos = players.filter((p) => p.ativo).length;

  return (
    <Wrapper>
      <Header>
        <Count>
          {pluralize(ativos, 'jogador ativo', 'jogadores ativos')}
          {players.length > ativos && ` · ${players.length - ativos} inativo(s)`}
        </Count>
        <ButtonGlobal label="Adicionar jogador" size="sm" onClick={onAdd} />
      </Header>

      {players.length === 0 ? (
        <EmptyStateGlobal title="Elenco vazio" description="Cadastre os jogadores com número e foto." />
      ) : (
        <List aria-label="Elenco">
          {players.map((player) => (
            <Item key={player.id} $inactive={!player.ativo}>
              <AvatarGlobal name={player.nome} src={player.foto_url} />
              <Number>{player.numero ?? '–'}</Number>
              <Texts>
                <Name>
                  {player.nome}
                  {!player.ativo && <BadgeGlobal label="Inativo" />}
                </Name>
                <Meta>{[player.apelido && `“${player.apelido}”`, player.posicao].filter(Boolean).join(' · ') || ' '}</Meta>
              </Texts>
              <Actions>
                <ButtonGlobal label="Editar" size="sm" variant="outline" onClick={() => onEdit(player)} />
                <ButtonGlobal
                  label={player.ativo ? 'Desativar' : 'Ativar'}
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => onToggleActive(player)}
                />
                {canDelete && onDelete && (
                  <ButtonGlobal label="Excluir" size="sm" variant="ghost" onClick={() => onDelete(player)} />
                )}
              </Actions>
            </Item>
          ))}
        </List>
      )}
    </Wrapper>
  );
}

export type { IRosterProps } from './types';
