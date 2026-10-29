import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const Feedback = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const List = styled.ul`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const TeamLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Texts = styled.span`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs}px;
  min-width: 0;
`;

export const Name = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const Meta = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
