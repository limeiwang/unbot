import type { MessageDocument } from '../types/dsl';

export interface MessageRenderer {
  render(doc: MessageDocument): string;
}
