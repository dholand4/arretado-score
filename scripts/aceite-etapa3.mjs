// Testes de aceite da Etapa 3 contra o Supabase LOCAL (master, admin, outro admin, dono_time e anon).
// Uso: npm run aceite:etapa3   (requer `supabase start` e o seed padrão)
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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
const OUTRO_ADMIN = { email: 'outro.admin@torneiomais.local', password: 'Admin@1234' };
const DONO = { email: 'dono2@torneiomais.local', password: 'Dono@12345', id: '55555555-5555-5555-5555-555555555555' };

let falhas = 0;
const ok = (cond, msg, extra) => {
  console.log(`${cond ? '✅' : '❌'} ${msg}`);
  if (!cond) {
    falhas += 1;
    if (extra !== undefined) console.log('   ↳', JSON.stringify(extra));
  }
};
const client = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
async function login(cred) {
  const c = client();
  const { error } = await c.auth.signInWithPassword(cred);
  if (error) throw new Error(`login ${cred.email}: ${error.message}`);
  return c;
}
const negado = (res) => Boolean(res.error) && res.data == null;

const stamp = Date.now();
const anon = client();
const master = await login(MASTER);
const admin = await login(ADMIN);
const outro = await login(OUTRO_ADMIN);
const dono = await login(DONO);
const criadas = [];

async function novaCompeticao(sufixo, qtdTimes, { donoNoPrimeiro = false } = {}) {
  // Só o master cria liga; ele entrega para o admin.
  const { data: id, error } = await master.rpc('criar_competicao', {
    p_nome: `Etapa3 ${sufixo} ${stamp}`,
    p_slug: `etapa3-${sufixo}-${stamp}`,
    p_modalidade: 'basquete',
    p_local_padrao: 'Quadra Central',
  });
  if (error) throw new Error(`criar competição: ${error.message}`);
  const vinculo = await master.from('competicao_admins').insert({ competicao_id: id, user_id: ADMIN.id });
  if (vinculo.error) throw new Error(`vincular admin: ${vinculo.error.message}`);
  criadas.push(id);
  const rows = Array.from({ length: qtdTimes }, (_, i) => ({
    competicao_id: id,
    nome: `Time ${String.fromCharCode(65 + i)}`,
    dono_id: donoNoPrimeiro && i === 0 ? DONO.id : null,
  }));
  const { data: times, error: e2 } = qtdTimes ? await admin.from('times').insert(rows).select() : { data: [] };
  if (e2) throw new Error(`criar times: ${e2.message}`);
  return { id, times };
}
const fase = (nome, tipo, extra = {}) => ({ nome, tipo, turnos: 1, melhores_extras: 0, melhor_de: 1, disputa_terceiro: false, ...extra });
const series = async (c, compId) => {
  const { data } = await c.from('series').select('codigo, origem_a, origem_b, time_a_id, time_b_id, melhor_de, fases!inner(competicao_id, ordem)').eq('fases.competicao_id', compId);
  return (data ?? []).sort((a, b) => Number(a.codigo.slice(1)) - Number(b.codigo.slice(1)));
};
const jogosDa = async (c, compId) => (await c.from('jogos').select('*').eq('competicao_id', compId)).data ?? [];

// Formato do critério: 5 times todos contra todos → semifinal melhor de 3 → final melhor de 3.
const FORMATO = [
  fase('Fase 1', 'todos_contra_todos', { classificam: 4 }),
  fase('Semifinal', 'mata_mata', { melhor_de: 3, cruzamento: 'por_campanha' }),
  fase('Final', 'mata_mata', { melhor_de: 3, cruzamento: 'vencedores' }),
];

