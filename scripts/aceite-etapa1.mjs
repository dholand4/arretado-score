// Testes de aceite da Etapa 1 contra o Supabase LOCAL (perfis master, admin, dono_time e anon).
// Uso: npm run aceite:etapa1   (requer `supabase start` e `supabase functions serve`)
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

const MASTER = { email: 'master@torneiomais.local', password: 'Master@123' };
const stamp = Date.now();
const ADMIN = { nome: 'Admin Aceite', email: `admin.${stamp}@teste.local`, senha: 'Provisoria1', papel: 'admin' };
const DONO = { nome: 'Dono Aceite', email: `dono.${stamp}@teste.local`, senha: 'Provisoria2', papel: 'dono_time' };

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✅' : '❌'} ${msg}`);
  if (!cond) falhas += 1;
};
const client = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function login({ email, password }) {
  const c = client();
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  return { c, data, error };
}

async function invoke(c, body) {
  const { data, error } = await c.functions.invoke('admin-users', { body });
  if (!error) return { status: 200, data };
  const status = error.context?.status ?? 0;
  const payload = await error.context?.json?.().catch(() => null);
  return { status, error: payload?.error ?? error.message };
}

async function meuPerfil(c, id) {
  const { data } = await c.from('profiles').select('*').eq('id', id).maybeSingle();
  return data;
}

// ---------------------------------------------------------------- anon
console.log('\n— anon');
const anon = client();
{
  const { data, error } = await anon.from('profiles').select('*');
  ok(error || data.length === 0, 'anon não lê profiles');
  const rpc = await anon.rpc('listar_usuarios');
  ok(rpc.error, 'anon não chama listar_usuarios');
  const fn = await invoke(anon, { action: 'create', ...ADMIN });
  ok(fn.status === 401, `anon não usa admin-users (status ${fn.status})`);
  const signup = await anon.auth.signUp({ email: `livre.${stamp}@teste.local`, password: 'Qualquer123' });
  ok(signup.error, 'cadastro público desligado');
}

// ---------------------------------------------------------------- master
console.log('\n— master');
const m = await login(MASTER);
ok(!m.error, 'master entra');
const masterId = m.data.user.id;
{
  const lista = await m.c.rpc('listar_usuarios');
  ok(!lista.error && lista.data.some((u) => u.email === MASTER.email), 'master lista usuários com e-mail');

  const ca = await invoke(m.c, { action: 'create', ...ADMIN });
  ok(ca.status === 200 && ca.data.data.papel === 'admin', 'master cria admin');
  ADMIN.id = ca.data?.data?.id;
  const cd = await invoke(m.c, { action: 'create', ...DONO });
  ok(cd.status === 200 && cd.data.data.papel === 'dono_time', 'master cria dono do time');
  DONO.id = cd.data?.data?.id;

  const dup = await invoke(m.c, { action: 'create', ...ADMIN });
  ok(dup.status === 409, `e-mail duplicado é recusado (${dup.error})`);
  const curta = await invoke(m.c, { action: 'create', ...ADMIN, email: `x.${stamp}@teste.local`, senha: '123' });
  ok(curta.status === 400, 'senha provisória curta é recusada');
  const self = await invoke(m.c, { action: 'update', id: masterId, ativo: false });
  ok(self.status === 400, 'master não desativa a si mesmo');
  const novos = await m.c.rpc('listar_usuarios');
  const a = novos.data.find((u) => u.id === ADMIN.id);
  ok(a?.precisa_trocar_senha === true, 'admin nasce com precisa_trocar_senha = true');
}

