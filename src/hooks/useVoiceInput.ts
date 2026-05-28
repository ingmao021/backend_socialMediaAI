import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_PROMPT_LENGTH = 200;

const FATAL_ERRORS = new Set(['not-allowed', 'audio-capture', 'service-not-allowed']);

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  currentText: string;
}

export function useVoiceInput({ onTranscript, currentText }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const currentTextRef = useRef(currentText);

  useEffect(() => {
    currentTextRef.current = currentText;
  }, [currentText]);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const createAndStart = useCallback(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new Ctor();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0]?.transcript ?? '';
        }
      }
      if (!transcript) return;
      const base = currentTextRef.current;
      const separator = base.length > 0 && !base.endsWith(' ') ? ' ' : '';
      onTranscript((base + separator + transcript).substring(0, MAX_PROMPT_LENGTH));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (FATAL_ERRORS.has(event.error)) {
        isListeningRef.current = false;
        setIsListening(false);
      }
      // non-fatal errors (no-speech, network, aborted) are ignored; onend will restart
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        // Auto-restart: covers Safari silence timeouts and transient browser stops
        try {
          recognition.start();
        } catch {
          // if start() throws while already starting, ignore
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (!isSupported || isListeningRef.current) return;
    isListeningRef.current = true;
    setIsListening(true);
    createAndStart();
  }, [isSupported, createAndStart]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  return { isSupported, isListening, startListening, stopListening };
}