// ------------------------------------------------------------- fases
console.log('\n— fases: configuração, validação e séries com origens');
const liga = await novaCompeticao('liga', 5, { donoNoPrimeiro: true });
{
  ok(negado(await outro.rpc('salvar_fases', { p_competicao_id: liga.id, p_fases: FORMATO })), 'outro admin não salva fases na competição dos outros');
  ok(negado(await dono.rpc('salvar_fases', { p_competicao_id: liga.id, p_fases: FORMATO })), 'dono do time não salva fases');
  ok(negado(await anon.rpc('salvar_fases', { p_competicao_id: liga.id, p_fases: FORMATO })), 'anon não salva fases');

  const erro = async (fases) => (await admin.rpc('salvar_fases', { p_competicao_id: liga.id, p_fases: fases })).error?.message ?? null;
  ok(/primeira fase/.test(await erro([fase('Mata', 'mata_mata', { cruzamento: 'por_campanha' })]) ?? ''), 'recusa mata-mata como fase 1');
  ok(/número par/.test(await erro([fase('F1', 'todos_contra_todos', { classificam: 3 }), fase('Semi', 'mata_mata', { cruzamento: 'por_campanha' })]) ?? ''), 'recusa mata-mata com número ímpar de classificados');
  ok(/cruzamento entre grupos/.test(await erro([fase('F1', 'todos_contra_todos', { classificam: 4 }), fase('Semi', 'mata_mata', { cruzamento: 'cruzado_grupos' })]) ?? ''), 'recusa cruzado entre grupos sem fase de grupos');
  ok(/3º lugar/.test(await erro([fase('F1', 'todos_contra_todos', { classificam: 4 }), fase('Semi', 'mata_mata', { cruzamento: 'por_campanha', disputa_terceiro: true })]) ?? ''), 'recusa disputa de 3º fora da final');
  ok(/informe quantos times avançam/.test(await erro([fase('F1', 'todos_contra_todos'), fase('Final', 'mata_mata', { cruzamento: 'por_campanha' })]) ?? ''), 'exige classificados quando há fase seguinte');
  ok(/ao menos 2/.test(await erro([...FORMATO, fase('Depois', 'todos_contra_todos')]) ?? ''), 'recusa fase depois da final (só 1 time chega)');

  const salvo = await admin.rpc('salvar_fases', { p_competicao_id: liga.id, p_fases: FORMATO });
  ok(!salvo.error, 'admin salva 3 fases', salvo.error);
  const { data: fases } = await admin.from('fases').select('*').eq('competicao_id', liga.id).order('ordem');
  ok(fases?.length === 3 && fases.every((f) => f.status === 'aguardando'), '3 fases gravadas em ordem, aguardando');
  ok(fases?.[0].entrada?.tipo === 'todos_os_times' && fases?.[1].entrada?.fase_ordem === 1, 'entrada: fase 1 com todos os times; seguintes com os classificados da anterior');
  ok(fases?.[1].classificam === 2 && fases?.[2].classificam === 1, 'mata-mata: classificam = vencedores das séries (2 e 1)');
  const s = await series(admin, liga.id);
  const pos = (o) => (o.tipo === 'posicao' ? `${o.posicao}º` : `${o.tipo}:${o.serie}`);
  ok(
    s.length === 3 &&
      `${pos(s[0].origem_a)} x ${pos(s[0].origem_b)}` === '1º x 4º' &&
      `${pos(s[1].origem_a)} x ${pos(s[1].origem_b)}` === '2º x 3º' &&
      `${pos(s[2].origem_a)} x ${pos(s[2].origem_b)}` === 'vencedor:S1 x vencedor:S2',
    'séries: S1 1º x 4º, S2 2º x 3º, S3 vencedor S1 x vencedor S2',
    s.map((x) => [x.codigo, x.origem_a, x.origem_b]),
  );
  ok(s.every((x) => x.time_a_id === null && x.time_b_id === null && x.melhor_de === 3), 'séries gravadas com times nulos e melhor de 3');
  ok((await anon.from('fases').select('id').eq('competicao_id', liga.id)).data?.length === 0, 'anon não vê as fases de competição em rascunho');
  ok((await outro.from('series').select('id').in('fase_id', fases.map((f) => f.id))).data?.length === 0, 'outro admin não vê as séries');
}

