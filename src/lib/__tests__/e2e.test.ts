import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { parseSemantic } from '@/lib/parser/semantic-parser';
import { removeAIPhrases, AI_PHRASE_CATEGORIES } from '@/lib/humanizer/categories';
import { shortenContent } from '@/lib/humanizer/shortener';
import { HumanizerPipeline } from '@/lib/humanizer/pipeline';
import { optimize } from '@/lib/optimizer';
import { WeChatRenderer } from '@/lib/renderers/wechat';
import { loadHistory, saveEntry, clearHistory } from '@/lib/history';
import type { MessageDocument } from '@/lib/types/dsl';
import type { HumanizerConfig } from '@/lib/humanizer/pipeline';

// ============================================================
// 1. Semantic Parser — block detection, edge cases, robustness
// ============================================================
describe('Semantic Parser', () => {
  it('should parse headings (# ## ###)', () => {
    const doc = parseSemantic('# Title\n## Sub\n### Deep');
    expect(doc.blocks).toHaveLength(3);
    expect(doc.blocks[0]).toMatchObject({ type: 'heading', level: 1, content: 'Title' });
    expect(doc.blocks[1]).toMatchObject({ type: 'heading', level: 2, content: 'Sub' });
    expect(doc.blocks[2]).toMatchObject({ type: 'heading', level: 3, content: 'Deep' });
  });

  it('should parse bold headings (**text** alone)', () => {
    const doc = parseSemantic('**Market Analysis**\nsome content');
    expect(doc.blocks[0]).toMatchObject({ type: 'heading', level: 2, content: 'Market Analysis' });
  });

  it('should parse paragraphs and merge adjacent (no blank line)', () => {
    const doc = parseSemantic('line one\nline two\n\nline three');
    expect(doc.blocks).toHaveLength(2);
    expect(doc.blocks[0]).toMatchObject({ type: 'paragraph', content: 'line one\nline two' });
    expect(doc.blocks[1]).toMatchObject({ type: 'paragraph', content: 'line three' });
  });

  it('should parse list items (- * 1. 1、)', () => {
    const doc = parseSemantic('- item one\n* item two\n1. item three\n2、 item four');
    expect(doc.blocks.every(b => b.type === 'list-item')).toBe(true);
    expect(doc.blocks).toHaveLength(4);
  });

  it('should parse warning lines', () => {
    const doc = parseSemantic('⚠️ risk here\n注意：danger\n风险提示');
    expect(doc.blocks.every(b => b.type === 'warning')).toBe(true);
    expect(doc.blocks).toHaveLength(3);
  });

  it('should parse conclusion headers', () => {
    const doc = parseSemantic('总结\nsome final thought');
    expect(doc.blocks[0]).toMatchObject({ type: 'conclusion' });
    expect(doc.blocks[1]).toMatchObject({ type: 'paragraph' });
  });

  it('should parse dividers (--- *** ___)', () => {
    const doc = parseSemantic('text\n\n---\n\nmore');
    expect(doc.blocks[1]).toMatchObject({ type: 'divider' });
  });

  it('should handle empty input', () => {
    const doc = parseSemantic('');
    expect(doc.blocks).toHaveLength(0);
  });

  it('should handle whitespace-only input', () => {
    const doc = parseSemantic('   \n\n  \n  ');
    expect(doc.blocks).toHaveLength(0);
  });

  it('should handle input with only special characters / punctuation', () => {
    const doc = parseSemantic('@#$%^&*()\n!!!\n---');
    expect(doc.blocks.length).toBeGreaterThanOrEqual(1);
    // @#$%... should be paragraph, !!! unparseable, --- is divider
  });

  it('should handle very long single-line input', () => {
    const long = 'A'.repeat(10000);
    const doc = parseSemantic(long);
    expect(doc.blocks).toHaveLength(1);
    expect(doc.blocks[0].type).toBe('paragraph');
    expect(doc.metadata.inputChars).toBe(10000);
  });

  it('should handle mixed content correctly', () => {
    const input = `## Analysis

First paragraph here.

- point one
- point two

⚠️ Some warning

Conclusion text`;
    const doc = parseSemantic(input);
    expect(doc.blocks[0].type).toBe('heading');
    expect(doc.blocks[1].type).toBe('paragraph');
    expect(doc.blocks[2].type).toBe('list-item');
    expect(doc.blocks[3].type).toBe('list-item');
    expect(doc.blocks[4].type).toBe('warning');
    expect(doc.blocks[5].type).toBe('paragraph');
  });

  it('should not treat numbered lines incorrectly as list items', () => {
    const doc = parseSemantic('12345 people attended');
    // Should detect as paragraph (number followed by space but no dot/、)
    expect(doc.blocks[0].type).toBe('paragraph');
  });
});

