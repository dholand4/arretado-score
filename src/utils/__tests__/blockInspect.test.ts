import { blockInspect } from '@/utils/blockInspect';

function contextMenuHandler(touch: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: touch }) as unknown as typeof window.matchMedia;
  const spy = vi.spyOn(document, 'addEventListener');
  blockInspect();
  const call = spy.mock.calls.find(([type]) => type === 'contextmenu');
  spy.mockRestore();
  return call?.[1] as (event: Event) => void;
}

function fire(handler: (event: Event) => void, target: Element) {
  const event = new MouseEvent('contextmenu', { cancelable: true });
  Object.defineProperty(event, 'target', { value: target });
  handler(event);
  return event.defaultPrevented;
}

describe('blockInspect', () => {
  it('blocks the right-click menu outside text fields on desktop', () => {
    const handler = contextMenuHandler(false);
    expect(fire(handler, document.createElement('div'))).toBe(true);
    expect(fire(handler, document.createElement('input'))).toBe(false);
    expect(fire(handler, document.createElement('textarea'))).toBe(false);
  });

  it('keeps the long-press menu on touch screens so pasting works', () => {
    const handler = contextMenuHandler(true);
    expect(fire(handler, document.createElement('div'))).toBe(false);
  });
});
