import type { SemanticBlock } from '@/lib/types/dsl';
import { parseSemantic } from '@/lib/parser/semantic-parser';
import { HumanizerPipeline, type HumanizerConfig } from '@/lib/humanizer/pipeline';
import { WeChatRenderer } from '@/lib/renderers/wechat';

export interface OptimizationResult {
  original: string;
  optimized: string;
  originalChars: number;
  optimizedChars: number;
  blocks: SemanticBlock[];
}

export function optimize(
  rawText: string,
  config?: HumanizerConfig
): OptimizationResult {
  const doc = parseSemantic(rawText);

  const pipeline = new HumanizerPipeline(config);
  const humanizedDoc = pipeline.process(doc);

  const renderer = new WeChatRenderer();
  const optimized = renderer.render(humanizedDoc);

  return {
    original: rawText,
    optimized,
    originalChars: rawText.length,
    optimizedChars: optimized.length,
    blocks: humanizedDoc.blocks,
  };
}
