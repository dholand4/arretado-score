import type { ICategoria, ITimeResumo } from '@/@types/competition';
import { getErrorMessage } from '@/utils/appError';
import type { IJogoAndamento } from '@/@types/event';
import type { IFase } from '@/@types/phase';
import { buildChecklist, buildProgressChecklist } from '@/utils/competitionChecklist';
import { validateBasics, validatePlayer, validateScoring, validateTeam } from '@/utils/competitionValidators';
import { fitWithin, validateImageFile } from '@/utils/image';
import { isValidSlug, slugify } from '@/utils/slugify';
import { initials } from '@/utils/text';
import { isWizardStep, nextWizardStep } from '@/utils/wizard';
import { isRoutePath, paths } from '@/routes/types';

describe('slugify', () => {
  it('normalizes names', () => {
    expect(slugify('  Copa Verão — 2026! ')).toBe('copa-verao-2026');
    expect(isValidSlug('copa-verao-2026')).toBe(true);
    expect(isValidSlug('Copa 2026')).toBe(false);
  });
});

describe('image', () => {
  it('fits within 800px keeping aspect ratio', () => {
    expect(fitWithin(1600, 1200)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(400, 300)).toEqual({ width: 400, height: 300 });
  });

  it('accepts only jpeg, png and webp', () => {
    expect(validateImageFile(new File([''], 'a.webp', { type: 'image/webp' }))).toBeNull();
    expect(validateImageFile(new File([''], 'a.gif', { type: 'image/gif' }))).not.toBeNull();
  });
});

describe('validators', () => {
  it('basics', () => {
    expect(validateBasics({ nome: '', slug: 'x y', modalidade: 'basquete', descricao: '', local_padrao: '', intervalo_jogos_min: 0 }))
      .toEqual({ nome: expect.any(String), slug: expect.any(String), intervalo_jogos_min: expect.any(String) });
  });

  it('scoring requires non-negative integers and a winning W.O. score', () => {
    const base = {
      pontos_vitoria: 1, pontos_derrota: 0, pontos_derrota_wo: 0, permite_empate: false, pontos_empate: 0,
      wo_placar_vencedor: 20, wo_placar_perdedor: 0, criterios_desempate: [],
    };
    expect(validateScoring(base)).toEqual({});
    expect(Object.keys(validateScoring({ ...base, pontos_vitoria: -1, wo_placar_vencedor: 0 }))).toEqual([
      'pontos_vitoria',
      'wo_placar_vencedor',
    ]);
  });

  it('team and player', () => {
    expect(validateTeam({ nome: 'A', sigla: 'ABCDE', dono_id: null }).sigla).toBeDefined();
    expect(validatePlayer({ nome: 'A', apelido: '', numero: 1000, posicao: '', documento: '', ativo: true }).numero).toBeDefined();
  });
});

describe('checklist', () => {
  it('flags missing teams and players', () => {
    const items = buildChecklist(
      [{ ativa: true } as ICategoria],
      [{ jogadores: [{ count: 0 }] } as ITimeResumo],
    );
    expect(items.find((i) => i.key === 'times')?.done).toBe(false);
    expect(items.find((i) => i.key === 'jogadores')?.label).toBe('1 time sem jogadores');
    expect(items.find((i) => i.key === 'fases')).toMatchObject({ done: false, step: 'fases' });
    expect(buildChecklist([], [], 3).find((i) => i.key === 'fases')).toMatchObject({ done: true, label: 'Fases: 3 configuradas' });
  });

  it('tracks the running phase', () => {
    const phases = [{ id: 'f1', nome: 'Fase 1', status: 'em_andamento' }] as IFase[];
    const games = [
      { id: 'j1', fase_id: 'f1', status: 'pendente', evento_id: null },
      { id: 'j2', fase_id: 'f1', status: 'agendado', evento_id: 'e1' },
      { id: 'j3', fase_id: 'f1', status: 'encerrado', evento_id: 'e1' },
    ] as IJogoAndamento[];
    expect(buildProgressChecklist(phases, games).map((i) => i.label)).toEqual([
      '1 jogo da Fase 1 sem dia definido',
      'Faltam 2 súmulas para fechar a Fase 1',
    ]);
    expect(buildProgressChecklist([], games)).toEqual([]);
  });
});

describe('wizard', () => {
  it('follows the step order', () => {
    expect(nextWizardStep('dados')).toBe('regras');
    expect(nextWizardStep('regras')).toBe('pontuacao');
    expect(nextWizardStep('cobranca')).toBe('times');
    expect(nextWizardStep('times')).toBe('revisao');
    expect(isWizardStep('regras')).toBe(true);
    expect(isWizardStep('outra')).toBe(false);
  });
});

describe('routes', () => {
  it('builds and recognizes dynamic paths', () => {
    expect(paths.competitionSettings('c1', 'revisao')).toBe('/painel/competicoes/c1/configuracao?etapa=revisao');
    expect(isRoutePath('/painel/competicoes/c1/times/t1')).toBe(true);
    expect(isRoutePath('https://evil.example')).toBe(false);
  });
});

describe('getErrorMessage for database errors', () => {
  it('maps unique and trigger errors', () => {
    expect(getErrorMessage({ code: '23505', message: 'duplicate key value violates unique constraint "jogadores_time_numero_key"' }))
      .toMatch(/mesmo número|esse número/);
    expect(getErrorMessage({ code: 'P0001', message: 'O dono do time só pode alterar o nome e o logo.' }))
      .toBe('O dono do time só pode alterar o nome e o logo.');
  });

  it('initials', () => {
    expect(initials('carlos da silva')).toBe('CS');
    expect(initials('Liga Amadora de Basquete 2026')).toBe('LB');
  });
});
