import { ButtonGlobal } from '@/components/buttonGlobal';
import {
  Action,
  Actions,
  Excluded,
  FoulDot,
  Fouls,
  Header,
  Panel,
  Player,
  PlayerName,
  PlayerStats,
  Row,
  Rows,
  Title,
} from './style';
import type { ILiveTeamPanelProps } from './types';

const PONTOS = [1, 2, 3];

// Jogadores escalados de um time com os botões de ponto e falta, e o tempo debitado.
export function LiveTeamPanelGlobal({
  nome,
  jogadores,
  faltasExclusao,
  temposRestantes,
  disabled = false,
  onPonto,
  onFalta,
  onOutraFalta,
  onTempo,
}: ILiveTeamPanelProps) {
  return (
    <Panel aria-label={`Equipe ${nome}`}>
      <Header>
        <Title>{nome}</Title>
        <ButtonGlobal
          label={`Tempo (${temposRestantes})`}
          size="sm"
          variant="outline"
          disabled={disabled || temposRestantes <= 0}
          onClick={onTempo}
        />
      </Header>
      <Rows>
        {jogadores.map((jogador) => {
          const bloqueado = disabled || jogador.excluido;
          return (
            <Row key={jogador.id} $excluido={jogador.excluido} aria-label={jogador.rotulo}>
              <Player>
                <PlayerName>{jogador.rotulo}</PlayerName>
                <PlayerStats>
                  <span>{jogador.pontos} pts</span>
                  <Fouls aria-label={`${jogador.faltas} faltas`}>
                    {Array.from({ length: faltasExclusao }, (_, i) => (
                      <FoulDot key={i} $on={i < jogador.faltas} />
                    ))}
                  </Fouls>
                  {jogador.excluido && <Excluded>Excluído</Excluded>}
                </PlayerStats>
              </Player>
              <Actions>
                {PONTOS.map((valor) => (
                  <Action
                    key={valor}
                    type="button"
                    $tone="ponto"
                    disabled={bloqueado}
                    aria-label={`${valor} ${valor === 1 ? 'ponto' : 'pontos'} para ${jogador.rotulo}`}
                    onClick={() => onPonto(jogador.id, valor)}
                  >
                    +{valor}
                  </Action>
                ))}
                <Action
                  type="button"
                  $tone="falta"
                  disabled={bloqueado}
                  aria-label={`Falta de ${jogador.rotulo}`}
                  onClick={() => onFalta(jogador.id)}
                >
                  F
                </Action>
                <Action
                  type="button"
                  $tone="mais"
                  disabled={bloqueado}
                  aria-label={`Outras faltas de ${jogador.rotulo}`}
                  onClick={() => onOutraFalta(jogador.id)}
                >
                  ⋯
                </Action>
              </Actions>
            </Row>
          );
        })}
      </Rows>
    </Panel>
  );
}

export type { ILivePlayerRow, ILiveTeamPanelProps } from './types';
