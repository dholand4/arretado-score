// Testes de aceite da Etapa 2 contra o Supabase LOCAL (master, admin, outro admin, dono_time e anon).
// Uso: npm run aceite:etapa2   (requer `supabase start` e o seed padrão)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => l.split('=').map((p) => p.trim())),
);
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!/127\.0\.0\.1|localhost/.test(URL_)) throw new Error('Este script só roda contra o Supabase local.');

// Usuários do supabase/seed.sql
const MASTER = { email: 'master@torneiomais.local', password: 'Master@123' };
const ADMIN = { email: 'admin@torneiomais.local', password: 'Admin@1234', id: '22222222-2222-2222-2222-222222222222' };
const OUTRO_ADMIN = { email: 'outro.admin@torneiomais.local', password: 'Admin@1234', id: '33333333-3333-3333-3333-333333333333' };
const DONO = { email: 'dono2@torneiomais.local', password: 'Dono@12345', id: '55555555-5555-5555-5555-555555555555' };
const DONO_SEED = { email: 'dono@torneiomais.local', password: 'Dono@12345' };
const SEED_COMP = 'c0000000-0000-0000-0000-000000000001';

// PNG 1x1 válido.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✅' : '❌'} ${msg}`);
  if (!cond) falhas += 1;
};
const client = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
async function login(cred) {
  const c = client();
  const { error } = await c.auth.signInWithPassword(cred);
  if (error) throw new Error(`login ${cred.email}: ${error.message}`);
  return c;
}
const upload = (c, bucket, path) => c.storage.from(bucket).upload(path, PNG, { contentType: 'image/png', upsert: true });

const stamp = Date.now();
const anon = client();
const master = await login(MASTER);
const admin = await login(ADMIN);
const outro = await login(OUTRO_ADMIN);
const dono = await login(DONO);
const donoSeed = await login(DONO_SEED);

// ------------------------------------------------------------- master cria a liga e entrega ao admin
console.log('\n— master cria a competição para o admin');
ok(
  (await admin.rpc('criar_competicao', { p_nome: 'x', p_slug: `admin-x-${stamp}`, p_modalidade: 'basquete' })).error,
  'admin comum não cria liga',
);
const { data: cid, error: criarErr } = await master.rpc('criar_competicao', {
  p_nome: `Copa Aceite ${stamp}`,
  p_slug: `copa-aceite-${stamp}`,
  p_modalidade: 'basquete',
  p_local_padrao: 'Quadra Central',
});
ok(!criarErr && cid, 'master cria competição pela RPC');
ok(!(await master.from('competicao_admins').insert({ competicao_id: cid, user_id: ADMIN.id })).error, 'master define o admin da liga');
{
  const { data: cats } = await admin.from('categorias_estatistica').select('*').eq('competicao_id', cid);
  const placar = cats.find((c) => c.soma_no_placar);
  ok(cats.length === 1 && placar?.sigla === 'PTS' && placar.titulo_ranking === 'Cestinha', 'categoria de placar "Pontos/Cestinha" criada automaticamente');
  const { data: admins } = await admin.from('competicao_admins').select('user_id').eq('competicao_id', cid);
  ok(admins.length === 2, 'master (criador) e o admin escolhido administram a liga');

  const up = await upload(admin, 'logos', `${cid}/competicao/${cid}.png`);
  ok(!up.error, 'admin envia o logo da competição');
  const url = admin.storage.from('logos').getPublicUrl(`${cid}/competicao/${cid}.png`).data.publicUrl;
  const upd = await admin.from('competicoes').update({ logo_url: url }).eq('id', cid).select().single();
  ok(!upd.error && upd.data.logo_url === url, 'logo_url gravado');
  ok((await fetch(url)).status === 200, 'logo acessível pela URL pública');

  const extra = await admin.from('categorias_estatistica').insert({ competicao_id: cid, nome: 'Rebotes', sigla: 'reb', titulo_ranking: 'Reboteiro' }).select().single();
  ok(!extra.error && extra.data.sigla === 'REB' && extra.data.ordem === 2, 'categoria extra criada (sigla em maiúsculas, ordem 2)');
  ok((await admin.from('categorias_estatistica').insert({ competicao_id: cid, nome: 'X', sigla: 'X', titulo_ranking: 'X', soma_no_placar: true })).error, 'não cria segunda categoria de placar');
  ok((await admin.from('categorias_estatistica').delete().eq('id', placar.id)).error, 'não exclui a categoria de placar');
  ok((await admin.from('categorias_estatistica').update({ ativa: false }).eq('id', placar.id)).error, 'não desativa a categoria de placar');
  ok(!(await admin.from('categorias_estatistica').update({ nome: 'Pontos marcados' }).eq('id', placar.id)).error, 'renomeia a categoria de placar');

  ok((await admin.from('competicoes').update({ status: 'em_andamento' }).eq('id', cid)).error, 'admin não muda status direto (só pelo sistema)');
  ok((await admin.from('competicoes').update({ estrutura_travada: true }).eq('id', cid)).error, 'admin não mexe na trava direto');
  const dup = await admin.from('competicoes').update({ slug: 'liga-amadora-basquete-2026' }).eq('id', cid);
  ok(dup.error?.code === '23505', 'slug duplicado é recusado');
  const fiba = await admin.from('competicoes').update({ pontos_vitoria: 2, pontos_derrota: 1, criterios_desempate: ['vitorias', 'saldo'] }).eq('id', cid);
  ok(!fiba.error, 'admin salva pontuação FIBA e critérios');
  ok((await admin.from('competicoes').update({ criterios_desempate: ['saldo', 'saldo'] }).eq('id', cid)).error, 'critério repetido é recusado');
}

