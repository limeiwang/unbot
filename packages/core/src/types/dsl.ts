export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'list-item'
  | 'warning'
  | 'conclusion'
  | 'divider';

export interface SemanticBlock {
  type: BlockType;
  content: string;
  level?: number;
}

export interface MessageDocument {
  version: 1;
  blocks: SemanticBlock[];
  metadata: {
    original: string;
    inputChars: number;
    outputChars: number;
  };
}
