import styled from 'styled-components';
import { Input } from '@/components/inputGlobal/style';

export { ErrorText, Field, Label } from '@/components/inputGlobal/style';

// Seta própria (cinza do tema) para o select ter o mesmo visual dos outros campos em todo navegador.
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%235B6270' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

export const Select = styled(Input).attrs({ as: 'select' })`
  padding-right: ${({ theme }) => theme.spacing.xl + theme.spacing.xs}px;
  appearance: none;
  background-image: ${CHEVRON};
  background-repeat: no-repeat;
  background-position: right ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px center;
  text-overflow: ellipsis;
  cursor: pointer;
`;
