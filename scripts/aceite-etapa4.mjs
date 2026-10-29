// Execute depois de `npx supabase db reset`; usa somente o Supabase local e o seed.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').filter((line) => line.includes('=')).map((line) => line.split('=').map((s) => s.trim())));
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(env.VITE_SUPABASE_URL)) throw new Error('Apenas Supabase local.');
const make = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const login = async (email,password) => { const c = make(); const {error} = await c.auth.signInWithPassword({email,password}); if (error) throw error; return c; };
const [master, admin, outro, dono] = await Promise.all([login('master@torneiomais.local','Master@123'),login('admin@torneiomais.local','Admin@1234'),login('outro.admin@torneiomais.local','Admin@1234'),login('dono@torneiomais.local','Dono@12345')]);
const anon = make();
let failures = 0;
const ok = (condition, label, error) => { console.log(`${condition ? '✅' : '❌'} ${label}${!condition && error ? `: ${JSON.stringify(error)}` : ''}`); if (!condition) failures++; };
const comp = 'c0000000-0000-0000-0000-000000000001', fase = 'f0000000-0000-0000-0000-000000000001';
const {data: games} = await admin.from('jogos').select('*').eq('fase_id',fase).order('id');
const game = games[0];
const {data: players} = await admin.from('jogadores').select('*').in('time_id',[game.time_casa_id,game.time_fora_id]);
const {data: categories} = await admin.from('categorias_estatistica').select('*').eq('competicao_id',comp);
const cat = categories.find((c) => c.soma_no_placar);
const home = players.find((p) => p.time_id === game.time_casa_id), away = players.find((p) => p.time_id === game.time_fora_id);
const result = (client, id, mode, rest = {}) => client.rpc('registrar_resultado_jogo', {p_jogo_id:id,p_modo:mode,...rest});
for (const [client,label] of [[anon,'anon'],[outro,'outro admin'],[dono,'dono']]) ok((await result(client,game.id,'placar',{p_casa:5,p_fora:2})).error, `${label} não lança resultado`);
for (const [client,label] of [[master,'master'],[admin,'admin'],[outro,'outro admin'],[dono,'dono'],[anon,'anon']]) ok((await client.from('sumula_estatisticas').insert({jogo_id:game.id,jogador_id:home.id,time_id:home.time_id,categoria_id:cat.id,valor:2})).error, `${label} não escreve estatísticas diretamente`);
const adjustment = {p_fase_id:fase,p_time_id:game.time_casa_id,p_prioridade:1};
ok((await anon.rpc('ajustar_classificacao',adjustment)).error,'anon não ajusta posição');
ok((await dono.rpc('ajustar_classificacao',adjustment)).error,'dono não ajusta posição');
const adjusted = await admin.rpc('ajustar_classificacao',adjustment);
const ordered = await anon.rpc('classificacao_ordenada',{p_fase_id:fase});
ok(!adjusted.error && ordered.data?.[0]?.time_id === game.time_casa_id && ordered.data[0].empate_tecnico,'admin ajusta empate técnico e visitante vê a ordem',adjusted.error ?? ordered.error);
ok(!(await admin.rpc('ajustar_classificacao',{p_fase_id:fase,p_time_id:game.time_casa_id})).error,'admin remove ajuste');
ok((await admin.from('ajustes_classificacao_historico').select('*').eq('fase_id',fase)).data?.length === 2,'ajuste e remoção são registrados');
const full = {p_jogadores:[{jogador_id:home.id,valores:{[cat.id]:15}},{jogador_id:away.id,valores:{[cat.id]:9}}]};
let res = await result(admin,game.id,'completa',full);
ok(!res.error,'admin lança súmula completa',res.error);
let row = (await admin.from('jogos').select('*').eq('id',game.id).single()).data;
ok(row?.placar_casa === 15 && row.placar_fora === 9 && !row.so_placar,'placar calculado a partir dos jogadores',row);
ok((await anon.from('sumula_estatisticas').select('*').eq('jogo_id',game.id)).data?.length === 2,'anon lê estatísticas do jogo encerrado');
ok(!(await anon.from('sumula_estatisticas').select('*').eq('jogo_id',games[1].id)).data?.length,'anon não lê súmula de jogo pendente');
ok((await admin.from('competicoes').select('estrutura_travada').eq('id',comp).single()).data?.estrutura_travada,'primeira súmula trava estrutura');
ok((await admin.from('competicoes').update({pontos_vitoria:2}).eq('id',comp)).error,'admin não altera pontuação travada');
const faseUpdate = await admin.from('fases').update({nome:'Teste'}).eq('id',fase).select();
ok(faseUpdate.error || faseUpdate.data?.length === 0,'admin não altera fase travada');
ok(!(await master.from('competicoes').update({pontos_vitoria:2}).eq('id',comp)).error,'master altera pontuação travada');
await master.from('competicoes').update({pontos_vitoria:1}).eq('id',comp);
ok((await result(admin,games[1].id,'placar',{p_casa:4,p_fora:4})).error,'empate recusado no basquete');
res = await result(admin,game.id,'placar',{p_casa:3,p_fora:8});
ok(!res.error,'edição como só placar',res.error);
ok(!(await admin.from('sumula_estatisticas').select('*').eq('jogo_id',game.id)).data?.length,'só placar remove estatísticas anteriores');
let standings = await anon.rpc('classificacao_ordenada',{p_fase_id:fase});
ok(!standings.error && standings.data?.find((r) => r.time_id === game.time_fora_id)?.v === 1,'edição atualiza tabela pública',standings.error);
res = await result(admin,game.id,'wo',{p_ausente:'casa'});
ok(!res.error,'lança W.O.',res.error);
row = (await admin.from('jogos').select('*').eq('id',game.id).single()).data;
standings = await anon.rpc('classificacao_ordenada',{p_fase_id:fase});
const absent = standings.data?.find((r) => r.time_id === game.time_casa_id), winner = standings.data?.find((r) => r.time_id === game.time_fora_id);
ok(row?.placar_casa === 0 && row.placar_fora === 20 && absent?.wo === 1 && absent?.saldo === -20 && winner?.saldo === 20,'W.O. 20 × 0 entra no saldo e nas derrotas',standings.error);
res = await result(master,game.id,'wo',{p_ausente:'ambos'});
row = (await master.from('jogos').select('*').eq('id',game.id).single()).data;
ok(!res.error && row?.placar_casa === 0 && row.placar_fora === 0 && row.vencedor_id === null,'master lança W.O. duplo');

