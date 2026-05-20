type BlockType = 'heading' | 'paragraph' | 'list-item' | 'warning' | 'conclusion' | 'divider';
interface SemanticBlock {
    type: BlockType;
    content: string;
    level?: number;
}
interface MessageDocument {
    version: 1;
    blocks: SemanticBlock[];
    metadata: {
        original: string;
        inputChars: number;
        outputChars: number;
    };
}

interface ShortenerConfig {
    maxCharsPerSegment?: number;
    maxLines?: number;
}
declare function shortenContent(content: string, config?: ShortenerConfig): string;

interface HumanizerConfig {
    enabledCategories?: Record<string, boolean>;
    shortener?: ShortenerConfig;
}
interface HumanizerStage {
    name: string;
    process(blocks: SemanticBlock[]): SemanticBlock[];
}
declare class HumanizerPipeline {
    private stages;
    constructor(config?: HumanizerConfig);
    process(doc: MessageDocument): MessageDocument;
}

interface OptimizationResult {
    original: string;
    optimized: string;
    originalChars: number;
    optimizedChars: number;
    blocks: SemanticBlock[];
}
declare function optimize(rawText: string, config?: HumanizerConfig): OptimizationResult;

interface PhraseRule {
    pattern: RegExp;
    replacement: string;
}
interface PhraseCategory {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    rules: PhraseRule[];
}
declare const AI_PHRASE_CATEGORIES: PhraseCategory[];
declare function removeAIPhrases(text: string, enabledCategories?: Record<string, boolean>): string;

declare function parseSemantic(raw: string): MessageDocument;

interface MessageRenderer {
    render(doc: MessageDocument): string;
}

declare class ChatRenderer implements MessageRenderer {
    render(doc: MessageDocument): string;
}

export { AI_PHRASE_CATEGORIES, type BlockType, ChatRenderer, type HumanizerConfig, HumanizerPipeline, type HumanizerStage, type MessageDocument, type MessageRenderer, type OptimizationResult, type PhraseCategory, type PhraseRule, type SemanticBlock, type ShortenerConfig, optimize, parseSemantic, removeAIPhrases, shortenContent };
