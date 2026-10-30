import styled from 'styled-components';

export { List, Section, SectionTitle, Stack } from '@/view/publicCompetitionScreen/style';

export const Roster = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Player = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  text-align: center;
`;

export const PlayerNumber = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const PlayerName = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export { Stat, StatLabel, Stats, StatValue } from '@/view/competitionOverviewScreen/style';
