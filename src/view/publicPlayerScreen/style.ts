import styled from 'styled-components';

export { Section, SectionTitle, Stack } from '@/view/publicCompetitionScreen/style';

export const Numbers = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${({ theme }) => theme.spacing.xxl * 2 + theme.spacing.md}px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0;
`;

export const NumberTile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs}px;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  text-align: center;
`;

export const NumberLabel = styled.dt`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const NumberValue = styled.dd`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize.xl}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  font-variant-numeric: tabular-nums;
`;

export const NumberAverage = styled.dd`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
