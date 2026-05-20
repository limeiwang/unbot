import type { MessageDocument, SemanticBlock, BlockType } from '../types/dsl';

function detectBlockType(line: string): { type: BlockType; content: string; level?: number } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Divider
  if (/^[-_*]{3,}$/.test(trimmed)) {
    return { type: 'divider', content: '' };
  }

  // Heading: # ## ###
  const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
  if (headingMatch) {
    return {
      type: 'heading',
      content: headingMatch[2].trim(),
      level: headingMatch[1].length,
    };
  }

  // Bold heading: **text** on its own line
  const boldHeadingMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
  if (boldHeadingMatch) {
    return { type: 'heading', content: boldHeadingMatch[1].trim(), level: 2 };
  }

  // Warning: ⚠️ / 注意 / 警告 / 风险 / 警惕
  if (
    /^[⚠️‼]/.test(trimmed) ||
    /^(注意|警告|警惕|温馨提示)[：:：\s]/.test(trimmed) ||
    /风险提示/.test(trimmed) ||
    /需要警惕/.test(trimmed) ||
    /^.*(?:风险|注意|警惕).*[：:]$/.test(trimmed)
  ) {
    const cleaned = trimmed.replace(/^[⚠️‼]\s*/, '').trim();
    return { type: 'warning', content: cleaned };
  }

  // Conclusion markers at start (strong conclusion headers only)
  if (/^(总结|综上|综上所述|总而言之|写在最后)[：:：\s]?$/.test(trimmed)) {
    return { type: 'conclusion', content: trimmed };
  }

  // List item: - * 1. 1、
  if (/^[-*]\s+(.+)/.test(trimmed)) {
    return { type: 'list-item', content: trimmed.replace(/^[-*]\s+/, '').trim() };
  }
  if (/^\d+[.、]\s+(.+)/.test(trimmed)) {
    return { type: 'list-item', content: trimmed.replace(/^\d+[.、]\s+/, '').trim() };
  }

  // Default: paragraph
  return { type: 'paragraph', content: trimmed };
}

export function parseSemantic(raw: string): MessageDocument {
  const lines = raw.split('\n');
  const blocks: SemanticBlock[] = [];
  let lastWasEmpty = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      lastWasEmpty = true;
      continue;
    }

    const detected = detectBlockType(line);
    if (!detected) { lastWasEmpty = false; continue; }

    const { type, content, level } = detected;

    // Only merge paragraphs if no blank line between them
    if (type === 'paragraph' && !lastWasEmpty && blocks.length > 0) {
      const last = blocks[blocks.length - 1];
      if (last.type === 'paragraph') {
        last.content += '\n' + content;
        continue;
      }
    }

    blocks.push({ type, content: content || '', ...(level ? { level } : {}) });
    lastWasEmpty = false;
  }

  return {
    version: 1,
    blocks,
    metadata: {
      original: raw,
      inputChars: raw.length,
      outputChars: 0,
    },
  };
}
