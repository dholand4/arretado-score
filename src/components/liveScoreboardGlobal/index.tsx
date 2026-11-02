import { AvatarGlobal } from '@/components/avatarGlobal';
import { formatGameClock, formatShotClock } from '@/utils/liveSheet';
import {
  Board,
  Bonus,
  Center,
  ClockButton,
  Controls,
  Crest,
  GameClock,
  Meta,
  Period,
  Score,
  ScoreRow,
  ShotClock,
  StartButton,
  Team,
  TeamName,
} from './style';
import type { ILiveScoreboardProps, ILiveScoreboardTeam } from './types';

function TeamScore({ time, lado }: { time: ILiveScoreboardTeam; lado: 'casa' | 'fora' }) {
  return (
    <Team>
      <TeamName title={time.nome}>{time.nome}</TeamName>
      <ScoreRow $lado={lado}>
        <Crest>
          <AvatarGlobal name={time.nome} src={time.logoUrl} size="sm" />
        </Crest>
        <Score aria-label={`Pontos de ${time.nome}`}>{time.placar}</Score>
      </ScoreRow>
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
      <TeamScore time={casa} lado="casa" />
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
      <TeamScore time={fora} lado="fora" />
    </Board>
  );
}

export type { ILiveScoreboardProps, ILiveScoreboardTeam } from './types';