console.log('\n— fases: cruzamentos cruzado_grupos, vencedores + 3º lugar e manual');
const formatos = await novaCompeticao('formatos', 0);
{
  const salvar = (fases) => admin.rpc('salvar_fases', { p_competicao_id: formatos.id, p_fases: fases });
  const r1 = await salvar([
    fase('Grupos', 'grupos', { qtd_grupos: 2, classificam: 2 }),
    fase('Semifinal', 'mata_mata', { cruzamento: 'cruzado_grupos' }),
    fase('Final', 'mata_mata', { cruzamento: 'vencedores', melhor_de: 3, disputa_terceiro: true }),
  ]);
  ok(!r1.error, 'salva grupos → cruzado → final com disputa de 3º', r1.error);
  const s = await series(admin, formatos.id);
  const g = (o) => (o.tipo === 'posicao_grupo' ? `${o.posicao}º${o.grupo}` : `${o.tipo}:${o.serie}`);
  ok(
    s.map((x) => `${x.codigo}=${g(x.origem_a)} x ${g(x.origem_b)}`).join(', ') ===
      'S1=1ºA x 2ºB, S2=1ºB x 2ºA, S3=vencedor:S1 x vencedor:S2, S4=perdedor:S1 x perdedor:S2',
    'cruzado: 1ºA x 2ºB e 1ºB x 2ºA; final e 3º lugar entre os perdedores',
    s.map((x) => `${x.codigo}=${g(x.origem_a)} x ${g(x.origem_b)}`),
  );

  const o = (posicao, grupo) => ({ tipo: 'posicao_grupo', fase_ordem: 1, grupo, posicao });
  const manual = (confrontos) =>
    salvar([fase('Grupos', 'grupos', { qtd_grupos: 2, classificam: 2 }), fase('Semi', 'mata_mata', { cruzamento: 'manual', confrontos })]);
  ok(/inválida/.test((await manual([{ origem_a: o(1, 'A'), origem_b: o(3, 'B') }, { origem_a: o(1, 'B'), origem_b: o(2, 'A') }])).error?.message ?? ''), 'manual: recusa origem que não existe (3º do grupo B)');
  ok(/só pode aparecer/.test((await manual([{ origem_a: o(1, 'A'), origem_b: o(2, 'A') }, { origem_a: o(1, 'A'), origem_b: o(2, 'B') }])).error?.message ?? ''), 'manual: recusa origem repetida');
  const r2 = await manual([{ origem_a: o(1, 'A'), origem_b: o(2, 'A') }, { origem_a: o(1, 'B'), origem_b: o(2, 'B') }]);
  const s2 = await series(admin, formatos.id);
  ok(!r2.error && s2.length === 2 && s2[0].origem_b.grupo === 'A', 'manual: grava os confrontos escolhidos (e remove a fase final que saiu)', r2.error ?? s2);
  const fasesRestantes = (await admin.from('fases').select('id').eq('competicao_id', formatos.id)).data;
  ok(fasesRestantes?.length === 2, 'fases removidas da configuração são apagadas');
}

