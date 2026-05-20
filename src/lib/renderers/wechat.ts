import type { MessageRenderer } from './interface';
import type { MessageDocument, SemanticBlock } from '@/lib/types/dsl';

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`{1,3}(.+?)`{1,3}/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .trim();
}

function renderBlock(block: SemanticBlock): string {
  const content = cleanMarkdown(block.content);

  if (block.type === 'divider') return '· · ·';
  if (!content) return '';

  switch (block.type) {
    case 'heading':
      return `【${content}】`;

    case 'warning':
      return `⚠️ ${content}`;

    case 'conclusion':
      return `【${content.replace(/[：:：\s]+$/, '')}】`;

    case 'list-item':
      return `→ ${content}`;

    case 'paragraph':
    default:
      return content;
  }
}

export class WeChatRenderer implements MessageRenderer {
  render(doc: MessageDocument): string {
    return doc.blocks
      .map((block) => renderBlock(block))
      .filter(Boolean)
      .join('\n\n');
  }
}
