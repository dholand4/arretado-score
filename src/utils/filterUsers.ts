import type { IUsuarioListado, Papel } from '@/@types/user';
import { phoneDigits } from './phone';

export interface IUserFilters {
  search: string;
  papel: Papel | '';
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function filterUsers(users: IUsuarioListado[], { search, papel }: IUserFilters): IUsuarioListado[] {
  const termo = normalize(search.trim());
  return users.filter((user) => {
    if (papel && user.papel !== papel) return false;
    if (!termo) return true;
    const digitos = phoneDigits(search);
    return (
      normalize(user.nome).includes(termo) ||
      normalize(user.email).includes(termo) ||
      (digitos.length >= 3 && Boolean(user.telefone?.includes(digitos)))
    );
  });
}
