import styled from 'styled-components';

export { Stack } from '@/view/publicGameScreen/style';

export const Controls = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
`;
