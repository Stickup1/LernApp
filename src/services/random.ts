export const shuffleItems = <T,>(items: readonly T[]): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

export const createAnswerOptions = (
  correctAnswer: string,
  candidates: readonly string[],
  optionCount = 4,
): string[] => {
  const distractors = shuffleItems([...new Set(candidates)]
    .filter(answer => answer !== correctAnswer))
    .slice(0, Math.max(0, optionCount - 1));

  return shuffleItems([correctAnswer, ...distractors]);
};