import { LearningWord, VocabWord } from '../types/vocab';

export const expandWordMeanings = (word: VocabWord): LearningWord[] => {
  const { meanings = [], ...primaryMeaning } = word;

  return [
    {
      ...primaryMeaning,
    },
    ...meanings
      .filter(meaning => meaning.de.trim())
      .map(meaning => ({
        ...primaryMeaning,
        id: `${word.id}::${meaning.id}`,
        de: meaning.de,
        exampleEn: meaning.exampleEn,
        exampleDe: meaning.exampleDe,
        box: meaning.box ?? word.box,
        lastPracticed: meaning.lastPracticed,
        correctCount: meaning.correctCount ?? 0,
        incorrectCount: meaning.incorrectCount ?? 0,
      })),
  ];
};