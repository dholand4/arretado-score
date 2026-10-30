import styled from 'styled-components';

export const Phase = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Summary = styled.p`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const Group = styled.details`
  font-size: ${({ theme }) => theme.fontSize.sm}px;

  summary {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const List = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.xxs}px;
  margin: ${({ theme }) => theme.spacing.xs}px 0 0;
  padding-left: ${({ theme }) => theme.spacing.md}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const Detail = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;
