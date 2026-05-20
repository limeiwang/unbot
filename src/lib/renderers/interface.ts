import type { MessageDocument } from '@/lib/types/dsl';

export interface MessageRenderer {
  render(doc: MessageDocument): string;
}
