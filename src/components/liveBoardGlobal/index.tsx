import { formatGameClock, formatShotClock } from '@/utils/liveSheet';
import {
  Board,
  Bonus,
  Center,
  Crest,
  Dot,
  Dots,
  GameClock,
  Period,
  Score,
  ShotClock,
  Situation,
  Stats,
  Team,
  TeamName,
} from './style';
import type { ILiveBoardProps, ILiveBoardTeam } from './types';

const iniciais = (nome: string) =>
  nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

function TeamSide({ time, telao }: { time: ILiveBoardTeam; telao: boolean }) {
  return (
    <Team $telao={telao}>
      <Crest $telao={telao} aria-hidden>
        {time.logoUrl ? <img src={time.logoUrl} alt="" /> : iniciais(time.nome)}
      </Crest>
      <TeamName $telao={telao} title={time.nome}>
        {time.nome}
      </TeamName>
      <Score $telao={telao} aria-label={`Pontos de ${time.nome}`}>
        {time.placar}
      </Score>
      <Stats $telao={telao}>
        <span>Faltas {time.faltas}</span>
        {time.emBonus && <Bonus>BÔNUS</Bonus>}
        <span>Tempos</span>
        <Dots aria-label={`${time.temposRestantes} tempos restantes`}>
          {Array.from({ length: Math.max(time.temposRestantes, 0) }, (_, i) => (
            <Dot key={i} $cheio />
          ))}
        </Dots>
      </Stats>
    </Team>
  );
}

// Placar só de leitura: telão (tela inteira, de frente para a quadra) ou compacto (página do jogo).
export function LiveBoardGlobal({ casa, fora, periodo, jogoMs, posseMs, rodando, situacao, tamanho = 'compacto' }: ILiveBoardProps) {
  const telao = tamanho === 'telao';
  // Com menos tempo de jogo que de posse, o relógio de posse não vale.
  const mostrarPosse = posseMs !== null && posseMs <= jogoMs;
  return (
    <Board $telao={telao} aria-label="Placar ao vivo">
      <TeamSide time={casa} telao={telao} />
      <Center $telao={telao}>
        <Situation $telao={telao} $aoVivo={situacao === 'AO VIVO'}>
          {situacao}
        </Situation>
        <Period $telao={telao}>{periodo}</Period>
        <GameClock $telao={telao} $rodando={rodando} aria-label="Tempo de jogo">
          {formatGameClock(jogoMs)}
        </GameClock>
        {mostrarPosse && (
          <ShotClock $telao={telao} $alerta={(posseMs ?? 0) <= 5000} aria-label="Relógio de posse">
            {formatShotClock(posseMs ?? 0)}
          </ShotClock>
        )}
      </Center>
      <TeamSide time={fora} telao={telao} />
    </Board>
  );
}

export type { ILiveBoardProps, ILiveBoardTeam } from './types';
