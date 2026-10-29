import styled from 'styled-components';
export const Score = styled.p`font-size: ${({ theme }) => theme.fontSize.xl}px; font-weight: ${({ theme }) => theme.fontWeight.bold}; text-align: center;`;
export const Grid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: ${({ theme }) => theme.spacing.sm}px;`;
export const TeamSection = styled.section`margin: ${({ theme }) => theme.spacing.lg}px 0;`;
export const Player = styled.div`padding: ${({ theme }) => theme.spacing.md}px; margin-bottom: ${({ theme }) => theme.spacing.sm}px; background: ${({ theme }) => theme.colors.surface}; border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radius.md}px;`;
