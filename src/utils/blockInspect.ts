// Dificulta (não impede) abrir o código da página: botão direito, F12, Ctrl/Cmd+U,
// Ctrl/Cmd+Shift+I/J/C e Ctrl/Cmd+S. Só na versão publicada; a proteção real dos dados é o RLS.
const BLOCKED_WITH_SHIFT = new Set(['i', 'j', 'c']);
const BLOCKED_WITH_MOD = new Set(['u', 's']);

export function blockInspect() {
  document.addEventListener('contextmenu', (event) => event.preventDefault());
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
