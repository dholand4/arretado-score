// Integração das Etapas 3, 4 e 5 contra o Supabase LOCAL: fases montadas pelo assistente
// (salvar_fases), início pela Etapa 3, resultados pela súmula (Etapa 4) e avanço automático
// (Etapa 5) para fases de todos contra todos e de grupos — caminho que os aceites isolados não cobrem.
// Uso: npm run aceite:integracao   (requer `supabase start`; rode depois de `supabase db reset`)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => l.split('=').map((p) => p.trim())),
);
if (!/127\.0\.0\.1|localhost/.test(env.VITE_SUPABASE_URL)) throw new Error('Este script só roda contra o Supabase local.');

let falhas = 0;
const ok = (cond, msg, detalhe) => {
  console.log(`${cond ? '✅' : '❌'} ${msg}${!cond && detalhe ? `: ${JSON.stringify(detalhe)}` : ''}`);
  if (!cond) falhas += 1;
};
const client = () =>
  createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const admin = client();
{
  const { error } = await admin.auth.signInWithPassword({ email: 'admin@torneiomais.local', password: 'Admin@1234' });
  if (error) throw error;
}
const anon = client();
const get = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
const stamp = Date.now();
const fase = (nome, tipo, extra = {}) => ({
  nome,
  tipo,
  turnos: 1,
  melhores_extras: 0,
  melhor_de: 1,
  disputa_terceiro: false,
  ...extra,
});

async function criarCompeticao(nome, qtdTimes, fases) {
  const id = await get(
    admin.rpc('criar_competicao', { p_nome: nome, p_slug: `${nome.toLowerCase().replace(/\W+/g, '-')}-${stamp}`, p_modalidade: 'basquete' }),
  );
  const times = await get(
    admin
      .from('times')
      .insert(Array.from({ length: qtdTimes }, (_, i) => ({ competicao_id: id, nome: `Time ${String.fromCharCode(65 + i)}` })))
      .select(),
  );
  await get(admin.rpc('salvar_fases', { p_competicao_id: id, p_fases: fases }));
  await get(admin.rpc('iniciar_competicao', { p_competicao_id: id }));
  return { id, times };
}

const fasesDe = (id) => get(admin.from('fases').select('*').eq('competicao_id', id).order('ordem'));
const jogosDe = (faseId) => get(admin.from('jogos').select('*').eq('fase_id', faseId).order('rodada').order('id'));

// Mandante vence (10 x 5): resultados determinísticos, sem empate.
async function encerrarJogos(faseId) {
  for (const jogo of await jogosDe(faseId)) {
    if (['encerrado', 'wo'].includes(jogo.status)) continue;
    const { error } = await admin.rpc('registrar_resultado_jogo', {
      p_jogo_id: jogo.id,
      p_modo: 'placar',
      p_casa: 10,
      p_fora: 5,
    });
    if (error) throw error;
  }
}

async function encerrarSeries(faseId) {
  for (let rodada = 0; rodada < 7; rodada += 1) {
    const abertos = (await jogosDe(faseId)).filter((j) => !['encerrado', 'wo'].includes(j.status));
    if (abertos.length === 0) return;
    await encerrarJogos(faseId);
  }
}

const classificacao = (faseId, grupoId = null) =>
  get(anon.rpc('classificacao_ordenada', { p_fase_id: faseId, ...(grupoId && { p_grupo_id: grupoId }) }));

