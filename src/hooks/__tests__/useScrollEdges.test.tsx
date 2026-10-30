import { fireEvent, render, screen } from '@testing-library/react';
import { useScrollEdges } from '@/hooks/useScrollEdges';

function Probe() {
  const { ref, edges } = useScrollEdges<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="list" data-start={edges.start} data-end={edges.end}>
      itens
    </div>
  );
}

function setSizes(el: HTMLElement, sizes: { scrollWidth: number; clientWidth: number; scrollLeft: number }) {
  Object.entries(sizes).forEach(([key, value]) => {
    Object.defineProperty(el, key, { configurable: true, value });
  });
}

describe('useScrollEdges', () => {
  it('marks the hidden sides while scrolling', () => {
    render(<Probe />);
    const list = screen.getByTestId('list');

    setSizes(list, { scrollWidth: 600, clientWidth: 300, scrollLeft: 0 });
    fireEvent.scroll(list);
    expect(list).toHaveAttribute('data-start', 'false');
    expect(list).toHaveAttribute('data-end', 'true');

    setSizes(list, { scrollWidth: 600, clientWidth: 300, scrollLeft: 150 });
    fireEvent.scroll(list);
    expect(list).toHaveAttribute('data-start', 'true');
    expect(list).toHaveAttribute('data-end', 'true');

    setSizes(list, { scrollWidth: 600, clientWidth: 300, scrollLeft: 300 });
    fireEvent.scroll(list);
    expect(list).toHaveAttribute('data-start', 'true');
    expect(list).toHaveAttribute('data-end', 'false');
  });

  it('has no fade when everything fits', () => {
    render(<Probe />);
    const list = screen.getByTestId('list');
    setSizes(list, { scrollWidth: 300, clientWidth: 300, scrollLeft: 0 });
    fireEvent.scroll(list);
    expect(list).toHaveAttribute('data-start', 'false');
    expect(list).toHaveAttribute('data-end', 'false');
  });
});
