import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorldEvent } from '../game/world';

interface AudioGraph {
  context: AudioContext;
  master: GainNode;
}

export function useAmbientAudio(volume: number) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const graph = useRef<AudioGraph | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const toggle = useCallback(async () => {
    try {
      if (!graph.current) {
        const context = new AudioContext();
        const master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);

        const noise = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
        const data = noise.getChannelData(0);
        let previous = 0;
        for (let i = 0; i < data.length; i++) {
          previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
          data[i] = previous * 3;
        }
        const wind = context.createBufferSource();
        wind.buffer = noise;
        wind.loop = true;
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 420;
        const windGain = context.createGain();
        windGain.gain.value = 0.2;
        wind.connect(filter).connect(windGain).connect(master);
        wind.start();

        [55, 82.41, 110.14].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          gain.gain.value = 0.025 / (index + 1);
          oscillator.connect(gain).connect(master);
          oscillator.start();
        });
        graph.current = { context, master };
      }
      const { context, master } = graph.current;
      await context.resume();
      const next = !enabled;
      master.gain.setTargetAtTime(next ? volumeRef.current : 0, context.currentTime, 0.3);
      setEnabled(next);
      setError('');
    } catch {
      setError('L\u2019audio n\u2019est pas disponible dans ce navigateur.');
    }
  }, [enabled]);

  useEffect(() => {
    if (!graph.current) return;
    graph.current.master.gain.setTargetAtTime(enabled ? volume : 0, graph.current.context.currentTime, 0.15);
  }, [volume, enabled]);

  const cue = useCallback((event: WorldEvent) => {
    if (!graph.current || graph.current.context.state !== 'running') return;
    const { context, master } = graph.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const frequency = { jump: 160, switch: 310, death: 80, complete: 440 }[event];
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (event === 'death' ? 0.4 : 1.45), now + 0.22);
    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + 0.65);
  }, []);

  useEffect(() => () => {
    const current = graph.current;
    graph.current = null;
    if (current) void current.context.close().catch(() => {});
  }, []);

  return { enabled, toggle, cue, error };
}