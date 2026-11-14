'use client';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext;
  if (!Ctor) return null;
  audioContext ??= new Ctor();
  return audioContext;
}

/** Synthesizes a short cash-register "cha-ching" — no audio asset needed. */
export function playChaChing(): void {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') void context.resume();

  const now = context.currentTime;
  const master = context.createGain();
  master.gain.value = 0.35;
  master.connect(context.destination);

  const bell = context.createOscillator();
  bell.type = 'sine';
  bell.frequency.setValueAtTime(1800, now);
  const bellGain = context.createGain();
  bellGain.gain.setValueAtTime(0.0001, now);
  bellGain.gain.exponentialRampToValueAtTime(1, now + 0.01);
  bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  bell.connect(bellGain).connect(master);
  bell.start(now);
  bell.stop(now + 0.35);

  [2600, 3400].forEach((frequency, index) => {
    const delay = 0.12 + index * 0.04;
    const coin = context.createOscillator();
    coin.type = 'square';
    coin.frequency.setValueAtTime(frequency, now + delay);
    const coinGain = context.createGain();
    coinGain.gain.setValueAtTime(0.0001, now + delay);
    coinGain.gain.exponentialRampToValueAtTime(0.25, now + delay + 0.01);
    coinGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.25);
    coin.connect(coinGain).connect(master);
    coin.start(now + delay);
    coin.stop(now + delay + 0.25);
  });
}
