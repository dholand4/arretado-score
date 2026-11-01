// Sirene curta da mesa (fim de período e estouro da posse), gerada pelo navegador.
let contexto: AudioContext | null = null;

export function playBuzzer(duracaoMs = 700): void {
  try {
    contexto ??= new AudioContext();
    const oscilador = contexto.createOscillator();
    const volume = contexto.createGain();
    oscilador.type = 'square';
    oscilador.frequency.value = 440;
    volume.gain.value = 0.15;
    oscilador.connect(volume).connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + duracaoMs / 1000);
  } catch {
    // Sem áudio disponível (aba em segundo plano, navegador antigo): a tela já avisa.
  }
}