// ------------------------------------------------------------- iniciar competição
console.log('\n— iniciar competição e geração de jogos (5 times, 1 turno)');
{
  const vazia = await novaCompeticao('vazia', 1);
  ok(/ao menos 2 times/.test((await admin.rpc('iniciar_competicao', { p_competicao_id: vazia.id })).error?.message ?? ''), 'não inicia com menos de 2 times');
  await admin.from('times').insert({ competicao_id: vazia.id, nome: 'Time B' });
  ok(/Configure as fases/.test((await admin.rpc('iniciar_competicao', { p_competicao_id: vazia.id })).error?.message ?? ''), 'não inicia sem a fase 1 configurada');

  ok(negado(await outro.rpc('iniciar_competicao', { p_competicao_id: liga.id })), 'outro admin não inicia a competição dos outros');
  ok(negado(await dono.rpc('iniciar_competicao', { p_competicao_id: liga.id })), 'dono do time não inicia a competição');
  ok(negado(await anon.rpc('iniciar_competicao', { p_competicao_id: liga.id })), 'anon não inicia a competição');

  const r = await admin.rpc('iniciar_competicao', { p_competicao_id: liga.id });
  ok(!r.error && r.data === 10, 'admin inicia: 10 jogos gerados', r.error ?? r.data);
  ok(Boolean((await admin.rpc('iniciar_competicao', { p_competicao_id: liga.id })).error), 'não inicia duas vezes');
  const comp = (await admin.from('competicoes').select('status').eq('id', liga.id).single()).data;
  const fases = (await admin.from('fases').select('ordem, status').eq('competicao_id', liga.id).order('ordem')).data;
  ok(comp?.status === 'em_andamento' && fases?.[0].status === 'em_andamento' && fases?.[1].status === 'aguardando', 'status em andamento; fase 1 em andamento; demais aguardando');

  const jogos = await jogosDa(admin, liga.id);
  const ids = liga.times.map((t) => t.id);
  const pares = new Set(jogos.map((j) => [j.time_casa_id, j.time_fora_id].sort().join('|')));
  ok(jogos.length === 10 && pares.size === 10, '10 jogos, todos os confrontos diferentes');
  ok(jogos.every((j) => j.status === 'pendente' && !j.evento_id && !j.inicio_previsto && j.rodada >= 1 && j.rodada <= 5), 'jogos pendentes, sem data, com rodada de 1 a 5');
  const folgas = ids.map((id) => 5 - new Set(jogos.filter((j) => [j.time_casa_id, j.time_fora_id].includes(id)).map((j) => j.rodada)).size);
  ok(folgas.every((f) => f === 1), 'cada time folga exatamente 1 vez no turno', folgas);
  const porRodada = [1, 2, 3, 4, 5].map((r) => jogos.filter((j) => j.rodada === r).length);
  ok(porRodada.every((n) => n === 2), '2 jogos por rodada', porRodada);
  const mandos = ids.map((id) => jogos.filter((j) => j.time_casa_id === id).length);
  ok(Math.max(...mandos) - Math.min(...mandos) <= 1, 'mando equilibrado (diferença máxima de 1 jogo em casa)', mandos);

  ok((await anon.from('competicoes').select('id').eq('id', liga.id)).data?.length === 1, 'competição iniciada fica pública');
  ok((await anon.from('jogos').select('id').eq('competicao_id', liga.id)).data?.length === 0, 'anon não vê jogos pendentes (sem dia publicado)');
  const fasesLiga = (await admin.from('fases').select('id').eq('competicao_id', liga.id)).data.map((f) => f.id);
  ok((await anon.from('series').select('id').in('fase_id', fasesLiga)).data?.length === 3, 'anon vê as séries (com origens) da competição iniciada');

  // Depois de iniciada: fases que já começaram só mudam nome/classificados.
  const mudaTipo = await admin.rpc('salvar_fases', {
    p_competicao_id: liga.id,
    p_fases: [fase('Fase 1', 'grupos', { qtd_grupos: 2, classificam: 2 }), ...FORMATO.slice(1)],
  });
  ok(/já começou/.test(mudaTipo.error?.message ?? ''), 'fase em andamento não muda de tipo');
  const renomeia = await admin.rpc('salvar_fases', {
    p_competicao_id: liga.id,
    p_fases: [{ ...FORMATO[0], nome: 'Classificação' }, { ...FORMATO[1], melhor_de: 5 }, FORMATO[2]],
  });
  const s = await series(admin, liga.id);
  ok(!renomeia.error && s[0].melhor_de === 5 && (await jogosDa(admin, liga.id)).length === 10, 'renomeia a fase 1 e muda a semifinal (aguardando) sem perder os jogos', renomeia.error);
  await admin.rpc('salvar_fases', { p_competicao_id: liga.id, p_fases: FORMATO });
}

