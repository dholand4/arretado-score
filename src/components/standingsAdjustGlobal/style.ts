import styled from 'styled-components';
export const Box = styled.div`margin: ${({ theme }) => theme.spacing.md}px 0;`;
export const Line = styled.div`display: flex; flex-wrap: wrap; align-items: end; gap: ${({ theme }) => theme.spacing.sm}px; margin: ${({ theme }) => theme.spacing.sm}px 0;`;