// ---------------------------------------------------------------- admin
console.log('\n— admin');
{
  const a = await login({ email: ADMIN.email, password: ADMIN.senha });
  ok(!a.error, 'admin entra com a senha provisória');
  const perfil = await meuPerfil(a.c, ADMIN.id);
  ok(perfil?.precisa_trocar_senha === true, 'admin é forçado a trocar a senha');

  const visiveis = await a.c.from('profiles').select('id, papel');
  const papeis = new Set(visiveis.data.map((p) => p.papel));
  ok(!visiveis.data.some((p) => p.id === masterId), 'admin não vê o profile do master');
  ok(visiveis.data.some((p) => p.id === DONO.id), 'admin vê donos de time (para vincular)');
  ok([...papeis].every((p) => p === 'dono_time' || p === 'admin'), 'admin só vê o próprio perfil e donos');

  const burla = await a.c.from('profiles').update({ precisa_trocar_senha: false, papel: 'master' }).eq('id', ADMIN.id);
  const depois = await meuPerfil(a.c, ADMIN.id);
  ok(burla.error && depois.papel === 'admin' && depois.precisa_trocar_senha, 'admin não altera profile direto (nem papel nem flag)');
  ok((await a.c.rpc('listar_usuarios')).error, 'admin não lista usuários');
  ok((await invoke(a.c, { action: 'create', ...DONO, email: `y.${stamp}@teste.local` })).status === 403, 'admin não usa admin-users');

  const troca = await a.c.auth.updateUser({ password: 'SenhaNovaAdmin1' });
  ok(!troca.error, 'admin troca a senha');
  ok((await meuPerfil(a.c, ADMIN.id)).precisa_trocar_senha === false, 'troca de senha libera o acesso');
}

// ---------------------------------------------------------------- dono_time
console.log('\n— dono_time');
{
  const d = await login({ email: DONO.email, password: DONO.senha });
  ok(!d.error, 'dono entra com a senha provisória');
  ok((await meuPerfil(d.c, DONO.id))?.precisa_trocar_senha === true, 'dono é forçado a trocar a senha');
  const visiveis = await d.c.from('profiles').select('id');
  ok(visiveis.data.length === 1 && visiveis.data[0].id === DONO.id, 'dono só vê o próprio profile');
  ok((await invoke(d.c, { action: 'update', id: DONO.id, papel: 'master' })).status === 403, 'dono não usa admin-users');
  await d.c.auth.updateUser({ password: 'SenhaNovaDono1' });
  ok((await meuPerfil(d.c, DONO.id)).precisa_trocar_senha === false, 'dono troca a senha');

  // desativação
  const des = await invoke(m.c, { action: 'update', id: DONO.id, ativo: false });
  ok(des.status === 200 && des.data.data.ativo === false, 'master desativa o dono');
  const bloqueado = await login({ email: DONO.email, password: 'SenhaNovaDono1' });
  ok(bloqueado.error?.code === 'user_banned', `dono desativado não entra (${bloqueado.error?.code})`);
  const sessaoAntiga = await meuPerfil(d.c, DONO.id);
  ok(sessaoAntiga === null || sessaoAntiga.ativo === false, 'sessão antiga vê ativo = false (front desloga)');

  const re = await invoke(m.c, { action: 'update', id: DONO.id, ativo: true });
  ok(re.status === 200, 'master reativa o dono');
  ok(!(await login({ email: DONO.email, password: 'SenhaNovaDono1' })).error, 'dono reativado volta a entrar');
}

// ---------------------------------------------------------------- reset de senha
console.log('\n— reset_password');
{
  const r = await invoke(m.c, { action: 'reset_password', id: ADMIN.id, senha: 'Resetada123' });
  ok(r.status === 200 && r.data.data.precisa_trocar_senha === true, 'reset marca precisa_trocar_senha = true');
  ok((await login({ email: ADMIN.email, password: 'SenhaNovaAdmin1' })).error, 'senha antiga deixa de valer');
  const a = await login({ email: ADMIN.email, password: 'Resetada123' });
  ok(!a.error && (await meuPerfil(a.c, ADMIN.id)).precisa_trocar_senha, 'admin entra com a nova provisória e precisa trocar');

  const ed = await invoke(m.c, { action: 'update', id: ADMIN.id, nome: 'Admin Renomeado', papel: 'dono_time' });
  ok(ed.status === 200 && ed.data.data.nome === 'Admin Renomeado' && ed.data.data.papel === 'dono_time', 'master edita nome e papel');
}

console.log(falhas ? `\n${falhas} falha(s).` : '\nTodos os critérios passaram.');
process.exit(falhas ? 1 : 0);
