import styled from 'styled-components';

export { Form, Grid } from '@/components/basicInfoFormGlobal/style';

export const Section = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
  margin: 0;
  padding: 0;
  border: none;
`;

export const Legend = styled.legend`
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
  padding: 0;
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const Help = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Criteria = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.lg}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;
