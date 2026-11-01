import styled from 'styled-components';

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

// Área da prévia com a proporção do formato, para o modal não pular enquanto a imagem é gerada.
export const Preview = styled.div<{ $ratio: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  width: 100%;
  max-width: calc(60vh * ${({ $ratio }) => $ratio});
  aspect-ratio: ${({ $ratio }) => $ratio};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  overflow: hidden;
`;

export const Image = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

export const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