// Três vitórias iguais: 1 vence 2 por 1, 2 vence 3 por 2, 3 vence 1 por 3.
// No minitorneio 2 e 3 empatam em saldo; ao reaplicar, 2 vence 3.
for (const [index,casa,fora] of [[8,10,9],[3,10,8],[6,7,10]]) {
  const r = await result(admin,games[index].id,'placar',{p_casa:casa,p_fora:fora});
  ok(!r.error,`lança jogo ${index + 1} para desempate`,r.error);
  if (index === 3) {
    const two = await anon.rpc('classificacao_ordenada',{p_fase_id:fase});
    const one = two.data?.findIndex((r) => r.time_id.endsWith('0001'));
    const twoIndex = two.data?.findIndex((r) => r.time_id.endsWith('0002'));
    ok(one < twoIndex,'dois times com mesma pontuação ordenados pelo confronto direto',two.error);
  }
}
standings = await anon.rpc('classificacao_ordenada',{p_fase_id:fase});
const selected = standings.data?.filter((r) => ['a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003'].includes(r.time_id));
ok(selected?.map((r) => r.time_id.slice(-1)).join('') === '231','confronto direto separa um dos três e reaplica ao subgrupo',standings.error ?? selected);
const fase2 = 'f0000000-0000-0000-0000-000000000002';
const fixture = await master.from('jogos').insert({competicao_id:comp,fase_id:fase2,time_casa_id:game.time_casa_id,time_fora_id:game.time_fora_id}).select().single();
ok(!fixture.error,'prepara jogo de mata-mata',fixture.error);
if (fixture.data) {
  await master.from('competicoes').update({permite_empate:true}).eq('id',comp);
  ok((await result(master,fixture.data.id,'placar',{p_casa:1,p_fora:1})).error,'empate recusado no mata-mata mesmo quando a competição permite');
  ok(!(await result(master,fixture.data.id,'placar',{p_casa:2,p_fora:1})).error,'master encerra jogo da fase seguinte');
  ok(!(await master.from('fases').update({status:'concluida'}).eq('id',fase)).error,'master conclui fase para testar edição');
  ok((await result(admin,game.id,'placar',{p_casa:3,p_fora:1})).error,'admin não edita fase concluída após resultado da fase seguinte');
  ok(!(await result(master,game.id,'placar',{p_casa:3,p_fora:1})).error,'master pode editar fase concluída');
}

// Comparação de classificados extras de grupos distintos.
const newPhase = await master.from('fases').insert({competicao_id:comp,ordem:4,nome:'Teste grupos',tipo:'grupos',qtd_grupos:2}).select().single();
if (!newPhase.error) {
  const groups = await master.from('grupos').insert([{fase_id:newPhase.data.id,nome:'A'},{fase_id:newPhase.data.id,nome:'B'}]).select();
  if (!groups.error) {
    const team = (n) => `a0000000-0000-0000-0000-00000000000${n}`;
    const groupGames = await master.from('jogos').insert([
      {competicao_id:comp,fase_id:newPhase.data.id,grupo_id:groups.data[0].id,time_casa_id:team(1),time_fora_id:team(2)},
      {competicao_id:comp,fase_id:newPhase.data.id,grupo_id:groups.data[1].id,time_casa_id:team(3),time_fora_id:team(4)},
    ]).select();
    if (!groupGames.error) {
      await result(master,groupGames.data[0].id,'placar',{p_casa:15,p_fora:5});
      await result(master,groupGames.data[1].id,'placar',{p_casa:12,p_fora:7});
      const extras = await anon.rpc('melhores_extras',{p_fase_id:newPhase.data.id,p_posicao:1});
      ok(!extras.error && extras.data?.map((r) => r.time_id.slice(-1)).join('') === '13','compara melhores extras por pontos, aproveitamento, saldo e pontos pró',extras.error);
    } else ok(false,'prepara jogos de grupos',groupGames.error);
  } else ok(false,'prepara grupos',groups.error);
} else ok(false,'prepara fase de grupos',newPhase.error);
if (failures) process.exitCode = 1;