console.log('\n— 5 times, 2 turnos');
{
  const ida = await novaCompeticao('turnos', 5);
  await admin.rpc('salvar_fases', { p_competicao_id: ida.id, p_fases: [fase('Turno e returno', 'todos_contra_todos', { turnos: 2 })] });
  const r = await admin.rpc('iniciar_competicao', { p_competicao_id: ida.id });
  const jogos = await jogosDa(admin, ida.id);
  ok(!r.error && jogos.length === 20, '20 jogos com turnos = 2', r.error);
  const folgas = ida.times.map((t) => {
    const rod = new Set(jogos.filter((j) => [j.time_casa_id, j.time_fora_id].includes(t.id)).map((j) => j.rodada));
    const turno1 = [1, 2, 3, 4, 5].filter((x) => !rod.has(x)).length;
    const turno2 = [6, 7, 8, 9, 10].filter((x) => !rod.has(x)).length;
    return [turno1, turno2];
  });
  ok(folgas.every(([a, b]) => a === 1 && b === 1), 'cada time folga 1 vez por turno (2 folgas no total)', folgas);
  const ordenados = new Set(jogos.map((j) => `${j.time_casa_id}>${j.time_fora_id}`));
  ok(jogos.every((j) => ordenados.has(`${j.time_fora_id}>${j.time_casa_id}`)), 'returno repete os confrontos com mando invertido');
}

console.log('\n— grupos: sorteio equilibrado, sortear de novo e distribuição manual');
{
  const gr = await novaCompeticao('grupos', 7);
  await admin.rpc('salvar_fases', {
    p_competicao_id: gr.id,
    p_fases: [fase('Grupos', 'grupos', { qtd_grupos: 2, classificam: 2 }), fase('Final', 'mata_mata', { cruzamento: 'cruzado_grupos' })],
  });
  const r = await admin.rpc('iniciar_competicao', { p_competicao_id: gr.id });
  const { data: fase1 } = await admin.from('fases').select('id, grupos(nome, grupo_times(time_id))').eq('competicao_id', gr.id).eq('ordem', 1).single();
  const tamanhos = (fase1?.grupos ?? []).map((g) => g.grupo_times.length).sort();
  ok(!r.error && r.data === 9 && tamanhos.join(',') === '3,4', 'sorteio equilibrado: grupos de 4 e 3 times, 9 jogos (6 + 3)', r.error ?? [r.data, tamanhos]);
  const jogos = await jogosDa(admin, gr.id);
  ok(jogos.every((j) => j.grupo_id), 'cada jogo de grupo tem grupo_id');

  ok(negado(await outro.rpc('sortear_grupos', { p_fase_id: fase1.id })), 'outro admin não sorteia os grupos');
  const re = await admin.rpc('sortear_grupos', { p_fase_id: fase1.id });
  ok(!re.error && re.data === 9 && (await jogosDa(admin, gr.id)).length === 9, 'admin sorteia de novo: jogos gerados outra vez', re.error);

  const man = await novaCompeticao('manual', 4);
  await admin.rpc('salvar_fases', { p_competicao_id: man.id, p_fases: [fase('Grupos', 'grupos', { qtd_grupos: 2, sorteio_grupos: 'manual' })] });
  ok(/Distribua/.test((await admin.rpc('iniciar_competicao', { p_competicao_id: man.id })).error?.message ?? ''), 'sorteio manual exige a distribuição para iniciar');
  const [a, b, c, d] = man.times.map((t) => t.id);
  ok(/faltam/.test((await admin.rpc('iniciar_competicao', { p_competicao_id: man.id, p_distribuicao: { A: [a, b], B: [c] } })).error?.message ?? ''), 'distribuição incompleta é recusada');
  const rm = await admin.rpc('iniciar_competicao', { p_competicao_id: man.id, p_distribuicao: { A: [a, d], B: [b, c] } });
  const { data: gm } = await admin.from('grupos').select('nome, grupo_times(time_id), fases!inner(competicao_id)').eq('fases.competicao_id', man.id).order('nome');
  ok(!rm.error && rm.data === 2 && gm?.[0].grupo_times.map((x) => x.time_id).sort().join() === [a, d].sort().join(), 'distribuição manual respeitada (A: times 1 e 4)', rm.error ?? gm);
}

