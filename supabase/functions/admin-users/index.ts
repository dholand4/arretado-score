// Edge Function admin-users — gestão de usuários pelo admin master (seção 7 da spec).
// O admin de liga também pode criar usuários, mas só com o papel dono_time (para o time dele).
// Usa a chave service_role, que só existe aqui dentro.
//
// POST { action: 'create', nome, email, senha, papel }
// POST { action: 'update', id, nome?, papel?, ativo? }
// POST { action: 'reset_password', id, senha }

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Papel = 'master' | 'admin' | 'dono_time';

const PAPEIS: readonly Papel[] = ['master', 'admin', 'dono_time'];
const SENHA_MIN = 8;
// Banimento "permanente" usado para bloquear o login de quem foi desativado.
const BAN_DESATIVADO = '876000h';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function texto(body: Record<string, unknown>, campo: string, obrigatorio: true): string;
function texto(body: Record<string, unknown>, campo: string, obrigatorio: false): string | undefined;
function texto(body: Record<string, unknown>, campo: string, obrigatorio: boolean) {
  const valor = body[campo];
  if (valor === undefined || valor === null) {
    if (obrigatorio) throw new HttpError(400, `Campo obrigatório: ${campo}.`);
    return undefined;
  }
  if (typeof valor !== 'string') throw new HttpError(400, `Campo inválido: ${campo}.`);
  const limpo = valor.trim();
  if (obrigatorio && !limpo) throw new HttpError(400, `Campo obrigatório: ${campo}.`);
  return limpo;
}

function validarPapel(valor: string): Papel {
  if (!PAPEIS.includes(valor as Papel)) throw new HttpError(400, 'Papel inválido.');
  return valor as Papel;
}

function validarSenha(senha: string) {
  if (senha.length < SENHA_MIN) {
    throw new HttpError(400, `A senha provisória precisa ter ao menos ${SENHA_MIN} caracteres.`);
  }
}

function validarEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'E-mail inválido.');
}

function getServiceRoleKey(): string {
  const direta = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (direta) return direta;
  // Formato novo de chaves: JSON { "default": "sb_secret_..." }.
  const secretas = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretas) {
    const parsed: unknown = JSON.parse(secretas);
    if (isRecord(parsed) && typeof parsed.default === 'string') return parsed.default;
  }
  throw new Error('Chave service_role não configurada.');
}

interface IChamador {
  id: string;
  papel: 'master' | 'admin';
}

// Master gerencia todos os usuários; o admin de liga só cadastra donos de time.
async function exigirGestor(admin: SupabaseClient, req: Request): Promise<IChamador> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Sessão não informada.');

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) throw new HttpError(401, 'Sessão inválida ou expirada.');

  const { data: perfil, error } = await admin
    .from('profiles')
    .select('papel, ativo')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!perfil || !perfil.ativo || (perfil.papel !== 'master' && perfil.papel !== 'admin')) {
    throw new HttpError(403, 'Apenas o Admin pode gerenciar usuários.');
  }
  return { id: userData.user.id, papel: perfil.papel };
}

function exigirMaster(chamador: IChamador) {
  if (chamador.papel !== 'master') throw new HttpError(403, 'Apenas o Admin pode gerenciar usuários.');
}

async function criarUsuario(admin: SupabaseClient, body: Record<string, unknown>, chamador: IChamador) {
  const nome = texto(body, 'nome', true);
  const email = texto(body, 'email', true).toLowerCase();
  const senha = texto(body, 'senha', true);
  const papel = validarPapel(texto(body, 'papel', true));
  if (chamador.papel !== 'master' && papel !== 'dono_time') {
    throw new HttpError(403, 'O coordenador só pode cadastrar acessos de equipe.');
  }
  validarEmail(email);
  validarSenha(senha);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error) {
    if (error.code === 'email_exists' || /already been registered/i.test(error.message)) {
      throw new HttpError(409, 'Já existe um usuário com este e-mail.');
    }
    if (error.code === 'weak_password') throw new HttpError(400, 'Senha provisória fraca demais.');
    throw error;
  }

  // O trigger on_auth_user_created criou o profile; aqui definimos nome e papel reais.
  const { data: perfil, error: perfilError } = await admin
    .from('profiles')
    // criado_por separa as equipes por coordenador (cada um só vê as que cadastrou).
    .update({ nome, papel, ativo: true, precisa_trocar_senha: true, criado_por: chamador.id })
    .eq('id', data.user.id)
    .select()
    .single();
  if (perfilError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw perfilError;
  }
  return { ...perfil, email };
}