// ------------------------------------------------------------- times e jogadores
console.log('\n— 5 times com jogadores e fotos');
const times = [];
for (let i = 1; i <= 5; i += 1) {
  const { data, error } = await admin
    .from('times')
    .insert({ competicao_id: cid, nome: `Time ${i}`, sigla: `t${i}`, dono_id: i === 1 ? DONO.id : null })
    .select()
    .single();
  if (error) console.log(error);
  times.push(data);
}
ok(times.every(Boolean) && times[0].sigla === 'T1', '5 times cadastrados (sigla normalizada)');
ok(times[0].dono_id === DONO.id, 'dono vinculado ao Time 1');
ok((await admin.from('times').update({ dono_id: OUTRO_ADMIN.id }).eq('id', times[1].id)).error, 'só usuário "dono do time" pode ser vinculado');

const jogadores = {};
let fotosOk = true;
for (const [t, time] of times.entries()) {
  const rows = [1, 2, 3].map((n) => ({ time_id: time.id, competicao_id: SEED_COMP, nome: `Jogador ${t + 1}.${n}`, numero: n * 10 }));
  const { data, error } = await admin.from('jogadores').insert(rows).select();
  if (error) console.log(error);
  jogadores[time.id] = data;
  const first = data[0];
  const path = `${cid}/jogadores/${first.id}.png`;
  const up = await upload(admin, 'fotos-jogadores', path);
  const url = admin.storage.from('fotos-jogadores').getPublicUrl(path).data.publicUrl;
  const upd = await admin.from('jogadores').update({ foto_url: url }).eq('id', first.id);
  fotosOk &&= !up.error && !upd.error;
}
ok(Object.values(jogadores).flat().length === 15, '15 jogadores cadastrados');
ok(Object.values(jogadores).flat().every((j) => j.competicao_id === cid), 'competicao_id do jogador vem do time (ignora o enviado)');
ok(fotosOk, 'fotos enviadas e gravadas para um jogador de cada time');
{
  const t1 = times[0].id;
  const t2 = times[1].id;
  ok((await admin.from('jogadores').insert({ time_id: t1, nome: 'Repetido', numero: 10 })).error?.code === '23505', 'número repetido no mesmo time é recusado');
  await admin.from('jogadores').insert({ time_id: t1, nome: 'Camisa 45', numero: 45 });
  ok(!(await admin.from('jogadores').insert({ time_id: t2, nome: 'Também camisa 45', numero: 45 })).error, 'mesmo número em outro time é aceito');
  await admin.from('jogadores').insert({ time_id: t1, nome: 'Doc A', documento: '123.456.789-00' });
  ok((await admin.from('jogadores').insert({ time_id: t2, nome: 'Doc B', documento: '12345678900' })).error?.code === '23505', 'mesmo documento em dois times da competição é recusado');
}

