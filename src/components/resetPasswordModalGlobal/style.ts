import styled from 'styled-components';

export { Form } from '@/components/userFormModalGlobal/style';

export const Description = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
