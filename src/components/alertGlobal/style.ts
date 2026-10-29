import styled, { type DefaultTheme } from 'styled-components';
import type { AlertVariant } from './types';

const palette = (theme: DefaultTheme, variant: AlertVariant) =>
  ({
    success: { bg: theme.colors.successSoft, fg: theme.colors.success },
    error: { bg: theme.colors.dangerSoft, fg: theme.colors.danger },
    warning: { bg: theme.colors.warningSoft, fg: theme.colors.warning },
    info: { bg: theme.colors.infoSoft, fg: theme.colors.info },
  })[variant];

export const Container = styled.div<{ $variant: AlertVariant }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-left: ${({ theme }) => theme.spacing.xs}px solid ${({ theme, $variant }) => palette(theme, $variant).fg};
  background-color: ${({ theme, $variant }) => palette(theme, $variant).bg};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;

export const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs}px;
`;

export const Title = styled.strong`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  line-height: 1;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xxs}px;
`;
