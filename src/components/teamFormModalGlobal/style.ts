import styled from 'styled-components';

export { Form } from '@/components/userFormModalGlobal/style';

export const OwnerBox = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
`;

export const OwnerTitle = styled.legend`
  padding: 0 ${({ theme }) => theme.spacing.xs}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;
