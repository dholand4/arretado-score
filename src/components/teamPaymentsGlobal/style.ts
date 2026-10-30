import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export const Generate = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: end;
  gap: ${({ theme }) => theme.spacing.sm}px;

  button {
    grid-column: 1 / -1;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: 1fr 1fr auto;

    button {
      grid-column: auto;
    }
  }
`;

export const MonthTitle = styled.h3`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.fontSize.md}px;
`;

export const Muted = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Row = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.sm}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;
