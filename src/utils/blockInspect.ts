// Dificulta (não impede) abrir o código da página: botão direito, F12, Ctrl/Cmd+U,
// Ctrl/Cmd+Shift+I/J/C e Ctrl/Cmd+S. Só na versão publicada; a proteção real dos dados é o RLS.
const BLOCKED_WITH_SHIFT = new Set(['i', 'j', 'c']);
const BLOCKED_WITH_MOD = new Set(['u', 's']);

// Campos de texto mantêm o menu (colar, copiar, selecionar tudo).
function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest('input, textarea, select, [contenteditable="true"]') !== null)
  );
}

export function blockInspect() {
  // No celular o menu de pressionar e segurar é o único jeito de colar; lá não há inspecionar.
  const touch = window.matchMedia('(pointer: coarse)').matches;
  document.addEventListener('contextmenu', (event) => {
    if (touch || isEditable(event.target)) return;
    event.preventDefault();
  });
  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const mod = event.ctrlKey || event.metaKey;
    const blocked =
      event.key === 'F12' ||
      (mod && event.shiftKey && BLOCKED_WITH_SHIFT.has(key)) ||
      (mod && event.altKey && BLOCKED_WITH_SHIFT.has(key)) ||
      (mod && !event.shiftKey && BLOCKED_WITH_MOD.has(key));
    if (blocked) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}
