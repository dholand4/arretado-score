import styled, { type DefaultTheme } from 'styled-components';
import type { BadgeTone } from './types';

const palette = (theme: DefaultTheme, tone: BadgeTone) =>
  ({
    neutral: { bg: theme.colors.surfaceMuted, fg: theme.colors.textMuted },
    primary: { bg: theme.colors.primarySoft, fg: theme.colors.primaryHover },
    success: { bg: theme.colors.successSoft, fg: theme.colors.success },
    danger: { bg: theme.colors.dangerSoft, fg: theme.colors.danger },
    warning: { bg: theme.colors.warningSoft, fg: theme.colors.warning },
    info: { bg: theme.colors.infoSoft, fg: theme.colors.info },
  })[tone];

export const Badge = styled.span<{ $tone: BadgeTone }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xxs}px ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme, $tone }) => palette(theme, $tone).bg};
  color: ${({ theme, $tone }) => palette(theme, $tone).fg};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  white-space: nowrap;
`;
