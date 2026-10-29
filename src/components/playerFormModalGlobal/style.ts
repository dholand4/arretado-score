import styled from 'styled-components';

export { Form } from '@/components/userFormModalGlobal/style';

export const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
`;