// ------------------------------------------------------------- eventos
console.log('\n— dias de jogos (eventos): sorteio, aviso de jogo duplo e edição');
{
  const base = { p_competicao_id: liga.id, p_data: '2026-11-07', p_local: 'Quadra Central', p_hora_inicio: '19:00', p_intervalo_min: 90 };
  ok(negado(await outro.rpc('criar_evento', { ...base, p_qtd_jogos: 2 })), 'outro admin não cria evento na competição dos outros');
  ok(negado(await dono.rpc('criar_evento', { ...base, p_qtd_jogos: 2 })), 'dono do time não cria evento');
  ok(negado(await anon.rpc('criar_evento', { ...base, p_qtd_jogos: 2 })), 'anon não cria evento');
  const rascunho = await novaCompeticao('rascunho', 2);
  ok(/Inicie a competição/.test((await admin.rpc('criar_evento', { ...base, p_competicao_id: rascunho.id, p_qtd_jogos: 1 })).error?.message ?? ''), 'não cria evento em competição em rascunho');

  const e1 = await admin.rpc('criar_evento', { ...base, p_qtd_jogos: 2 });
  ok(!e1.error && e1.data?.evento_id && !e1.data.precisa_confirmar, 'evento com 2 jogos criado', e1.error ?? e1.data);
  const ev1 = e1.data.evento_id;
  const { data: evento } = await admin.from('eventos').select('*').eq('id', ev1).single();
  ok(evento?.status === 'rascunho' && evento.qtd_jogos === 2, 'evento nasce em rascunho');
  let doDia = (await admin.from('jogos').select('*').eq('evento_id', ev1).order('ordem_no_evento')).data ?? [];
  const timesDoDia = doDia.flatMap((j) => [j.time_casa_id, j.time_fora_id]);
  ok(doDia.length === 2 && new Set(timesDoDia).size === 4, 'evento com 2 jogos não repete time');
  ok(doDia.every((j) => j.status === 'agendado' && j.rodada === 1), 'jogos do evento ficam agendados e vêm da rodada mais antiga');
  ok(
    new Date(doDia[0].inicio_previsto).toISOString() === '2026-11-07T22:00:00.000Z' &&
      new Date(doDia[1].inicio_previsto).toISOString() === '2026-11-07T23:30:00.000Z',
    'horários: 19:00 e 20:30 em America/Fortaleza (data + hora + i × intervalo)',
    doDia.map((j) => j.inicio_previsto),
  );

  ok((await anon.from('eventos').select('id').eq('id', ev1)).data?.length === 0, 'anon não vê evento em rascunho');
  ok((await anon.from('jogos').select('id').eq('evento_id', ev1)).data?.length === 0, 'anon não vê jogos de evento em rascunho');
  ok((await dono.from('eventos').select('id').eq('id', ev1)).data?.length === 0, 'dono do time não vê evento em rascunho');
  ok((await outro.from('eventos').select('id').eq('id', ev1)).data?.length === 0, 'outro admin não vê evento em rascunho');

  // 3 jogos pedidos, só 2 possíveis sem repetir time (5 times).
  const antes = (await admin.from('eventos').select('id').eq('competicao_id', liga.id)).data.length;
  const e2 = await admin.rpc('criar_evento', { ...base, p_data: '2026-11-14', p_qtd_jogos: 3 });
  ok(
    !e2.error && e2.data?.precisa_confirmar === true && e2.data.max_sem_repeticao === 2 && e2.data.evento_id === null,
    'pedir 3 jogos com só 2 possíveis sem repetição pede confirmação (max_sem_repeticao = 2)',
    e2.error ?? e2.data,
  );
  ok((await admin.from('eventos').select('id').eq('competicao_id', liga.id)).data.length === antes, 'sem confirmação nada é gravado');
  const e3 = await admin.rpc('criar_evento', { ...base, p_data: '2026-11-14', p_qtd_jogos: 3, p_permitir_duplo: true });
  const ev3 = e3.data?.evento_id;
  const duplo = (await admin.from('jogos').select('*').eq('evento_id', ev3).order('ordem_no_evento')).data ?? [];
  const contagem = {};
  duplo.forEach((j) => [j.time_casa_id, j.time_fora_id].forEach((t) => (contagem[t] = (contagem[t] ?? 0) + 1)));
  const repetido = Object.keys(contagem).find((t) => contagem[t] > 1);
  const posicoes = duplo.map((j, i) => ([j.time_casa_id, j.time_fora_id].includes(repetido) ? i : null)).filter((i) => i !== null);
  ok(!e3.error && duplo.length === 3 && e3.data.jogo_duplo === true && repetido, 'com confirmação, cria o dia com o jogo duplo', e3.error ?? e3.data);
  ok(posicoes.length === 2 && posicoes[1] - posicoes[0] > 1, 'jogos do time com jogo duplo não são consecutivos', posicoes);

  // Edição do rascunho.
  ok(negado(await outro.rpc('reordenar_evento', { p_evento_id: ev3, p_jogos: duplo.map((j) => j.id).reverse() })), 'outro admin não reordena');
  const invertida = duplo.map((j) => j.id).reverse();
  const ro = await admin.rpc('reordenar_evento', { p_evento_id: ev3, p_jogos: invertida });
  const reord = (await admin.from('jogos').select('id, ordem_no_evento, inicio_previsto').eq('evento_id', ev3).order('ordem_no_evento')).data ?? [];
  ok(!ro.error && reord.map((j) => j.id).join() === invertida.join() && new Date(reord[0].inicio_previsto).getUTCHours() === 22, 'reordenar muda a ordem e recalcula os horários', ro.error);
  ok(Boolean((await admin.rpc('reordenar_evento', { p_evento_id: ev3, p_jogos: invertida.slice(1) })).error), 'reordenar exige exatamente os jogos do dia');

  const cand = await admin.rpc('jogos_candidatos_evento', { p_competicao_id: liga.id });
  ok(!cand.error && cand.data.length === 5 && cand.data.every((j) => j.status === 'pendente'), 'candidatos: os 5 jogos pendentes restantes', cand.error ?? cand.data?.length);
  ok(negado(await outro.rpc('jogos_candidatos_evento', { p_competicao_id: liga.id })), 'outro admin não lista candidatos');
  const sai = reord[0].id;
  const entra = cand.data[0].id;
  const tr = await admin.rpc('trocar_jogo_evento', { p_jogo_sai: sai, p_jogo_entra: entra });
  const trocado = (await admin.from('jogos').select('id, status, evento_id, ordem_no_evento').in('id', [sai, entra])).data ?? [];
  const jSai = trocado.find((j) => j.id === sai);
  const jEntra = trocado.find((j) => j.id === entra);
  ok(!tr.error && jSai?.status === 'pendente' && !jSai.evento_id && jEntra?.evento_id === ev3 && jEntra.ordem_no_evento === 1, 'trocar: novo jogo assume a posição; o antigo volta a pendente', tr.error);
  ok(Boolean((await admin.rpc('trocar_jogo_evento', { p_jogo_sai: entra, p_jogo_entra: doDia[0].id })).error), 'não troca por jogo que já está em outro dia');

  const rem = await admin.rpc('remover_jogo_evento', { p_jogo_id: entra });
  const restantes = (await admin.from('jogos').select('ordem_no_evento').eq('evento_id', ev3).order('ordem_no_evento')).data ?? [];
  const removido = (await admin.from('jogos').select('status, evento_id').eq('id', entra).single()).data;
  ok(!rem.error && removido?.status === 'pendente' && !removido.evento_id && restantes.map((j) => j.ordem_no_evento).join() === '1,2', 'remover: jogo volta a pendente e os demais são renumerados', rem.error);

  const so = await admin.rpc('sortear_evento', { p_evento_id: ev3 });
  ok(!so.error && so.data?.precisa_confirmar === true && so.data.max_sem_repeticao === 2, 'sortear de novo também avisa quando precisa de jogo duplo', so.error ?? so.data);
  const so2 = await admin.rpc('sortear_evento', { p_evento_id: ev3, p_permitir_duplo: true });
  ok(!so2.error && (await admin.from('jogos').select('id').eq('evento_id', ev3)).data.length === 3, 'sortear de novo (com jogo duplo) remonta os 3 jogos', so2.error);

  // Publicar.
  ok(negado(await outro.rpc('publicar_evento', { p_evento_id: ev1 })), 'outro admin não publica');
  ok(!(await admin.rpc('publicar_evento', { p_evento_id: ev1 })).error, 'admin publica o evento');
  ok((await anon.from('eventos').select('id, status').eq('id', ev1)).data?.[0]?.status === 'publicado', 'anon vê o evento publicado');
  ok((await anon.from('jogos').select('id').eq('evento_id', ev1)).data?.length === 2, 'anon vê os jogos agendados do evento publicado');
  ok((await anon.from('jogos').select('id').eq('evento_id', ev3)).data?.length === 0, 'anon continua sem ver os jogos do evento em rascunho');
  ok((await dono.from('eventos').select('id').eq('id', ev1)).data?.length === 1, 'dono do time vê o evento publicado');
  ok(Boolean((await admin.rpc('remover_jogo_evento', { p_jogo_id: doDia[0].id })).error), 'evento publicado não é mais montado (remover recusado)');

  // Menos candidatos que o pedido: cria com o que existir.
  const e4 = await admin.rpc('criar_evento', { ...base, p_data: '2026-11-21', p_qtd_jogos: 20, p_permitir_duplo: true });
  const n4 = (await admin.from('jogos').select('id').eq('evento_id', e4.data?.evento_id)).data?.length;
  ok(!e4.error && e4.data.candidatos < 20 && n4 === e4.data.candidatos, 'com menos candidatos que o pedido, cria com o que existir', e4.error ?? e4.data);
  ok(/Não há jogos disponíveis/.test((await admin.rpc('criar_evento', { ...base, p_qtd_jogos: 1 })).error?.message ?? ''), 'sem candidatos, não cria dia vazio');

  // Excluir devolve os jogos para pendente.
  ok(negado(await outro.rpc('excluir_evento', { p_evento_id: e4.data.evento_id })), 'outro admin não exclui');
  const ex = await admin.rpc('excluir_evento', { p_evento_id: e4.data.evento_id });
  ok(!ex.error && ex.data === n4, 'excluir evento devolve os jogos', ex.error);
  const voltaram = (await admin.from('jogos').select('status, evento_id, inicio_previsto').eq('competicao_id', liga.id).eq('status', 'pendente')).data ?? [];
  ok(voltaram.length === n4 && voltaram.every((j) => !j.evento_id && !j.inicio_previsto), 'jogos do evento excluído voltam a pendente, sem dia nem horário');
  ok(!(await admin.rpc('excluir_evento', { p_evento_id: ev1 })).error && (await anon.from('jogos').select('id').eq('competicao_id', liga.id)).data?.length === 0, 'excluir evento publicado tira os jogos da área pública');

  const em = await master.rpc('criar_evento', { ...base, p_qtd_jogos: 1 });
  ok(!em.error && em.data?.evento_id, 'master cria evento em qualquer competição', em.error);
}

