export interface ShortenerConfig {
  maxCharsPerSegment?: number;
  maxLines?: number;
}

function splitLongString(text: string, maxChars: number): string[] {
  const segments: string[] = [];

  const sentences = text.split(/(?<=[。！？！?!?.])/).filter(Boolean);

  for (const sentence of sentences) {
    if (sentence.length <= maxChars) {
      segments.push(sentence.trim());
      continue;
    }

    const clauses = sentence.split(/(?<=[，；、,;])/).filter(Boolean);
    let buffer = '';

    for (const clause of clauses) {
      if ((buffer + clause).length <= maxChars) {
        buffer += clause;
      } else {
        if (buffer) segments.push(buffer.trim());
        buffer = clause;
      }
    }
    if (buffer) segments.push(buffer.trim());
  }

  return segments;
}

export function shortenContent(
  content: string,
  config?: ShortenerConfig
): string {
  const maxChars = config?.maxCharsPerSegment ?? 35;
  const maxLines = config?.maxLines ?? 3;
  const segments = splitLongString(content, maxChars);
  return segments.slice(0, maxLines).join('\n');
}
