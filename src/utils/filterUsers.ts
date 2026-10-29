import type { IUsuarioListado, Papel } from '@/@types/user';

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
    return normalize(user.nome).includes(termo) || normalize(user.email).includes(termo);
  });
}
