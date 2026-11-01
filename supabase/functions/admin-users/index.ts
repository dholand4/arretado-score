// Edge Function admin-users — gestão de usuários pelo admin master (seção 7 da spec).
// O admin de liga também pode criar usuários, mas só com o papel dono_time (para o time dele).
// Usa a chave service_role, que só existe aqui dentro.
//
// POST { action: 'create', nome, email, senha, papel, telefone? }
// POST { action: 'update', id, nome?, papel?, ativo?, telefone? }
// O coordenador só usa 'update' para trocar o telefone das equipes que ele enxerga.
// POST { action: 'reset_password', id, senha }
// O coordenador também redefine a senha das equipes que ele enxerga.

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

// Telefone: só dígitos com DDD (10 a 13, aceitando o 55). Vazio limpa; ausente não muda.
function telefoneOpcional(body: Record<string, unknown>): string | null | undefined {
  const valor = body.telefone;
  if (valor === undefined) return undefined;
  if (valor === null) return null;
  if (typeof valor !== 'string') throw new HttpError(400, 'Campo inválido: telefone.');
  const digitos = valor.replace(/\D/g, '');
  if (!digitos) return null;
  if (digitos.length < 10 || digitos.length > 13) throw new HttpError(400, 'Telefone inválido: informe DDD e número.');
  return digitos;
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

// Master gerencia todos os usuários; o admin de liga só cadastra donos de time, troca o
// telefone e redefine a senha das equipes que enxerga.
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
  const telefone = telefoneOpcional(body) ?? null;

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
    .update({ nome, papel, telefone, ativo: true, precisa_trocar_senha: true, criado_por: chamador.id })
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
  const telefone = telefoneOpcional(body);
  if (nome !== undefined && !nome) throw new HttpError(400, 'O nome não pode ficar vazio.');

  if (id === masterId && (ativo === false || (papel !== undefined && papel !== 'master'))) {
    throw new HttpError(400, 'Você não pode desativar nem rebaixar o seu próprio usuário.');
  }

  const mudancas: Record<string, unknown> = {};
  if (nome !== undefined) mudancas.nome = nome;
  if (papel !== undefined) mudancas.papel = papel;
  if (ativo !== undefined) mudancas.ativo = ativo;
  if (telefone !== undefined) mudancas.telefone = telefone;
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

// Equipe (login dono_time) que o coordenador enxerga: cadastrada por ele ou dona de um time
// de uma liga dele (mesma regra de equipe_visivel_ao_coordenador no banco).
async function exigirEquipeVisivel(admin: SupabaseClient, id: string, coordenadorId: string) {
  const { data: perfil, error } = await admin.from('profiles').select('id, papel, criado_por').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!perfil || perfil.papel !== 'dono_time') throw new HttpError(404, 'Equipe não encontrada.');
  if (perfil.criado_por !== coordenadorId) {
    const { data: ligas, error: ligasError } = await admin
      .from('competicao_admins')
      .select('competicao_id')
      .eq('user_id', coordenadorId);
    if (ligasError) throw ligasError;
    const ids = (ligas ?? []).map((l) => l.competicao_id);
    const { count, error: timesError } = await admin
      .from('times')
      .select('id', { count: 'exact', head: true })
      .eq('dono_id', id)
      .in('competicao_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    if (timesError) throw timesError;
    if (!count) throw new HttpError(403, 'Esta equipe não é de uma liga sua.');
  }
}

// Coordenador: só o telefone de uma equipe que ele cadastrou ou que é de um time das ligas dele.
async function atualizarTelefoneEquipe(admin: SupabaseClient, body: Record<string, unknown>, coordenadorId: string) {
  const id = texto(body, 'id', true);
  if (Object.keys(body).some((campo) => !['action', 'id', 'telefone'].includes(campo))) {
    throw new HttpError(403, 'O coordenador só pode alterar o telefone das equipes.');
  }
  const telefone = telefoneOpcional(body);
  if (telefone === undefined) throw new HttpError(400, 'Nada para atualizar.');

  await exigirEquipeVisivel(admin, id, coordenadorId);

  const { data, error: updateError } = await admin.from('profiles').update({ telefone }).eq('id', id).select().single();
  if (updateError) throw updateError;
  return data;
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
        if (chamador.papel === 'admin') {
          return json(200, { data: await atualizarTelefoneEquipe(admin, body, chamador.id) });
        }
        return json(200, { data: await atualizarUsuario(admin, body, chamador.id) });
      case 'reset_password':
        if (chamador.papel === 'admin') await exigirEquipeVisivel(admin, texto(body, 'id', true), chamador.id);
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