// ============================================================
// 2. Humanizer Categories — rule coverage, toggles, edge cases
// ============================================================
describe('Humanizer Categories — removeAIPhrases', () => {
  // --- Chinese categories ---
  describe('Chinese phrase removal', () => {
    it('should remove transition phrases: 首先、其次、综合来看 etc.', () => {
      const result = removeAIPhrases('综合来看，市场表现良好。首先，从技术面看。其次，从资金面看。');
      expect(result).not.toContain('综合来看');
      expect(result).not.toContain('首先');
      expect(result).not.toContain('其次');
    });

    it('should remove hedging phrases: 值得注意的是、众所周知 etc.', () => {
      const result = removeAIPhrases('值得注意的是，今天成交量有所萎缩。众所周知，市场有风险。');
      expect(result).not.toContain('值得注意的是');
      expect(result).not.toContain('众所周知');
    });

    it('should remove perspective phrases: 从技术角度来看 etc.', () => {
      const result = removeAIPhrases('从技术角度来看，市场存在压力。从宏观层面上来说，经济向好。');
      expect(result).not.toContain('从技术角度来看');
      expect(result).not.toContain('从宏观层面上来说');
    });

    it('should remove filler phrases: 在一定程度上、换句话说 etc.', () => {
      const result = removeAIPhrases('在一定程度上，这是合理的。换句话说，需要谨慎。');
      expect(result).not.toContain('在一定程度上');
      expect(result).not.toContain('换句话说');
    });

    it('should remove template closings: 建议投资者、投资者可关注 etc.', () => {
      const result = removeAIPhrases('建议投资者保持谨慎乐观的态度。投资者可关注后续走势。');
      expect(result).not.toContain('建议投资者保持');
      expect(result).not.toContain('投资者可关注');
    });

    it('should remove redundant summary phrases: 基于以上分析 etc.', () => {
      const result = removeAIPhrases('基于以上分析，我们建议。根据当前市场，需要调整策略。');
      expect(result).not.toContain('基于以上分析');
      expect(result).not.toContain('根据当前市场');
    });

    it('should preserve meaningful content after removal', () => {
      const result = removeAIPhrases('综上所述，我们需要采取行动。');
      // After removing 综上所述，the content "我们需要采取行动" should remain
      expect(result).toContain('需要采取行动');
    });

    it('should handle text with no AI phrases (identity)', () => {
      const input = '今天天气真好。我们去公园散步吧。';
      expect(removeAIPhrases(input)).toBe(input);
    });

    it('should handle all Chinese categories used together', () => {
      const input = '综合来看，市场表现良好。首先，从技术角度来看，指数反弹。值得注意的是，成交量不足。总的来说，建议投资者保持谨慎。';
      const result = removeAIPhrases(input);
      // All AI phrases removed
      expect(result).not.toContain('综合来看');
      expect(result).not.toContain('首先');
      expect(result).not.toContain('从技术角度来看');
      expect(result).not.toContain('值得注意的是');
      expect(result).not.toContain('总的来说');
      expect(result).not.toContain('建议投资者');
      // Core content preserved
      expect(result).toContain('市场表现良好');
      expect(result).toContain('指数反弹');
    });
  });

  // --- English categories ---
  describe('English phrase removal', () => {
    it('should remove English transitions: First of all, Secondly, Last but not least', () => {
      const result = removeAIPhrases('First of all, the market is strong. Secondly, earnings are up. Last but not least, sentiment is positive.');
      expect(result).not.toContain('First of all');
      expect(result).not.toContain('Secondly');
      expect(result).not.toContain('Last but not least');
    });

    it('should remove English hedging: It is worth noting that, Needless to say', () => {
      const result = removeAIPhrases('It is worth noting that the weather is cold. Needless to say, we stayed indoors.');
      expect(result).not.toContain('It is worth noting that');
      expect(result).not.toContain('Needless to say');
    });

    it('should remove English perspective: From a technical perspective, In my opinion', () => {
      const result = removeAIPhrases('From a technical perspective, the system works. In my opinion, we should wait.');
      expect(result).not.toContain('From a technical perspective');
      expect(result).not.toContain('In my opinion');
    });

    it('should remove English conclusion: In conclusion, To sum up, All things considered', () => {
      const result = removeAIPhrases('In conclusion, the project is on track. To sum up, we have made progress.');
      expect(result).not.toContain('In conclusion');
      expect(result).not.toContain('To sum up');
    });

    it('should remove English filler: Generally speaking, To a certain extent, In other words', () => {
      const result = removeAIPhrases('Generally speaking, the results are good. To a certain extent, that is true. In other words, be careful.');
      expect(result).not.toContain('Generally speaking');
      expect(result).not.toContain('To a certain extent');
      expect(result).not.toContain('In other words');
    });

    it('should preserve meaningful English content after removal', () => {
      const result = removeAIPhrases('It is worth noting that the sky is blue today.');
      expect(result).toContain('sky is blue today');
    });

    it('should capitalize sentences after AI phrase removal', () => {
      const result = removeAIPhrases('in conclusion, the product is ready.');
      // After removing "in conclusion, " -> "the product is ready." -> capitalize -> "The product is ready."
      expect(result[0]).toBe('T');
    });
  });

  // --- Mixed language ---
  describe('Mixed Chinese-English', () => {
    it('should remove both Chinese and English phrases in mixed text', () => {
      const input = 'First of all, the system works. 值得注意的是, the tests pass. In conclusion, 整体表现良好。';
      const result = removeAIPhrases(input);
      expect(result).not.toContain('First of all');
      expect(result).not.toContain('值得注意的是');
      expect(result).not.toContain('In conclusion');
      expect(result).toContain('The system works');
      expect(result).toContain('The tests pass');
      expect(result).toContain('整体表现良好');
    });
  });

  // --- Category toggles ---
  describe('Category toggles', () => {
    it('should skip a category when disabled via enabledCategories', () => {
      const input = '首先，我们来看数据。值得注意的是，趋势向好。';
      // Disable cn-hedging
      const result = removeAIPhrases(input, { 'cn-hedging': false });
      // transitions still removed
      expect(result).not.toContain('首先');
      // hedging kept because disabled
      expect(result).toContain('值得注意的是');
    });

    it('should remove only enabled categories when toggles are specified', () => {
      const input = 'First of all, check the data. 从宏观来看，趋势向好。';
      const result = removeAIPhrases(input, { 'en-transitions': true, 'cn-perspective': false });
      expect(result).not.toContain('First of all');
      expect(result).toContain('从宏观来看');
    });

    it('should respect multiple disabled categories', () => {
      const input = 'First of all, test. Notably, check.';
      const result = removeAIPhrases(input, { 'en-transitions': false, 'en-hedging': false });
      expect(result).toContain('First of all');
      expect(result).toContain('Notably');
    });
  });

  // --- Edge cases ---
  describe('Edge cases', () => {
    it('should handle empty string', () => {
      expect(removeAIPhrases('')).toBe('');
    });

    it('should handle string with only numbers', () => {
      expect(removeAIPhrases('12345 67890')).toBe('12345 67890');
    });

    it('should handle string with only punctuation', () => {
      const result = removeAIPhrases('!!! ??? 。。。');
      // cleanup deduplicates repeated Chinese periods
      expect(result).not.toContain('。。。');
    });

    it('should handle very long text', () => {
      const base = 'First of all, check this data. It is worth noting that the approach works. ';
      const long = base.repeat(50);
      const result = removeAIPhrases(long);
      expect(result).not.toContain('First of all');
      expect(result).not.toContain('It is worth noting that');
    });

    it('should handle text with only AI phrases (everything removed)', () => {
      const result = removeAIPhrases('First of all, it is worth noting that overall, the situation is clear.');
      // Should not crash; should produce something or empty
      expect(typeof result).toBe('string');
    });

    it('should not double-space or leave leading commas', () => {
      const result = removeAIPhrases('首先，我们需要行动。');
      expect(result).not.toMatch(/^[，,。.\s]+/);
      expect(result).not.toMatch(/\s{2,}/);
    });
  });

  // --- Categories registration completeness ---
  describe('Category coverage', () => {
    it('should have all required Chinese categories', () => {
      const cnIds = AI_PHRASE_CATEGORIES.filter(c => c.id.startsWith('cn-')).map(c => c.id);
      expect(cnIds).toContain('cn-transitions');
      expect(cnIds).toContain('cn-hedging');
      expect(cnIds).toContain('cn-perspective');
      expect(cnIds).toContain('cn-filler');
      expect(cnIds).toContain('cn-templates');
      expect(cnIds).toContain('cn-redundant');
    });

    it('should have all required English categories', () => {
      const enIds = AI_PHRASE_CATEGORIES.filter(c => c.id.startsWith('en-')).map(c => c.id);
      expect(enIds).toContain('en-transitions');
      expect(enIds).toContain('en-hedging');
      expect(enIds).toContain('en-perspective');
      expect(enIds).toContain('en-conclusion');
      expect(enIds).toContain('en-filler');
    });

    it('each category should have at least one rule', () => {
      for (const cat of AI_PHRASE_CATEGORIES) {
        expect(cat.rules.length).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================
// 3. Shortener — segment splitting, max chars, max lines
// ============================================================
describe('Shortener', () => {
  it('should split long text by sentences and keep under maxChars', () => {
    const result = shortenContent('第一句话。第二句话，但是比较长。第三句话。', { maxCharsPerSegment: 15 });
    // Each segment should be <= 15 chars
    for (const line of result.split('\n')) {
      expect(line.length).toBeLessThanOrEqual(15);
    }
  });

  it('should limit output to maxLines', () => {
    const long = 'A! '.repeat(20);
    const result = shortenContent(long, { maxCharsPerSegment: 10, maxLines: 3 });
    expect(result.split('\n')).toHaveLength(3);
  });

  it('should keep short text unchanged (under maxChars)', () => {
    const input = 'Short text.';
    const result = shortenContent(input, { maxCharsPerSegment: 100 });
    expect(result).toBe(input);
  });

  it('should default to maxChars=35, maxLines=3 when no config', () => {
    const long = 'Hello! '.repeat(20);
    const result = shortenContent(long);
    // Should have at most 3 lines
    expect(result.split('\n').length).toBeLessThanOrEqual(3);
    for (const line of result.split('\n')) {
      expect(line.length).toBeLessThanOrEqual(35);
    }
  });

  it('should handle empty string', () => {
    expect(shortenContent('')).toBe('');
  });

  it('should handle single short sentence', () => {
    expect(shortenContent('Hello world.')).toBe('Hello world.');
  });
});

// ============================================================
// 4. Humanizer Pipeline — processing flow
// ============================================================
describe('Humanizer Pipeline', () => {
  function makeDoc(content: string): MessageDocument {
    return parseSemantic(content);
  }

  it('should remove AI phrases in the pipeline', () => {
    const doc = makeDoc('The market is strong. It is worth noting that risks exist.');
    const pipeline = new HumanizerPipeline();
    const result = pipeline.process(doc);
    expect(result.blocks[0].content).not.toContain('It is worth noting that');
    expect(result.blocks[0].content).toContain('The market is strong');
  });

  it('should shorten content in the pipeline', () => {
    const doc = makeDoc('A! B! C! D! E! F!');
    const pipeline = new HumanizerPipeline({ shortener: { maxCharsPerSegment: 5, maxLines: 2 } });
    const result = pipeline.process(doc);
    expect(result.blocks[0].content.split('\n')).toHaveLength(2);
  });

  it('should pass config to both stages', () => {
    const doc = makeDoc('First of all, hello. Second, world.');
    const pipeline = new HumanizerPipeline({ enabledCategories: { 'en-transitions': false } });
    const result = pipeline.process(doc);
    expect(result.blocks[0].content).toContain('First of all');
    expect(result.blocks[0].content).toContain('Second');
  });

  it('should filter out blocks that become empty after processing', () => {
    const doc = makeDoc('First of all, ');
    const pipeline = new HumanizerPipeline();
    const result = pipeline.process(doc);
    expect(result.blocks.length).toBe(0);
  });
});

// ============================================================
// 5. Renderer — WeChat output format
// ============================================================
describe('WeChat Renderer', () => {
  const renderer = new WeChatRenderer();

  it('should render headings with 【】', () => {
    const doc: MessageDocument = {
      version: 1,
      blocks: [{ type: 'heading', content: 'Summary', level: 2 }],
      metadata: { original: '', inputChars: 0, outputChars: 0 },
    };
    expect(renderer.render(doc)).toBe('【Summary】');
  });

  it('should render warnings with ⚠️', () => {
    const doc: MessageDocument = {
      version: 1,
      blocks: [{ type: 'warning', content: 'Risk ahead' }],
      metadata: { original: '', inputChars: 0, outputChars: 0 },
    };
    expect(renderer.render(doc)).toBe('⚠️ Risk ahead');
  });

  it('should render list-items with →', () => {
    const doc: MessageDocument = {
      version: 1,
      blocks: [
        { type: 'list-item', content: 'point one' },
        { type: 'list-item', content: 'point two' },
      ],
      metadata: { original: '', inputChars: 0, outputChars: 0 },
    };
    expect(renderer.render(doc)).toBe('→ point one\n\n→ point two');
  });

  it('should render dividers as · · ·', () => {
    const doc: MessageDocument = {
      version: 1,
      blocks: [{ type: 'divider', content: '' }],
      metadata: { original: '', inputChars: 0, outputChars: 0 },
    };
    expect(renderer.render(doc)).toBe('· · ·');
  });

  it('should strip markdown when rendering', () => {
    const doc: MessageDocument = {
      version: 1,
      blocks: [{ type: 'paragraph', content: 'This is **bold** and [link](http://example.com)' }],
      metadata: { original: '', inputChars: 0, outputChars: 0 },
    };
    expect(renderer.render(doc)).toContain('bold');
    expect(renderer.render(doc)).not.toContain('**bold**');
    expect(renderer.render(doc)).not.toContain('http://');
  });

  it('should join multiple blocks with double newline', () => {
    const doc: MessageDocument = {
      version: 1,
      blocks: [
        { type: 'paragraph', content: 'First' },
        { type: 'paragraph', content: 'Second' },
      ],
      metadata: { original: '', inputChars: 0, outputChars: 0 },
    };
    expect(renderer.render(doc)).toBe('First\n\nSecond');
  });

  it('should handle empty blocks gracefully', () => {
    const doc: MessageDocument = {
      version: 1,
      blocks: [],
      metadata: { original: '', inputChars: 0, outputChars: 0 },
    };
    expect(renderer.render(doc)).toBe('');
  });
});

// ============================================================
// 6. Full Optimizer — end-to-end pipeline
// ============================================================
describe('Optimizer (end-to-end)', () => {
  it('should optimize Chinese AI text', () => {
    const result = optimize('综合来看，市场表现良好。首先，从技术角度看，指数反弹。');
    expect(result.optimized).not.toContain('综合来看');
    expect(result.optimized).not.toContain('首先');
    expect(result.optimized).toContain('市场表现良好');
    expect(result.optimizedChars).toBeLessThan(result.originalChars);
    expect(result.blocks.length).toBeGreaterThan(0);
  });

  it('should optimize English AI text', () => {
    const result = optimize('First of all, the market is strong. It is worth noting that risks exist. In conclusion, be cautious.');
    expect(result.optimized).not.toContain('First of all');
    expect(result.optimized).not.toContain('It is worth noting that');
    expect(result.optimized).not.toContain('In conclusion');
    expect(result.optimized).toContain('market is strong');
    expect(result.optimizedChars).toBeLessThan(result.originalChars);
  });

  it('should optimize mixed Chinese-English text', () => {
    const result = optimize('First of all, performance is good. 值得注意的是, the trend is positive. In conclusion, 保持谨慎。');
    expect(result.optimized).not.toContain('First of all');
    expect(result.optimized).not.toContain('值得注意的是');
    expect(result.optimized).not.toContain('In conclusion');
    expect(result.optimized).toContain('Performance is good');
    expect(result.optimized).toContain('The trend is positive');
    expect(result.optimized).toContain('保持谨慎');
  });

  it('should apply custom config to optimize', () => {
    const result = optimize('首先，测试。值得注意的是，保留。', { enabledCategories: { 'cn-hedging': false } });
    expect(result.optimized).not.toContain('首先');
    expect(result.optimized).toContain('值得注意的是');
  });

  it('should handle input with no AI phrases', () => {
    const result = optimize('今天天气真好。我们去散步。');
    expect(result.optimized).toContain('今天天气真好');
  });

  it('should return correct character counts', () => {
    const result = optimize('Hello world. It is worth noting that this is a test.');
    expect(result.originalChars).toBeGreaterThan(0);
    expect(result.optimizedChars).toBeGreaterThan(0);
    expect(result.optimizedChars).toBeLessThanOrEqual(result.originalChars);
  });
});

// ============================================================
// 7. History — localStorage CRUD, 50-entry cap
// ============================================================
describe('History', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should save and load history entries', () => {
    const saved = saveEntry({ input: 'test input', output: 'test output', inputChars: 10, outputChars: 8 });
    expect(saved).toHaveLength(1);
    expect(saved[0].input).toBe('test input');
    expect(saved[0].output).toBe('test output');
    expect(saved[0].id).toBeDefined();
    expect(saved[0].timestamp).toBeDefined();

    const loaded = loadHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].input).toBe('test input');
  });

  it('should add new entries to the top (LIFO)', () => {
    saveEntry({ input: 'first', output: 'out1', inputChars: 5, outputChars: 3 });
    saveEntry({ input: 'second', output: 'out2', inputChars: 6, outputChars: 4 });
    const history = loadHistory();
    expect(history[0].input).toBe('second');
    expect(history[1].input).toBe('first');
  });

  it('should cap at 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      saveEntry({ input: `entry ${i}`, output: `out ${i}`, inputChars: 5, outputChars: 3 });
    }
    const history = loadHistory();
    expect(history.length).toBe(50);
    // Oldest entries trimmed
    expect(history[49].input).toBe('entry 10');
  });

  it('should clear all history', () => {
    saveEntry({ input: 'test', output: 'out', inputChars: 4, outputChars: 2 });
    clearHistory();
    expect(loadHistory()).toHaveLength(0);
  });

  it('should return empty array if no history exists', () => {
    expect(loadHistory()).toHaveLength(0);
  });
});
