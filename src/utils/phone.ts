// Telefone de contato: guardado só com dígitos (DDD + número, às vezes com o 55 na frente).

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// Vazio é válido (o telefone é opcional); preenchido precisa de DDD + número.
export function phoneError(value: string): string | undefined {
  const digitos = phoneDigits(value);
  if (!digitos) return undefined;
  if (digitos.length < 10 || digitos.length > 13) return 'Informe DDD e número (ex.: 88 99999-1234).';
  return undefined;
}

// "88999991234" → "(88) 99999-1234"; com 55 na frente, mostra "+55 (88) 99999-1234".
export function formatPhone(value: string | null | undefined): string {
  const digitos = phoneDigits(value ?? '');
  const comPais = digitos.length > 11 && digitos.startsWith('55');
  const local = comPais ? digitos.slice(2) : digitos;
  if (local.length < 10 || local.length > 11) return digitos;
  const formatado = `(${local.slice(0, 2)}) ${local.slice(2, -4)}-${local.slice(-4)}`;
  return comPais ? `+55 ${formatado}` : formatado;
}

// Máscara enquanto digita: só números, "(88) 99999-1234"; com mais de 11 dígitos começando por 55, "+55 (88) …".
export function maskPhone(value: string): string {
  const digitos = phoneDigits(value).slice(0, 13);
  const comPais = digitos.length > 11 && digitos.startsWith('55');
  const local = comPais ? digitos.slice(2) : digitos.slice(0, 11);
  let formatado = local;
  if (local.length > 2) {
    const corpo = local.slice(2);
    const meio = local.length === 11 ? 5 : 4;
    formatado = `(${local.slice(0, 2)}) ${corpo.slice(0, meio)}${corpo.length > meio ? `-${corpo.slice(meio)}` : ''}`;
  } else if (local) {
    formatado = `(${local}`;
  }
  return comPais ? `+55 ${formatado}` : formatado;
}
