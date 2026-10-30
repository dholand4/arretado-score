import styled from 'styled-components';

export { Heading, Points, Scroll, Section, Table } from '@/components/scoreSheetTeamGlobal/style';

export const PlayerCell = styled.td`
  && {
    text-align: left;
    font-weight: ${({ theme }) => theme.fontWeight.medium};
  }
`;

export const Number = styled.td`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;
