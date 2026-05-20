export interface PhraseRule {
  pattern: RegExp;
  replacement: string;
}

export interface PhraseCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  rules: PhraseRule[];
}

export const AI_PHRASE_CATEGORIES: PhraseCategory[] = [
  // ===== Chinese Categories =====
  {
    id: 'cn-transitions',
    name: '过渡套话',
    nameEn: 'Transitions',
    description: '首先、其次、综合来看等过渡性表达',
    rules: [
      { pattern: /综合来看[，,。]?\s*/g, replacement: '' },
      { pattern: /综上所述[，,。]?\s*/g, replacement: '' },
      { pattern: /总的来说[，,。]?\s*/g, replacement: '' },
      { pattern: /总体而言[，,。]?\s*/g, replacement: '' },
      { pattern: /总体来[说看][，,。]?\s*/g, replacement: '' },
      { pattern: /整体而言[，,。]?\s*/g, replacement: '' },
      { pattern: /整体来[说看][，,。]?\s*/g, replacement: '' },
      { pattern: /(^|[。！？\n])首先[，,]?\s*/g, replacement: '$1' },
      { pattern: /(^|[。！？\n])其次[，,]?\s*/g, replacement: '$1' },
      { pattern: /(^|[。！？\n])再次[，,]?\s*/g, replacement: '$1' },
      { pattern: /(^|[。！？\n])最后[，,]?\s*/g, replacement: '$1' },
      { pattern: /(^|[。！？\n])[第其][一二三][，,、]\s*/g, replacement: '$1' },
    ],
  },
  {
    id: 'cn-hedging',
    name: '免责套话',
    nameEn: 'Hedging',
    description: '值得注意的是、不可否认等防御性表达',
    rules: [
      { pattern: /值得注意的是[，,。]?\s*/g, replacement: '' },
      { pattern: /需要指出的是[，,。]?\s*/g, replacement: '' },
      { pattern: /不可否认的是[，,。]?\s*/g, replacement: '' },
      { pattern: /众所周知[，,。]?\s*/g, replacement: '' },
      { pattern: /毋庸置疑[，,。]?\s*/g, replacement: '' },
      { pattern: /毫无疑问[，,。]?\s*/g, replacement: '' },
      { pattern: /需要强调的是[，,。]?\s*/g, replacement: '' },
      { pattern: /值得一提的是[，,。]?\s*/g, replacement: '' },
    ],
  },
  {
    id: 'cn-perspective',
    name: '视角套话',
    nameEn: 'Perspective',
    description: '从…角度来看、在…层面上等视角设定表达',
    rules: [
      { pattern: /(^|[。！？\n])从(?:技术|市场|宏观|微观|长期|短期|整体)(?:角度|方面|层面|来看|上说)[，,。，]?\s*/g, replacement: '$1' },
      { pattern: /(^|[。！？\n])从(?:技术|市场|宏观|微观|长期|短期|整体)层面上来说[，,。，]?\s*/g, replacement: '$1' },
    ],
  },
  {
    id: 'cn-filler',
    name: '填充套话',
    nameEn: 'Filler',
    description: '在一定程度上、换句话说等无实质内容的填充词',
    rules: [
      { pattern: /在此基础[上][，,。]?\s*/g, replacement: '' },
      { pattern: /在这种情况[下][，,。]?\s*/g, replacement: '' },
      { pattern: /在一定程度[上][，,。]?\s*/g, replacement: '' },
      { pattern: /在某种程度[上][，,。]?\s*/g, replacement: '' },
      { pattern: /因此我们可以[认为看][，,。]?\s*/g, replacement: '' },
      { pattern: /由此可见[，,。]?\s*/g, replacement: '' },
      { pattern: /换言之[，,。]?\s*/g, replacement: '' },
      { pattern: /换句话[说][，,。]?\s*/g, replacement: '' },
      { pattern: /也就[是][说][，,。]?\s*/g, replacement: '' },
      { pattern: /具体来[说看][，,。]?\s*/g, replacement: '' },
      { pattern: /具体而言[，,。]?\s*/g, replacement: '' },
      { pattern: /一般来[说看][，,。]?\s*/g, replacement: '' },
      { pattern: /通常情况下[，,。]?\s*/g, replacement: '' },
      { pattern: /从长期来[看说][，,。]?\s*/g, replacement: '' },
      { pattern: /从短期来[看说][，,。]?\s*/g, replacement: '' },
      { pattern: /大概率[，,。]?\s*/g, replacement: '' },
    ],
  },
  {
    id: 'cn-templates',
    name: '模板结尾',
    nameEn: 'Template Closings',
    description: '建议投资者、用户可关注等模板化结尾',
    rules: [
      { pattern: /建议投资者保持(?:谨慎乐观|积极)[的]?态度/g, replacement: '' },
      { pattern: /建议(?:投资者|用户)[，,]?\s*/g, replacement: '' },
      { pattern: /投资者可[以]?(?:关注|注意|参考)[，,]?\s*/g, replacement: '' },
    ],
  },
  {
    id: 'cn-redundant',
    name: '冗余总结',
    nameEn: 'Redundant Summary',
    description: '基于以上分析、综上所述等不必要的总结引导',
    rules: [
      { pattern: /基于以上分析[，,。]?\s*/g, replacement: '' },
      { pattern: /根据当前(?:情况|形势|市场|数据)[，,。，]?\s*/g, replacement: '' },
      { pattern: /结合(?:上述|以上)分析[，,。]?\s*/g, replacement: '' },
    ],
  },

  // ===== English Categories =====
  {
    id: 'en-transitions',
    name: 'English Transitions',
    nameEn: 'Transitions',
    description: '"First of all", "Secondly", "Last but not least" etc.',
    rules: [
      // Must come before generic "First" — more specific first
      { pattern: /(^|[。！？.!?]\s*)First\s+and\s+foremost[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)First\s+of\s+all[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)First(?:ly)?[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)Second(?:ly)?[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)Third(?:ly)?[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)Last\s+but\s+not\s+least[,\s]+/gi, replacement: '$1' },
    ],
  },
  {
    id: 'en-hedging',
    name: 'English Hedging',
    nameEn: 'Hedging',
    description: '"It is worth noting that", "Needless to say" etc.',
    rules: [
      { pattern: /It\s+is\s+worth\s+noting\s+that\s*/gi, replacement: '' },
      { pattern: /It\s+should\s+be\s+noted\s+that\s*/gi, replacement: '' },
      { pattern: /It\s+is\s+important\s+to\s+note\s+that\s*/gi, replacement: '' },
      { pattern: /It\s+goes\s+without\s+saying\s+that\s*/gi, replacement: '' },
      { pattern: /There\s+is\s+no\s+denying\s+that\s*/gi, replacement: '' },
      { pattern: /It\s+is\s+worth\s+mentioning\s+that\s*/gi, replacement: '' },
      { pattern: /Needless\s+to\s+say[,\s]+/gi, replacement: '' },
      { pattern: /It\s+is\s+widely\s+acknowledged\s+that\s*/gi, replacement: '' },
      { pattern: /It\s+is\s+commonly\s+believed\s+that\s*/gi, replacement: '' },
      { pattern: /It\s+is\s+clear\s+that\s*/gi, replacement: '' },
    ],
  },
  {
    id: 'en-perspective',
    name: 'English Perspective',
    nameEn: 'Perspective',
    description: '"From a technical perspective", "In my opinion" etc.',
    rules: [
      { pattern: /(^|[。！？.!?]\s*)From\s+a\s+(?:technical|market|practical|professional)\s+(?:perspective|standpoint|point\s+of\s+view)[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)In\s+my\s+opinion[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)From\s+my\s+(?:perspective|point\s+of\s+view)[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)When\s+it\s+comes\s+to\s+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)In\s+terms\s+of\s+/gi, replacement: '$1' },
    ],
  },
  {
    id: 'en-conclusion',
    name: 'English Conclusion',
    nameEn: 'Conclusion',
    description: '"In conclusion", "To sum up", "All things considered" etc.',
    rules: [
      { pattern: /(^|[。！？.!?]\s*)In\s+conclusion[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)To\s+sum\s+up[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)All\s+things\s+considered[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)All\s+in\s+all[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)In\s+summary[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)Based\s+on\s+(?:the\s+)?above\s+analysis[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)As\s+mentioned\s+above[,\s]+/gi, replacement: '$1' },
    ],
  },
  {
    id: 'en-filler',
    name: 'English Filler',
    nameEn: 'Filler',
    description: '"Generally speaking", "To a certain extent" etc.',
    rules: [
      { pattern: /(^|[。！？.!?]\s*)Generally\s+speaking[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)To\s+a\s+certain\s+extent[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)In\s+other\s+words[,\s]+/gi, replacement: '$1' },
      { pattern: /(^|[。！？.!?]\s*)That\s+is\s+to\s+say[,\s]+/gi, replacement: '$1' },
      { pattern: /More\s+importantly[,\s]+/gi, replacement: '' },
      { pattern: /Ultimately[,\s]+/gi, replacement: '' },
    ],
  },
];

function capitalizeSentences(text: string): string {
  return text
    .replace(/(^|[.!?]\s*)([a-z])/g, (_, pre, char) => pre + char.toUpperCase())
    .trim();
}

function cleanupText(text: string): string {
  return text
    .replace(/^[，,。.、\s]+/, '')
    .replace(/^[,.\s]+/, '')
    .replace(/[，,。.]{2,}/g, (m) => m[0])
    .replace(/[,.]{2,}/g, (m) => m[0])
    .replace(/[，,、]+\s*$/g, '')
    .replace(/[,]+\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function removeAIPhrases(
  text: string,
  enabledCategories?: Record<string, boolean>
): string {
  let categories = AI_PHRASE_CATEGORIES;

  if (enabledCategories) {
    categories = AI_PHRASE_CATEGORIES.filter((c) => enabledCategories[c.id] !== false);
  }

  let result = text;
  for (const category of categories) {
    for (const rule of category.rules) {
      result = result.replace(rule.pattern, rule.replacement);
    }
  }
  result = cleanupText(result);
  result = capitalizeSentences(result);
  return result;
}
