import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { ImageUploadGlobal } from '..';

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

const keep = { kind: 'keep' } as const;

describe('ImageUploadGlobal', () => {
  it('emits replace when a valid image is chosen', () => {
    const onChange = vi.fn();
    renderWithTheme(<ImageUploadGlobal label="Logo" name="Liga" value={keep} onChange={onChange} />);
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Logo'), { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledWith({ kind: 'replace', file });
  });

  it('rejects other file types', () => {
    const onChange = vi.fn();
    renderWithTheme(<ImageUploadGlobal label="Logo" name="Liga" value={keep} onChange={onChange} />);
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Logo'), { target: { files: [file] } });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/JPEG, PNG ou WebP/)).toBeInTheDocument();
  });

  it('removes the current image', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <ImageUploadGlobal label="Logo" name="Liga" currentUrl="https://x/l.webp" value={keep} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    expect(onChange).toHaveBeenCalledWith({ kind: 'remove' });
  });
});