// ------------------------------------------------------------- anon
console.log('\n— anon');
{
  ok((await anon.from('competicoes').select('id').eq('id', cid)).data.length === 0, 'anon não vê competição em rascunho');
  ok((await anon.from('competicoes').select('id').eq('id', SEED_COMP)).data.length === 1, 'anon vê competição em andamento (liga do seed)');
  ok((await anon.from('times').select('id').eq('competicao_id', cid)).data.length === 0, 'anon não vê times de rascunho');
  ok((await anon.from('jogadores').select('id').eq('competicao_id', cid)).data.length === 0, 'anon não vê jogadores de rascunho');
  ok((await anon.rpc('criar_competicao', { p_nome: 'x', p_slug: `x-${stamp}`, p_modalidade: 'basquete' })).error, 'anon não cria competição');
  ok((await upload(anon, 'logos', `${cid}/competicao/${cid}.png`)).error, 'anon não envia arquivos');
}

// ------------------------------------------------------------- outro admin
console.log('\n— outro admin');
{
  ok((await outro.from('competicoes').select('id').eq('id', cid)).data.length === 0, 'outro admin não vê a competição');
  ok((await outro.from('times').select('id').eq('competicao_id', cid)).data.length === 0, 'outro admin não vê os times');
  ok((await outro.from('jogadores').select('id').eq('competicao_id', cid)).data.length === 0, 'outro admin não vê os jogadores');
  const upd = await outro.from('competicoes').update({ nome: 'Invadida' }).eq('id', cid).select();
  ok(upd.data?.length === 0 || upd.error, 'outro admin não altera a competição');
  ok((await outro.from('times').insert({ competicao_id: cid, nome: 'Intruso' })).error, 'outro admin não cria time nela');
  ok((await upload(outro, 'logos', `${cid}/times/${times[0].id}.png`)).error, 'outro admin não envia logo nela');
  const ligaUpd = await outro.from('competicoes').update({ nome: 'Invadida' }).eq('id', SEED_COMP).select();
  ok(ligaUpd.data?.length === 0 || ligaUpd.error, 'outro admin vê a liga pública, mas não altera');
}

