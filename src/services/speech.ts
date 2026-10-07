type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

const normalizeSpeechText = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z]/g, '');

export const isPronunciationCheckSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export const startPronunciationCheck = (
  expectedText: string,
  onResult: (result: { transcript: string; matches: boolean }) => void,
  onError?: (message: string) => void,
): (() => void) => {
  if (typeof window === 'undefined' || !isPronunciationCheckSupported()) {
    onError?.('Dieses Gerät kann die Spracherkennung nicht nutzen.');
    return () => undefined;
  }

  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const recognition = new Recognition!();

  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? '';
    const expectedNormalized = normalizeSpeechText(expectedText);
    const transcriptNormalized = normalizeSpeechText(transcript);
    const matches =
      transcriptNormalized === expectedNormalized ||
      transcriptNormalized.includes(expectedNormalized) ||
      expectedNormalized.includes(transcriptNormalized);

    onResult({ transcript, matches });
  };

  recognition.onerror = () => {
    onError?.('Bitte sprich das Wort noch einmal deutlich.');
  };

  recognition.onend = () => undefined;
  recognition.start();

  return () => recognition.stop();
};

export const speakEnglish = (text: string, rate: number = 0.9): void => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = rate;

  const voices = window.speechSynthesis.getVoices();
  const gbVoice = voices.find(v => v.lang === 'en-GB' || v.lang.startsWith('en_GB'));
  const enVoice = voices.find(v => v.lang.startsWith('en'));

  if (gbVoice) {
    utterance.voice = gbVoice;
  } else if (enVoice) {
    utterance.voice = enVoice;
  }

  window.speechSynthesis.speak(utterance);
};
