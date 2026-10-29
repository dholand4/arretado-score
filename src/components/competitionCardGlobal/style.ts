import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

const card = css`
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
`;

export const CardLink = styled(Link)`
  ${card}
  transition: border-color ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const CardBox = styled.div`
  ${card}
`;

export const Texts = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  min-width: 0;
`;

export const Name = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const Meta = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
