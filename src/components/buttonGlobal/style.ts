import styled, { css, type DefaultTheme } from 'styled-components';
import type { ButtonSize, ButtonVariant } from './types';

export interface IStyledButtonProps {
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
}

const variants: Record<ButtonVariant, (theme: DefaultTheme) => ReturnType<typeof css>> = {
  primary: (theme) => css`
    background-color: ${theme.colors.primary};
    color: ${theme.colors.textInverse};
    &:hover:not(:disabled) { background-color: ${theme.colors.primaryHover}; }
  `,
  secondary: (theme) => css`
    background-color: ${theme.colors.secondary};
    color: ${theme.colors.textInverse};
    &:hover:not(:disabled) { background-color: ${theme.colors.secondaryHover}; }
  `,
  outline: (theme) => css`
    background-color: ${theme.colors.surface};
    color: ${theme.colors.text};
    border-color: ${theme.colors.borderStrong};
    &:hover:not(:disabled) { background-color: ${theme.colors.surfaceMuted}; }
  `,
  ghost: (theme) => css`
    background-color: transparent;
    color: ${theme.colors.text};
    &:hover:not(:disabled) { background-color: ${theme.colors.surfaceMuted}; }
  `,
  danger: (theme) => css`
    background-color: ${theme.colors.danger};
    color: ${theme.colors.textInverse};
    &:hover:not(:disabled) { background-color: ${theme.colors.dangerHover}; }
  `,
};

export const buttonStyles = css<IStyledButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  min-height: ${({ theme, $size }) => ($size === 'sm' ? theme.sizes.controlHeightSm : theme.sizes.controlHeight)}px;
  padding: 0 ${({ theme, $size }) => ($size === 'sm' ? theme.spacing.sm + theme.spacing.xs : theme.spacing.md + theme.spacing.xs)}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid transparent;
  border-radius: ${({ theme }) => theme.radius.md}px;
  font-size: ${({ theme, $size }) => ($size === 'sm' ? theme.fontSize.sm : theme.fontSize.md)}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  white-space: nowrap;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transition.fast};
  ${({ theme, $variant }) => variants[$variant](theme)}

  text-decoration: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const StyledButton = styled.button<IStyledButtonProps>`
  ${buttonStyles}
`;
