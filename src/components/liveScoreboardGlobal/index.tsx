import { formatGameClock, formatShotClock } from '@/utils/liveSheet';
import {
  Board,
  Bonus,
  Center,
  ClockButton,
  Controls,
  GameClock,
  Meta,
  Period,
  Score,
  ShotClock,
  StartButton,
  Team,
  TeamName,
} from './style';
import type { ILiveScoreboardProps, ILiveScoreboardTeam } from './types';

function TeamScore({ time }: { time: ILiveScoreboardTeam }) {
  return (
    <Team>
      <TeamName title={time.nome}>{time.nome}</TeamName>
      <Score aria-label={`Pontos de ${time.nome}`}>{time.placar}</Score>
      <Meta>
        <span>Faltas {time.faltas}</span>
        {time.emBonus && <Bonus>BÔNUS</Bonus>}
      </Meta>
      <Meta>
        Tempos {time.temposUsados}/{time.temposLimite}
      </Meta>
    </Team>
  );
}

// Placar da mesa: pontos, faltas e tempos de cada equipe, cronômetro e relógio de posse.
export function LiveScoreboardGlobal({
  casa,
  fora,
  periodo,
  jogoMs,
  posseMs,
  posseSegundos,
  posseCurta,
  rodando,
  disabled = false,
  onToggle,
  onAjustarJogo,
  onPosse,
  onAjustarPosse,
}: ILiveScoreboardProps) {
  // Com menos tempo de jogo que de posse, o relógio de posse não vale (fica apagado).
  const posseDesligada = posseMs !== null && posseMs > jogoMs;
  return (
    <Board aria-label="Placar da mesa">
      <TeamScore time={casa} />
      <Center>
        <Period>{periodo}</Period>
        <GameClock $rodando={rodando} aria-label="Cronômetro do jogo">
          {formatGameClock(jogoMs)}
        </GameClock>
        {posseMs !== null && (
          <ShotClock $desligado={posseDesligada} aria-label="Relógio de posse">
            {formatShotClock(posseMs)}
          </ShotClock>
        )}
        <StartButton type="button" $primary={!rodando} disabled={disabled || (!rodando && jogoMs <= 0)} onClick={onToggle}>
          {rodando ? 'Pausar' : 'Iniciar'}
        </StartButton>
        {posseMs !== null && (
          <Controls>
            <ClockButton type="button" disabled={disabled} onClick={() => onPosse(posseSegundos)}>
              {posseSegundos}
            </ClockButton>
            <ClockButton type="button" disabled={disabled} onClick={() => onPosse(posseCurta)}>
              {posseCurta}
            </ClockButton>
          </Controls>
        )}
        {!rodando && (
          <Controls aria-label="Corrigir os relógios">
            <ClockButton type="button" disabled={disabled} aria-label="Cronômetro menos 1 segundo" onClick={() => onAjustarJogo(-1000)}>
              −1s
            </ClockButton>
            <ClockButton type="button" disabled={disabled} aria-label="Cronômetro mais 1 segundo" onClick={() => onAjustarJogo(1000)}>
              +1s
            </ClockButton>
            {posseMs !== null && (
              <>
                <ClockButton type="button" disabled={disabled} aria-label="Posse menos 1 segundo" onClick={() => onAjustarPosse(-1000)}>
                  −1 posse
                </ClockButton>
                <ClockButton type="button" disabled={disabled} aria-label="Posse mais 1 segundo" onClick={() => onAjustarPosse(1000)}>
                  +1 posse
                </ClockButton>
              </>
            )}
          </Controls>
        )}
      </Center>
      <TeamScore time={fora} />
    </Board>
  );
}

export type { ILiveScoreboardProps, ILiveScoreboardTeam } from './types';
