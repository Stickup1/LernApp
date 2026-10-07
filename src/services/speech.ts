export const speakEnglish = (text: string, rate: number = 0.9): void => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = rate;

  // Try to find a nice British English voice
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