// ------------------------------------------------------------- todos contra todos → todos contra todos → final
console.log('\n— 6 times: todos contra todos → todos contra todos (4) → final');
{
  const { id } = await criarCompeticao(`Integracao RR ${stamp}`, 6, [
    fase('Classificação', 'todos_contra_todos', { classificam: 4 }),
    fase('Quadrangular', 'todos_contra_todos', { classificam: 2 }),
    fase('Final', 'mata_mata', { cruzamento: 'por_campanha', melhor_de: 1 }),
  ]);
  let [f1, f2, f3] = await fasesDe(id);
  ok((await jogosDe(f1.id)).length === 15, 'fase 1 iniciada pela Etapa 3 com 15 jogos');

  await encerrarJogos(f1.id);
  [f1, f2, f3] = await fasesDe(id);
  const top4 = (await classificacao(f1.id)).slice(0, 4).map((c) => c.time_id).sort();
  const jogosF2 = await jogosDe(f2.id);
  const timesF2 = [...new Set(jogosF2.flatMap((j) => [j.time_casa_id, j.time_fora_id]))].sort();
  ok(f1.status === 'concluida' && f2.status === 'em_andamento', 'fase 1 conclui e o quadrangular entra em andamento', [f1.status, f2.status]);
  ok(jogosF2.length === 6 && JSON.stringify(timesF2) === JSON.stringify(top4), 'quadrangular gerado com os 4 primeiros (6 jogos)', jogosF2.length);

  await encerrarJogos(f2.id);
  const top2 = (await classificacao(f2.id)).slice(0, 2).map((c) => c.time_id);
  const [final] = await get(admin.from('series').select('*').eq('fase_id', f3.id));
  ok(final.time_a_id === top2[0] && final.time_b_id === top2[1], 'final recebe 1º e 2º do quadrangular (1º como time A)', final);

  await encerrarSeries(f3.id);
  const comp = await get(admin.from('competicoes').select('status').eq('id', id).single());
  const finalDepois = await get(admin.from('series').select('*').eq('id', final.id).single());
  ok(comp.status === 'encerrada' && finalDepois.vencedor_id === top2[0], 'competição encerra com o campeão definido', [comp.status, finalDepois.vencedor_id]);
}

// ------------------------------------------------------------- todos contra todos → grupos → final
console.log('\n— 6 times: todos contra todos → 2 grupos (4 times) → final');
{
  const { id } = await criarCompeticao(`Integracao Grupos ${stamp}`, 6, [
    fase('Classificação', 'todos_contra_todos', { classificam: 4 }),
    fase('Grupos', 'grupos', { qtd_grupos: 2, classificam: 1 }),
    fase('Final', 'mata_mata', { cruzamento: 'por_campanha', melhor_de: 1 }),
  ]);
  let [f1, f2, f3] = await fasesDe(id);
  await encerrarJogos(f1.id);
  [f1, f2, f3] = await fasesDe(id);
  const grupos = await get(admin.from('grupos').select('id, nome, grupo_times(time_id)').eq('fase_id', f2.id).order('nome'));
  const top4 = (await classificacao(f1.id)).slice(0, 4).map((c) => c.time_id).sort();
  const nosGrupos = grupos.flatMap((g) => g.grupo_times.map((t) => t.time_id)).sort();
  ok(f2.status === 'em_andamento', 'fase de grupos entra em andamento', f2.status);
  ok(grupos.length === 2 && grupos.every((g) => g.grupo_times.length === 2), 'sorteio equilibrado: 2 grupos de 2', grupos);
  ok(JSON.stringify(nosGrupos) === JSON.stringify(top4), 'grupos recebem os 4 classificados da fase 1');
  ok((await jogosDe(f2.id)).length === 2, 'um jogo por grupo gerado');

  await encerrarJogos(f2.id);
  const lideres = [];
  for (const g of grupos) lideres.push((await classificacao(f2.id, g.id))[0].time_id);
  const [final] = await get(admin.from('series').select('*').eq('fase_id', f3.id));
  ok(
    [final.time_a_id, final.time_b_id].sort().join() === [...lideres].sort().join(),
    'final recebe os líderes dos dois grupos',
    final,
  );
  ok((await jogosDe(f3.id)).length === 1, 'jogo 1 da final criado');
}

console.log(falhas ? `\n${falhas} falha(s).` : '\nTodos os critérios passaram.');
process.exit(falhas ? 1 : 0);