async function atualizarUsuario(admin: SupabaseClient, body: Record<string, unknown>, masterId: string) {
  const id = texto(body, 'id', true);
  const nome = texto(body, 'nome', false);
  const papelTexto = texto(body, 'papel', false);
  const papel = papelTexto === undefined ? undefined : validarPapel(papelTexto);
  const ativo = body.ativo;
  if (ativo !== undefined && typeof ativo !== 'boolean') throw new HttpError(400, 'Campo inválido: ativo.');
  if (nome !== undefined && !nome) throw new HttpError(400, 'O nome não pode ficar vazio.');

  if (id === masterId && (ativo === false || (papel !== undefined && papel !== 'master'))) {
    throw new HttpError(400, 'Você não pode desativar nem rebaixar o seu próprio usuário.');
  }

  const mudancas: Record<string, unknown> = {};
  if (nome !== undefined) mudancas.nome = nome;
  if (papel !== undefined) mudancas.papel = papel;
  if (ativo !== undefined) mudancas.ativo = ativo;
  if (Object.keys(mudancas).length === 0) throw new HttpError(400, 'Nada para atualizar.');

  const { data: perfil, error } = await admin
    .from('profiles')
    .update(mudancas)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!perfil) throw new HttpError(404, 'Usuário não encontrado.');

  if (ativo !== undefined) {
    // Bloqueia (ou libera) o login no próprio Auth, além das checagens no front e nas policies.
    const { error: banError } = await admin.auth.admin.updateUserById(id, {
      ban_duration: ativo ? 'none' : BAN_DESATIVADO,
    });
    if (banError) throw banError;
  }
  return perfil;
}

async function redefinirSenha(admin: SupabaseClient, body: Record<string, unknown>) {
  const id = texto(body, 'id', true);
  const senha = texto(body, 'senha', true);
  validarSenha(senha);

  const { error } = await admin.auth.admin.updateUserById(id, { password: senha });
  if (error) {
    if (error.status === 404) throw new HttpError(404, 'Usuário não encontrado.');
    if (error.code === 'weak_password') throw new HttpError(400, 'Senha provisória fraca demais.');
    throw error;
  }

  // O trigger de troca de senha zera a flag; a senha nova é provisória, então volta para true.
  const { data: perfil, error: perfilError } = await admin
    .from('profiles')
    .update({ precisa_trocar_senha: true })
    .eq('id', id)
    .select()
    .single();
  if (perfilError) throw perfilError;
  return perfil;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Método não permitido.' });

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', getServiceRoleKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const chamador = await exigirGestor(admin, req);

    const body: unknown = await req.json().catch(() => null);
    if (!isRecord(body)) throw new HttpError(400, 'Corpo da requisição inválido.');

    switch (body.action) {
      case 'create':
        return json(201, { data: await criarUsuario(admin, body, chamador) });
      case 'update':
        exigirMaster(chamador);
        return json(200, { data: await atualizarUsuario(admin, body, chamador.id) });
      case 'reset_password':
        exigirMaster(chamador);
        return json(200, { data: await redefinirSenha(admin, body) });
      default:
        throw new HttpError(400, 'Ação inválida.');
    }
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    console.error('admin-users:', err);
    return json(500, { error: 'Erro interno ao processar a solicitação.' });
  }
});
