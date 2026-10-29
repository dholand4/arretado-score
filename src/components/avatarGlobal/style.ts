import styled, { type DefaultTheme } from 'styled-components';

type AvatarSize = 'sm' | 'md' | 'lg';

const dimension = (theme: DefaultTheme, size: AvatarSize) =>
  ({ sm: theme.spacing.xl, md: theme.spacing.xxl, lg: theme.spacing.xxl * 2 })[size];

export const Frame = styled.span<{ $size: AvatarSize; $shape: 'circle' | 'square' }>`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: ${({ theme, $size }) => dimension(theme, $size)}px;
  height: ${({ theme, $size }) => dimension(theme, $size)}px;
  border-radius: ${({ theme, $shape }) => ($shape === 'circle' ? theme.radius.pill : theme.radius.md)}px;
  background-color: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.primaryHover};
  font-size: ${({ theme, $size }) => ($size === 'sm' ? theme.fontSize.xs : $size === 'md' ? theme.fontSize.md : theme.fontSize.xxl)}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