// ------------------------------------------------------------- dono do time
console.log('\n— dono do time');
{
  const t1 = times[0].id;
  const t2 = times[1].id;
  const meu = jogadores[t1][0];
  const alheio = jogadores[t2][0];

  ok((await dono.from('competicoes').select('id').eq('id', cid)).data.length === 1, 'dono vê a competição do seu time (mesmo em rascunho)');
  const visiveis = await dono.from('times').select('id').eq('competicao_id', cid);
  ok(visiveis.data.length === 1 && visiveis.data[0].id === t1, 'dono vê só o próprio time');
  const elenco = await dono.from('jogadores').select('time_id').eq('competicao_id', cid);
  ok(elenco.data.length > 0 && elenco.data.every((j) => j.time_id === t1), 'dono vê só o próprio elenco');

  const novo = await dono.from('jogadores').insert({ time_id: t1, nome: 'Reforço do dono', numero: 99 }).select().single();
  ok(!novo.error, 'dono cadastra jogador no próprio time');
  ok(!(await dono.from('jogadores').update({ numero: 77, apelido: 'Capitão' }).eq('id', meu.id)).error, 'dono edita jogador do próprio time');
  ok(!(await upload(dono, 'fotos-jogadores', `${cid}/jogadores/${meu.id}.png`)).error, 'dono envia foto de jogador do próprio time');
  ok(!(await upload(dono, 'logos', `${cid}/times/${t1}.png`)).error, 'dono envia logo do próprio time');
  ok(!(await dono.from('times').update({ nome: 'Time 1 do Dono' }).eq('id', t1)).error, 'dono renomeia o próprio time');

  ok((await dono.from('jogadores').insert({ time_id: t2, nome: 'Infiltrado' })).error, 'dono não cadastra jogador em outro time');
  const outroUpd = await dono.from('jogadores').update({ nome: 'Hackeado' }).eq('id', alheio.id).select();
  ok(outroUpd.data?.length === 0 || outroUpd.error, 'dono não edita jogador de outro time');
  ok((await dono.from('jogadores').update({ time_id: t2 }).eq('id', meu.id)).error, 'dono não transfere jogador para outro time');
  ok((await upload(dono, 'fotos-jogadores', `${cid}/jogadores/${alheio.id}.png`)).error, 'dono não envia foto de jogador de outro time');
  ok((await upload(dono, 'logos', `${cid}/times/${t2}.png`)).error, 'dono não envia logo de outro time');
  ok((await dono.from('times').update({ sigla: 'XX' }).eq('id', t1)).error, 'dono não muda a sigla');
  ok((await dono.from('times').update({ dono_id: null }).eq('id', t1)).error, 'dono não se desvincula/troca o dono');
  await dono.from('jogadores').delete().eq('id', meu.id);
  ok((await admin.from('jogadores').select('id').eq('id', meu.id)).data.length === 1, 'dono não exclui jogador (só desativa)');
  ok(!(await dono.from('jogadores').update({ ativo: false }).eq('id', novo.data.id)).error, 'dono desativa jogador do próprio time');

  ok((await dono.from('times').update({ nome: 'X' }).eq('id', 'a0000000-0000-0000-0000-000000000002').select()).data?.length === 0, 'dono não altera time de outra competição');
  ok((await donoSeed.from('jogadores').select('id').eq('competicao_id', cid)).data.length === 0, 'dono de outra competição não vê este elenco');
}

// ------------------------------------------------------------- master
console.log('\n— master');
{
  ok((await master.from('competicoes').select('id').eq('id', cid)).data.length === 1, 'master vê a competição');
  ok(!(await master.from('competicao_admins').insert({ competicao_id: cid, user_id: OUTRO_ADMIN.id })).error, 'master adiciona outro admin à competição');
  ok((await outro.from('competicoes').select('id').eq('id', cid)).data.length === 1, 'outro admin passa a ver a competição');
  ok((await admin.from('competicao_admins').insert({ competicao_id: cid, user_id: DONO.id })).error, 'admin comum não gerencia admins');
  ok((await master.from('competicao_admins').insert({ competicao_id: cid, user_id: DONO.id })).error, 'dono do time não vira admin de competição');
  await master.from('competicao_admins').delete().match({ competicao_id: cid, user_id: OUTRO_ADMIN.id });
  ok((await outro.from('competicoes').select('id').eq('id', cid)).data.length === 0, 'removido, outro admin deixa de ver');

  // Limpeza: arquivos e competição (o cascade também passa pela proteção da categoria de placar).
  const paths = [`${cid}/competicao/${cid}.png`, `${cid}/times/${times[0].id}.png`];
  await master.storage.from('logos').remove(paths);
  const fotos = Object.values(jogadores).flat().map((j) => `${cid}/jogadores/${j.id}.png`);
  await master.storage.from('fotos-jogadores').remove(fotos);
  const del = await master.from('competicoes').delete().eq('id', cid);
  ok(!del.error && (await master.from('times').select('id').eq('competicao_id', cid)).data.length === 0, 'master exclui a competição de teste (cascade)');
}

console.log(falhas ? `\n${falhas} falha(s).` : '\nTodos os critérios passaram.');
process.exit(falhas ? 1 : 0);
