"use client";

import { useEffect, useRef } from "react";

// Soft C-major pentatonic notes: no dissonance, no sudden jumps.
const MELODY_HZ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
const PAD_CHORDS_HZ = [
  [130.81, 196.0, 261.63],
  [110.0, 164.81, 220.0],
  [146.83, 220.0, 293.66],
  [130.81, 196.0, 261.63],
];
const NOTE_INTERVAL_MS = 2400;
const CHORD_INTERVAL_MS = 9600;

/**
 * Generated ambient music for calm breaks. Synthesised with the Web Audio API
 * (no audio files, no licensing), with slow attacks and long releases so there
 * are no abrupt sounds for children sensitive to audio stimuli.
 */
export function useCalmMusic(playing: boolean, volume: number) {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const audible = volume > 0;

  useEffect(() => {
    if (!playing || !audible || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    let context: AudioContext;
    try {
      context = new AudioContextClass();
    } catch {
      return;
    }
    const master = context.createGain();
    master.gain.setValueAtTime(0, context.currentTime);
    master.gain.linearRampToValueAtTime(volumeRef.current, context.currentTime + 3);
    master.connect(context.destination);
    contextRef.current = context;
    masterRef.current = master;

    const playVoice = (frequency: number, duration: number, peak: number, attack: number) => {
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.1);
    };

    let chordIndex = 0;
    let previousNote = 2;
    const playChord = () => {
      PAD_CHORDS_HZ[chordIndex % PAD_CHORDS_HZ.length].forEach((frequency) =>
        playVoice(frequency, CHORD_INTERVAL_MS / 1000 + 1.5, 0.08, 2.5));
      chordIndex += 1;
    };
    const playNote = () => {
      // Step to a neighbouring note so the melody stays smooth and predictable.
      const step = Math.random() < 0.5 ? -1 : 1;
      previousNote = Math.min(MELODY_HZ.length - 1, Math.max(0, previousNote + step));
      playVoice(MELODY_HZ[previousNote], 3.2, 0.07, 0.6);
    };

    playChord();
    const chordTimer = window.setInterval(playChord, CHORD_INTERVAL_MS);
    const noteTimer = window.setInterval(playNote, NOTE_INTERVAL_MS);

    return () => {
      window.clearInterval(chordTimer);
      window.clearInterval(noteTimer);
      const fadeEnd = context.currentTime + 0.8;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(master.gain.value, context.currentTime);
      master.gain.linearRampToValueAtTime(0, fadeEnd);
      window.setTimeout(() => { void context.close().catch(() => undefined); }, 900);
      contextRef.current = null;
      masterRef.current = null;
    };
  }, [playing, audible]);

  useEffect(() => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(master.gain.value, context.currentTime);
    master.gain.linearRampToValueAtTime(volume, context.currentTime + 0.5);
  }, [volume]);
}
