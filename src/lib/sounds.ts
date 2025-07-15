
'use client';

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window !== 'undefined') {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser");
        return null;
      }
    }
    // If the context is suspended, try to resume it. This can happen if the page
    // was loaded without user interaction.
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }
  return audioContext;
};


export const playSound = (type: 'success' | 'error') => {
  const context = getAudioContext();
  if (!context || context.state !== 'running') return;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  if (type === 'success') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, context.currentTime);
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
  } else if (type === 'error') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(300, context.currentTime);
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  }
};
