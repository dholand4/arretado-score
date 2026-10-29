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

export const Presets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Help = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const AddRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;
