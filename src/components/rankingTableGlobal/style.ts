import styled from 'styled-components';

export { Scroll, Table } from '@/components/standingsTableGlobal/style';

export const PlayerCell = styled.td`
  && {
    text-align: left;
  }
`;

export const Player = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Names = styled.span`
  display: flex;
  flex-direction: column;
  line-height: ${({ theme }) => theme.lineHeight.tight};
`;

export const Name = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const Team = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Total = styled.td`
  && {
    font-weight: ${({ theme }) => theme.fontWeight.bold};
  }
`;
