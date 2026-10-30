import styled from 'styled-components';

export { List } from '@/view/publicCompetitionScreen/style';

export const Filters = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

export const Day = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

export const DayTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.md}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
