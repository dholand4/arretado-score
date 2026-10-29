import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const Wrapper = styled.div<{ $fullScreen: boolean; $inline: boolean }>`
  display: ${({ $inline }) => ($inline ? 'inline-flex' : 'flex')};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme, $inline }) => ($inline ? 0 : theme.spacing.lg)}px;
  min-height: ${({ $fullScreen }) => ($fullScreen ? '100vh' : 'auto')};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;

export const Spinner = styled.span<{ $size: 'md' | 'sm' }>`
  display: inline-block;
  width: ${({ theme, $size }) => ($size === 'sm' ? theme.sizes.spinnerSm : theme.sizes.spinner)}px;
  height: ${({ theme, $size }) => ($size === 'sm' ? theme.sizes.spinnerSm : theme.sizes.spinner)}px;
  border: ${({ theme }) => theme.sizes.focusRing}px solid currentColor;
  border-right-color: transparent;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  animation: ${spin} 0.7s linear infinite;
`;
