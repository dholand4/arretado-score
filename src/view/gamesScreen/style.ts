import { Link } from 'react-router-dom';
import styled from 'styled-components';
export const Filters = styled.div`display: grid; gap: ${({ theme }) => theme.spacing.md}px; margin-bottom: ${({ theme }) => theme.spacing.lg}px; @media (min-width: ${({ theme }) => theme.breakpoints.md}px) { grid-template-columns: repeat(3, 1fr); }`;
export const List = styled.ul`display: grid; gap: ${({ theme }) => theme.spacing.sm}px; list-style: none; padding: 0;`;
export const GameLink = styled(Link)`display: flex; flex-direction: column; gap: ${({ theme }) => theme.spacing.xs}px; padding: ${({ theme }) => theme.spacing.md}px; border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radius.md}px; background: ${({ theme }) => theme.colors.surface}; color: ${({ theme }) => theme.colors.text}; text-decoration: none;`;
