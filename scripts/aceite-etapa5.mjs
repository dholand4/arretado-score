// Executar após db reset; usa exclusivamente o Supabase local.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').filter((line) => line.includes('=')).map((line) => line.split('=').map((s) => s.trim())));
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(env.VITE_SUPABASE_URL)) throw new Error('Apenas Supabase local.');
const make = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const login = async (email, password) => { const c = make(); const r = await c.auth.signInWithPassword({ email, password }); if (r.error) throw r.error; return c; };
const [master, admin, outro, dono] = await Promise.all([login('master@torneiomais.local', 'Master@123'), login('admin@torneiomais.local', 'Admin@1234'), login('outro.admin@torneiomais.local', 'Admin@1234'), login('dono@torneiomais.local', 'Dono@12345')]);
const anon = make();
let failures = 0;
const ok = (condition, label, detail) => { console.log(`${condition ? '✅' : '❌'} ${label}${!condition && detail ? `: ${JSON.stringify(detail)}` : ''}`); if (!condition) failures++; };
const get = async (query) => { const { data, error } = await query; if (error) throw error; return data; };
const save = (client, id, args = {}) => client.rpc('registrar_resultado_jogo', { p_jogo_id: id, p_modo: 'placar', p_casa: 10, p_fora: 5, ...args });
const comp = 'c0000000-0000-0000-0000-000000000001';
const phases = await get(admin.from('fases').select('*').eq('competicao_id', comp).order('ordem'));
const pending = await get(anon.from('series').select('*').in('fase_id', phases.map((f) => f.id)));
ok(pending.length === 3 && pending.every((s) => !s.time_a_id && s.origem_a), 'anon vê origens pendentes');
for (const [client, label] of [[outro, 'outro admin'], [dono, 'dono'], [anon, 'anon']]) {
  const result = await client.from('series').update({ vitorias_a: 9 }).eq('id', pending[0].id).select();
  ok(result.error || result.data?.length === 0, `${label} não altera séries`);
}
const draftId = await get(master.rpc('criar_competicao', { p_nome: 'Rascunho playoff', p_slug: 'rascunho-playoff', p_modalidade: 'basquete' }));
const draft = { id: draftId };
const draftPhase = await get(master.from('fases').insert({ competicao_id: draft.id, ordem: 1, nome: 'Final', tipo: 'mata_mata' }).select().single());
await get(master.from('series').insert({ fase_id: draftPhase.id, codigo: 'S1' }).select());
ok((await get(anon.from('series').select('*').eq('fase_id', draftPhase.id))).length === 0, 'anon não lê série de rascunho');
const games = await get(admin.from('jogos').select('*').eq('fase_id', phases[0].id).order('id'));
for (const game of games) { const r = await save(admin, game.id); if (r.error) throw r.error; }
const standings = await get(anon.rpc('classificacao_ordenada', { p_fase_id: phases[0].id }));
let semifinals = await get(admin.from('series').select('*').eq('fase_id', phases[1].id).order('codigo'));
ok(semifinals[0].time_a_id === standings[0].time_id && semifinals[0].time_b_id === standings[3].time_id && semifinals[1].time_a_id === standings[1].time_id && semifinals[1].time_b_id === standings[2].time_id, 'semifinais 1º × 4º e 2º × 3º pela classificação', { standings, semifinals });
const seriesGames = async (id) => get(admin.from('jogos').select('*').eq('serie_id', id).order('numero_na_serie'));
let sg = await seriesGames(semifinals[0].id);
ok(sg.length === 1 && sg[0].time_casa_id === semifinals[0].time_a_id, 'primeiro jogo criado com mando da melhor campanha');
ok((await save(admin, sg[0].id, { p_modo: 'wo', p_ausente: 'ambos' })).error, 'W.O. duplo recusado em série');
let r = await save(admin, sg[0].id, { p_modo: 'wo', p_ausente: 'fora' }); if (r.error) throw r.error;
sg = await seriesGames(semifinals[0].id);
ok(sg.length === 2 && sg[1].time_casa_id === semifinals[0].time_b_id, 'W.O. conta e segundo jogo inverte mando');
r = await save(admin, sg[1].id); if (r.error) throw r.error;
sg = await seriesGames(semifinals[0].id);
ok(sg.length === 3 && sg[2].time_casa_id === semifinals[0].time_a_id, 'jogo 3 criado em 1 × 1 com mando ímpar');
r = await save(admin, sg[0].id, { p_casa: 1, p_fora: 2 }); if (r.error) throw r.error;
sg = await seriesGames(semifinals[0].id);
let updated = await get(admin.from('series').select('*').eq('id', semifinals[0].id).single());
ok(sg.length === 2 && updated.vitorias_b === 2 && updated.status === 'concluida', 'edição recalcula série e remove jogo não disputado', updated);
r = await save(admin, sg[0].id, { p_casa: 10, p_fora: 5 }); if (r.error) throw r.error;
sg = await seriesGames(semifinals[0].id);
ok(sg.length === 3, 'edição desfaz decisão e recria terceiro jogo');
r = await save(admin, sg[2].id); if (r.error) throw r.error;
sg = await seriesGames(semifinals[1].id);
for (let i = 0; i < 2; i++) { r = await save(admin, sg[i].id, i === 0 ? {} : { p_casa: 5, p_fora: 10 }); if (r.error) throw r.error; sg = await seriesGames(semifinals[1].id); }
ok(sg.length === 2, 'série 2 × 0 não cria jogo 3');
let final = (await get(admin.from('series').select('*').eq('fase_id', phases[2].id)))[0];
ok(final.time_a_id && final.time_b_id, 'final recebe vencedores das semifinais');
sg = await seriesGames(final.id);
for (let i = 0; i < 2; i++) { r = await save(admin, sg[i].id, i === 0 ? {} : { p_casa: 5, p_fora: 10 }); if (r.error) throw r.error; sg = await seriesGames(final.id); }
final = await get(anon.from('series').select('*').eq('id', final.id).single());
ok(final.status === 'concluida' && final.vencedor_id && (await get(anon.from('competicoes').select('status').eq('id', comp).single())).status === 'encerrada', 'campeão definido e competição encerrada');
ok((await save(master, games[0].id, { p_casa: 1, p_fora: 99 })).error, 'edição que mudaria confrontos já disputados é rejeitada');

