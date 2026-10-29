import styled from 'styled-components';
export const TableWrap = styled.div`overflow-x: auto; margin-top: ${({ theme }) => theme.spacing.md}px;`;
export const Table = styled.table`border-collapse: collapse; width: 100%; text-align: right; background: ${({ theme }) => theme.colors.surface}; th, td { padding: ${({ theme }) => theme.spacing.sm}px; border-bottom: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border}; white-space: nowrap; } th:nth-child(2), td:nth-child(2) { text-align: left; }`;
export const Row = styled.tr<{ $qualified: boolean }>`background: ${({ $qualified, theme }) => $qualified ? theme.colors.successSoft : theme.colors.surface};`;
