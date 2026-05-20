import type { MessageDocument, SemanticBlock } from '../types/dsl';
import { removeAIPhrases } from './categories';
import { shortenContent, type ShortenerConfig } from './shortener';

export interface HumanizerConfig {
  enabledCategories?: Record<string, boolean>;
  shortener?: ShortenerConfig;
}

export interface HumanizerStage {
  name: string;
  process(blocks: SemanticBlock[]): SemanticBlock[];
}

class RemoveAIFlavourStage implements HumanizerStage {
  name = 'remove-ai-flavour';
  constructor(private config?: HumanizerConfig) {}

  process(blocks: SemanticBlock[]): SemanticBlock[] {
    return blocks
      .map((block) => ({
        ...block,
        content: removeAIPhrases(block.content, this.config?.enabledCategories),
      }))
      .filter((block) => block.content.length > 0);
  }
}

class ShortenStage implements HumanizerStage {
  name = 'shorten';
  constructor(private config?: HumanizerConfig) {}

  process(blocks: SemanticBlock[]): SemanticBlock[] {
    return blocks.map((block) => ({
      ...block,
      content: shortenContent(block.content, this.config?.shortener),
    }));
  }
}

export class HumanizerPipeline {
  private stages: HumanizerStage[] = [];

  constructor(config?: HumanizerConfig) {
    this.stages = [
      new RemoveAIFlavourStage(config),
      new ShortenStage(config),
    ];
  }

  process(doc: MessageDocument): MessageDocument {
    let blocks = doc.blocks;
    for (const stage of this.stages) {
      blocks = stage.process(blocks);
    }
    return { ...doc, blocks };
  }
}
