import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { AvatarGlobal } from '..';

describe('AvatarGlobal', () => {
  it('renders the image when there is a source', () => {
    renderWithTheme(<AvatarGlobal name="Ana Souza" src="https://x/foto.webp" />);
    expect(screen.getByRole('img', { name: 'Ana Souza' })).toHaveAttribute('src', 'https://x/foto.webp');
  });

  it('falls back to initials', () => {
    renderWithTheme(<AvatarGlobal name="Ana Souza" />);
    expect(screen.getByText('AS')).toBeInTheDocument();
  });
});