// Cenário de dois grupos, configurado como o assistente da Etapa 3.
const c2Id = await get(master.rpc('criar_competicao', { p_nome: 'Grupos de teste', p_slug: 'grupos-teste', p_modalidade: 'basquete' }));
const c2 = { id: c2Id };
const t2 = await get(master.from('times').insert(Array.from({ length: 8 }, (_, i) => ({ competicao_id: c2.id, nome: `Time ${i + 1}` }))).select());
const f2 = await get(master.from('fases').insert([
  { competicao_id: c2.id, ordem: 1, nome: 'Grupos', tipo: 'grupos', qtd_grupos: 2, classificam: 2, status: 'em_andamento' },
  { competicao_id: c2.id, ordem: 2, nome: 'Semifinais', tipo: 'mata_mata', cruzamento: 'cruzado_grupos', status: 'aguardando' },
  { competicao_id: c2.id, ordem: 3, nome: 'Final', tipo: 'mata_mata', cruzamento: 'vencedores', status: 'aguardando' },
]).select().order('ordem'));
const groups = await get(master.from('grupos').insert(['A', 'B'].map((nome) => ({ fase_id: f2[0].id, nome }))).select().order('nome'));
await get(master.from('grupo_times').insert(t2.map((t, i) => ({ grupo_id: groups[Math.floor(i / 4)].id, time_id: t.id }))).select());
const origin = (grupo, posicao) => ({ tipo: 'posicao_grupo', fase_ordem: 1, grupo, posicao });
await get(master.from('series').insert([
  { fase_id: f2[1].id, codigo: 'S1', origem_a: origin('A', 1), origem_b: origin('B', 2) },
  { fase_id: f2[1].id, codigo: 'S2', origem_a: origin('B', 1), origem_b: origin('A', 2) },
  { fase_id: f2[2].id, codigo: 'S3', origem_a: { tipo: 'vencedor', serie: 'S1' }, origem_b: { tipo: 'vencedor', serie: 'S2' } },
]).select());
const groupGames = [];
for (let g = 0; g < 2; g++) for (let i = 0; i < 4; i++) for (let k = i + 1; k < 4; k++) groupGames.push({ competicao_id: c2.id, fase_id: f2[0].id, grupo_id: groups[g].id, time_casa_id: t2[g * 4 + i].id, time_fora_id: t2[g * 4 + k].id });
const inserted = await get(master.from('jogos').insert(groupGames).select());
for (const game of inserted) { r = await save(master, game.id); if (r.error) throw r.error; }
const ranks = await Promise.all(groups.map((g) => get(master.rpc('classificacao_ordenada', { p_fase_id: f2[0].id, p_grupo_id: g.id }))));
const cross = await get(master.from('series').select('*').eq('fase_id', f2[1].id).order('codigo'));
ok([cross[0].time_a_id, cross[0].time_b_id].includes(ranks[0][0].time_id) && [cross[0].time_a_id, cross[0].time_b_id].includes(ranks[1][1].time_id) && [cross[1].time_a_id, cross[1].time_b_id].includes(ranks[1][0].time_id) && [cross[1].time_a_id, cross[1].time_b_id].includes(ranks[0][1].time_id), 'cruzamento 1ºA × 2ºB e 1ºB × 2ºA');
for (const s of cross) { const game = (await get(master.from('jogos').select('*').eq('serie_id', s.id)))[0]; r = await save(master, game.id); if (r.error) throw r.error; }
const groupFinal = (await get(master.from('series').select('*').eq('fase_id', f2[2].id)))[0];
ok(groupFinal.time_a_id && groupFinal.time_b_id, 'final dos grupos recebe vencedores');
const finalGame = (await get(master.from('jogos').select('*').eq('serie_id', groupFinal.id)))[0];
r = await save(master, finalGame.id); if (r.error) throw r.error;
ok((await get(anon.from('competicoes').select('status').eq('id', c2.id).single())).status === 'encerrada', 'competição de grupos termina');
// Origens manuais, melhores extras e disputa de terceiro.
const c3 = await get(master.rpc('criar_competicao', { p_nome: 'Origens manuais', p_slug: 'origens-manuais', p_modalidade: 'basquete' }));
const t3 = await get(master.from('times').insert(Array.from({ length: 4 }, (_, i) => ({ competicao_id: c3, nome: `Manual ${i + 1}` }))).select());
const f3 = await get(master.from('fases').insert([
  { competicao_id: c3, ordem: 1, nome: 'Grupos', tipo: 'grupos', classificam: 1, melhores_extras: 2, status: 'em_andamento' },
  { competicao_id: c3, ordem: 2, nome: 'Semifinal', tipo: 'mata_mata', cruzamento: 'manual', status: 'aguardando' },
  { competicao_id: c3, ordem: 3, nome: 'Final', tipo: 'mata_mata', cruzamento: 'vencedores', disputa_terceiro: true, status: 'aguardando' },
].map((f) => ({ classificam: null, melhores_extras: 0, cruzamento: null, disputa_terceiro: false, ...f }))).select().order('ordem'));
const g3 = await get(master.from('grupos').insert(['A', 'B'].map((nome) => ({ fase_id: f3[0].id, nome }))).select().order('nome'));
await get(master.from('grupo_times').insert(t3.map((t, i) => ({ grupo_id: g3[Math.floor(i / 2)].id, time_id: t.id }))).select());
const extra = (n) => ({ tipo: 'melhor_extra', fase_ordem: 1, posicao: n });
await get(master.from('series').insert([
  { fase_id: f3[1].id, codigo: 'S1', origem_a: origin('A', 1), origem_b: extra(1) },
  { fase_id: f3[1].id, codigo: 'S2', origem_a: origin('B', 1), origem_b: extra(2) },
  { fase_id: f3[2].id, codigo: 'S3', origem_a: { tipo: 'vencedor', serie: 'S1' }, origem_b: { tipo: 'vencedor', serie: 'S2' } },
  { fase_id: f3[2].id, codigo: 'S4', origem_a: { tipo: 'perdedor', serie: 'S1' }, origem_b: { tipo: 'perdedor', serie: 'S2' } },
]).select());
const g3games = await get(master.from('jogos').insert(g3.map((g, i) => ({ competicao_id: c3, fase_id: f3[0].id, grupo_id: g.id, time_casa_id: t3[i * 2].id, time_fora_id: t3[i * 2 + 1].id }))).select());
for (const game of g3games) { r = await save(master, game.id); if (r.error) throw r.error; }
const extras = await get(master.rpc('melhores_extras', { p_fase_id: f3[0].id, p_posicao: 2 }));
const manual = await get(master.from('series').select('*').eq('fase_id', f3[1].id).order('codigo'));
ok(manual.every((s, i) => [s.time_a_id, s.time_b_id].includes(extras[i].time_id)), 'origens manuais resolvem melhores extras');
for (const s of manual) { const game = (await get(master.from('jogos').select('*').eq('serie_id', s.id)))[0]; r = await save(master, game.id); if (r.error) throw r.error; }
const finals = await get(master.from('series').select('*').eq('fase_id', f3[2].id).order('codigo'));
const losers = manual.map((s) => s.time_b_id);
ok(finals[1].time_a_id && finals[1].time_b_id && losers.every((id) => [finals[1].time_a_id, finals[1].time_b_id].includes(id)), 'disputa de terceiro recebe perdedores');
for (const s of finals) { const game = (await get(master.from('jogos').select('*').eq('serie_id', s.id)))[0]; r = await save(master, game.id); if (r.error) throw r.error; }
ok((await get(master.from('competicoes').select('status').eq('id', c3).single())).status === 'encerrada', 'encerra após final e disputa de terceiro');

if (failures) process.exitCode = 1;
