import styled from 'styled-components';

export const Hero = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSize.xxl}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const Lead = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const SectionTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export { List } from '@/view/competitionsScreen/style';
