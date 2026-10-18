import { useCallback, useEffect, useRef, useState } from 'react';
import { sound, VOICE_PERSONAS, type VoicePersonaId } from '../services/sound';

/**
 * useSpeak — truthful text-to-speech button state (§20–22).
 *
 * Every question-audio button in the Grade-1 app must show what is actually
 * happening, because `sound.speak()` itself is fire-and-forget:
 *
 *   idle        — nothing spoken yet (or stopped); safe to press
 *   playing     — the utterance is on the platform queue / sounding
 *   played      — the utterance finished; pressing replays from idle
 *   unavailable — this device cannot speak; the button says so instead of
 *                 pretending audio happened (AUDIO_UNAVAILABLE)
 *
 * Guarantees:
 *   - pressing while playing cancels the old utterance first: repeated taps
 *     never stack uncontrolled playback;
 *   - unmount cancels any pending utterance (no ghost audio after navigation);
 *   - `speak()` returns whether audio actually started, and moves to
 *     `unavailable` when the platform refuses.
 */

export type SpeakState = 'idle' | 'playing' | 'played' | 'unavailable';

function synthesisAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.speechSynthesis?.speak === 'function'
  );
}

export function useSpeak() {
  const [state, setState] = useState<SpeakState>(() => (synthesisAvailable() ? 'idle' : 'unavailable'));
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    utteranceRef.current = null;
    try {
      if (synthesisAvailable()) window.speechSynthesis.cancel();
    } catch {
      /* Stopping must never throw. */
    }
    setState((prev) => (prev === 'unavailable' ? 'unavailable' : 'idle'));
  }, []);

  // No ghost audio after the question/modal unmounts.
  useEffect(() => {
    return () => {
      utteranceRef.current = null;
      try {
        if (synthesisAvailable()) window.speechSynthesis.cancel();
      } catch {
        /* Unmount cleanup must never throw. */
      }
    };
  }, []);

  const speak = useCallback(
    (text: string, lang: 'vi-VN' | 'en-US' | 'en-GB' = 'vi-VN', personaId?: VoicePersonaId): boolean => {
      if (!synthesisAvailable()) {
        setState('unavailable');
        return false;
      }
      if (sound.getMuted() || !sound.getVoiceEnabled()) {
        // The parent silenced the app. That is a deliberate setting, not a
        // device failure — report idle so the button stays pressable for later.
        return false;
      }
      try {
        window.speechSynthesis.cancel(); // never stack utterances
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        const baseRate = lang === 'vi-VN' ? 0.9 : 0.85;
        utterance.rate = Math.min(2, Math.max(0.1, baseRate * (personaId ? VOICE_PERSONAS[personaId].rate : 1)));
        utterance.pitch = Math.min(2, Math.max(0, personaId ? VOICE_PERSONAS[personaId].pitch : 1.1));
        const voice = personaId !== undefined ? sound.pickPersonaVoice(personaId, lang) : sound.pickVoice(lang);
        if (voice) utterance.voice = voice;
        utteranceRef.current = utterance;
        utterance.onend = () => {
          if (utteranceRef.current === utterance) {
            utteranceRef.current = null;
            setState('played');
          }
        };
        utterance.onerror = () => {
          if (utteranceRef.current === utterance) {
            utteranceRef.current = null;
            setState('played');
          }
        };
        setState('playing');
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        utteranceRef.current = null;
        setState('unavailable');
        return false;
      }
    },
    []
  );

  return { state, speak, stop };
}