// ------------------------------------------------------------- trava de estrutura
console.log('\n— trava de estrutura');
{
  let secret = null;
  try {
    const status = JSON.parse(execSync('npx supabase status -o json', { cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: ['ignore', 'pipe', 'ignore'] }).toString());
    secret = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY ?? null;
  } catch {
    secret = null;
  }
  if (!secret) {
    console.log('⚠️  chave local de serviço indisponível: teste da trava pulado.');
  } else {
    const service = createClient(URL_, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    await service.from('competicoes').update({ estrutura_travada: true }).eq('id', liga.id);
    const r = await admin.rpc('salvar_fases', { p_competicao_id: liga.id, p_fases: FORMATO });
    ok(/travada/.test(r.error?.message ?? ''), 'com a estrutura travada, admin não altera as fases');
    ok(!(await master.rpc('salvar_fases', { p_competicao_id: liga.id, p_fases: FORMATO })).error, 'master altera as fases mesmo travada');
  }
}

// ------------------------------------------------------------- limpeza
console.log('\n— limpeza');
{
  const del = await master.from('competicoes').delete().in('id', criadas);
  ok(!del.error && (await master.from('competicoes').select('id').in('id', criadas)).data.length === 0, 'master exclui as competições de teste (cascade)', del.error);
}

console.log(falhas ? `\n${falhas} falha(s).` : '\nTodos os critérios passaram.');
process.exit(falhas ? 1 : 0);
