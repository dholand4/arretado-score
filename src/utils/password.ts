const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

// Senha provisória legível (sem 0/O, 1/l/I) para o master repassar ao usuário.
export function generateTemporaryPassword(length = 10): string {
  const valores = new Uint32Array(length);
  crypto.getRandomValues(valores);
  return Array.from(valores, (v) => ALFABETO[v % ALFABETO.length]).join('');
}
