export type TextSegment = {
  text: string;
  emphasis: boolean;
};

export function parseMarkdownEmphasis(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, index),
        emphasis: false,
      });
    }
    segments.push({ text: match[1], emphasis: true });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), emphasis: false });
  }

  if (segments.length === 0) {
    return [{ text, emphasis: false }];
  }

  return segments.filter((segment) => segment.text.length > 0);
}
