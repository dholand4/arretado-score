import type { IUsuarioListado } from '@/@types/user';
import { AppError, getErrorMessage } from '@/utils/appError';
import { filterUsers } from '@/utils/filterUsers';
import { generateTemporaryPassword } from '@/utils/password';
import { isValidEmail, validateNewPassword, validateUserForm } from '@/utils/validators';

describe('validators', () => {
  it('validates e-mail', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
  });

  it('validates new password', () => {
    expect(validateNewPassword('123', '123')).toMatch(/8 caracteres/);
    expect(validateNewPassword('12345678', '12345679')).toBe('As senhas não conferem.');
    expect(validateNewPassword('12345678', '12345678')).toBeNull();
  });

  it('only requires e-mail and password on create', () => {
    const values = { nome: 'Ana', email: '', senha: '', papel: 'admin' };
    expect(Object.keys(validateUserForm(values, 'create'))).toEqual(['email', 'senha']);
    expect(validateUserForm(values, 'edit')).toEqual({});
  });
});

describe('generateTemporaryPassword', () => {
  it('generates readable passwords of the given length', () => {
    const senha = generateTemporaryPassword(12);
    expect(senha).toHaveLength(12);
    expect(senha).not.toMatch(/[0O1lI]/);
  });
});

describe('getErrorMessage', () => {
  it('translates known auth codes and keeps AppError messages', () => {
    expect(getErrorMessage({ code: 'invalid_credentials' })).toBe('E-mail ou senha incorretos.');
    expect(getErrorMessage({ code: 'user_banned' })).toMatch(/desativado/);
    expect(getErrorMessage(new AppError('Minha mensagem'))).toBe('Minha mensagem');
    expect(getErrorMessage(new Error('x'), 'padrão')).toBe('padrão');
  });
});

describe('filterUsers', () => {
  const base = { ativo: true, precisa_trocar_senha: false, telefone: null, created_at: '', ultimo_acesso: null };
  const users: IUsuarioListado[] = [
    { ...base, id: '1', nome: 'João Árbitro', email: 'joao@x.com', papel: 'admin' },
    { ...base, id: '2', nome: 'Maria', email: 'maria@x.com', papel: 'dono_time', telefone: '88999991234' },
  ];

  it('ignores accents and filters by role', () => {
    expect(filterUsers(users, { search: 'arbitro', papel: '' })).toHaveLength(1);
    expect(filterUsers(users, { search: '', papel: 'dono_time' })[0].nome).toBe('Maria');
    expect(filterUsers(users, { search: 'maria', papel: 'admin' })).toHaveLength(0);
  });

  it('finds by phone typed with or without mask', () => {
    expect(filterUsers(users, { search: '(88) 99999', papel: '' })[0].nome).toBe('Maria');
    expect(filterUsers(users, { search: '1234', papel: '' })).toHaveLength(1);
  });
});

describe('phone', () => {
  it('formats and validates', async () => {
    const { formatPhone, phoneError } = await import('@/utils/phone');
    expect(formatPhone('88999991234')).toBe('(88) 99999-1234');
    expect(formatPhone('8833334444')).toBe('(88) 3333-4444');
    expect(formatPhone('5588999991234')).toBe('+55 (88) 99999-1234');
    expect(formatPhone(null)).toBe('');
    expect(phoneError('')).toBeUndefined();
    expect(phoneError('(88) 99999-1234')).toBeUndefined();
    expect(phoneError('9999')).toBe('Informe DDD e número (ex.: 88 99999-1234).');
  });
});
