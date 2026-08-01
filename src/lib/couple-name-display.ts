export type PhraseSegment = {
  text: string;
  isMatch: boolean;
};

export function segmentExactPhrase(text: string, phrase: string): PhraseSegment[] {
  const target = phrase.trim();
  if (!target || !text.includes(target)) {
    return [{ text, isMatch: false }];
  }

  const segments: PhraseSegment[] = [];
  let cursor = 0;
  let matchIndex = text.indexOf(target, cursor);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex), isMatch: false });
    }

    segments.push({ text: target, isMatch: true });
    cursor = matchIndex + target.length;
    matchIndex = text.indexOf(target, cursor);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }

  return segments;
}

export function keepExactPhraseTogether(text: string, phrase: string): string {
  return segmentExactPhrase(text, phrase)
    .map((segment) => segment.isMatch ? segment.text.replaceAll(" ", "\u00a0") : segment.text)
    .join("");
}
