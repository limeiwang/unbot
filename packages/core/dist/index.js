// src/parser/semantic-parser.ts
function detectBlockType(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (/^[-_*]{3,}$/.test(trimmed)) {
    return { type: "divider", content: "" };
  }
  const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
  if (headingMatch) {
    return {
      type: "heading",
      content: headingMatch[2].trim(),
      level: headingMatch[1].length
    };
  }
  const boldHeadingMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
  if (boldHeadingMatch) {
    return { type: "heading", content: boldHeadingMatch[1].trim(), level: 2 };
  }
  if (/^[⚠️‼]/.test(trimmed) || /^(注意|警告|警惕|温馨提示)[：:：\s]/.test(trimmed) || /风险提示/.test(trimmed) || /需要警惕/.test(trimmed) || /^.*(?:风险|注意|警惕).*[：:]$/.test(trimmed)) {
    const cleaned = trimmed.replace(/^[⚠️‼]\s*/, "").trim();
    return { type: "warning", content: cleaned };
  }
  if (/^(总结|综上|综上所述|总而言之|写在最后)[：:：\s]?$/.test(trimmed)) {
    return { type: "conclusion", content: trimmed };
  }
  if (/^[-*]\s+(.+)/.test(trimmed)) {
    return { type: "list-item", content: trimmed.replace(/^[-*]\s+/, "").trim() };
  }
  if (/^\d+[.、]\s+(.+)/.test(trimmed)) {
    return { type: "list-item", content: trimmed.replace(/^\d+[.、]\s+/, "").trim() };
  }
  return { type: "paragraph", content: trimmed };
}
function parseSemantic(raw) {
  const lines = raw.split("\n");
  const blocks = [];
  let lastWasEmpty = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      lastWasEmpty = true;
      continue;
    }
    const detected = detectBlockType(line);
    if (!detected) {
      lastWasEmpty = false;
      continue;
    }
    const { type, content, level } = detected;
    if (type === "paragraph" && !lastWasEmpty && blocks.length > 0) {
      const last = blocks[blocks.length - 1];
      if (last.type === "paragraph") {
        last.content += "\n" + content;
        continue;
      }
    }
    blocks.push({ type, content: content || "", ...level ? { level } : {} });
    lastWasEmpty = false;
  }
  return {
    version: 1,
    blocks,
    metadata: {
      original: raw,
      inputChars: raw.length,
      outputChars: 0
    }
  };
}

// src/humanizer/categories.ts
var AI_PHRASE_CATEGORIES = [
  // ===== Chinese Categories =====
  {
    id: "cn-hedging",
    name: "\u514D\u8D23\u5957\u8BDD",
    nameEn: "Hedging",
    description: "\u503C\u5F97\u6CE8\u610F\u7684\u662F\u3001\u4E0D\u53EF\u5426\u8BA4\u7B49\u9632\u5FA1\u6027\u8868\u8FBE",
    rules: [
      { pattern: /值得注意的是[，,。]?\s*/g, replacement: "" },
      { pattern: /需要指出的是[，,。]?\s*/g, replacement: "" },
      { pattern: /不可否认的是[，,。]?\s*/g, replacement: "" },
      { pattern: /众所周知[，,。]?\s*/g, replacement: "" },
      { pattern: /毋庸置疑[，,。]?\s*/g, replacement: "" },
      { pattern: /毫无疑问[，,。]?\s*/g, replacement: "" },
      { pattern: /需要强调的是[，,。]?\s*/g, replacement: "" },
      { pattern: /值得一提的是[，,。]?\s*/g, replacement: "" }
    ]
  },
  {
    id: "cn-redundant",
    name: "\u5197\u4F59\u603B\u7ED3",
    nameEn: "Redundant Summary",
    description: "\u57FA\u4E8E\u4EE5\u4E0A\u5206\u6790\u3001\u7EFC\u4E0A\u6240\u8FF0\u7B49\u4E0D\u5FC5\u8981\u7684\u603B\u7ED3\u5F15\u5BFC",
    rules: [
      { pattern: /基于以上分析[，,。]?\s*/g, replacement: "" },
      { pattern: /根据当前(?:情况|形势|市场|数据)[，,。，]?\s*/g, replacement: "" },
      { pattern: /结合(?:上述|以上)分析[，,。]?\s*/g, replacement: "" }
    ]
  },
  {
    id: "cn-transitions",
    name: "\u8FC7\u6E21\u5957\u8BDD",
    nameEn: "Transitions",
    description: "\u9996\u5148\u3001\u5176\u6B21\u3001\u7EFC\u5408\u6765\u770B\u7B49\u8FC7\u6E21\u6027\u8868\u8FBE",
    rules: [
      { pattern: /综合来看[，,。]?\s*/g, replacement: "" },
      { pattern: /综上所述[，,。]?\s*/g, replacement: "" },
      { pattern: /总的来说[，,。]?\s*/g, replacement: "" },
      { pattern: /总体而言[，,。]?\s*/g, replacement: "" },
      { pattern: /总体来[说看][，,。]?\s*/g, replacement: "" },
      { pattern: /整体而言[，,。]?\s*/g, replacement: "" },
      { pattern: /整体来[说看][，,。]?\s*/g, replacement: "" },
      { pattern: /(^|[。！？\n])首先[，,]?\s*/g, replacement: "$1" },
      { pattern: /(^|[。！？\n])其次[，,]?\s*/g, replacement: "$1" },
      { pattern: /(^|[。！？\n])再次[，,]?\s*/g, replacement: "$1" },
      { pattern: /(^|[。！？\n])最后[，,]?\s*/g, replacement: "$1" },
      { pattern: /(^|[。！？\n])[第其][一二三][，,、]\s*/g, replacement: "$1" }
    ]
  },
  {
    id: "cn-perspective",
    name: "\u89C6\u89D2\u5957\u8BDD",
    nameEn: "Perspective",
    description: "\u4ECE\u2026\u89D2\u5EA6\u6765\u770B\u3001\u5728\u2026\u5C42\u9762\u4E0A\u7B49\u89C6\u89D2\u8BBE\u5B9A\u8868\u8FBE",
    rules: [
      { pattern: /(^|[。！？\n])从(?:技术|市场|宏观|微观|长期|短期|整体)(?:角度|方面|层面|来看|上说)[，,。，]?\s*/g, replacement: "$1" },
      { pattern: /(^|[。！？\n])从(?:技术|市场|宏观|微观|长期|短期|整体)层面上来说[，,。，]?\s*/g, replacement: "$1" }
    ]
  },
  {
    id: "cn-filler",
    name: "\u586B\u5145\u5957\u8BDD",
    nameEn: "Filler",
    description: "\u5728\u4E00\u5B9A\u7A0B\u5EA6\u4E0A\u3001\u6362\u53E5\u8BDD\u8BF4\u7B49\u65E0\u5B9E\u8D28\u5185\u5BB9\u7684\u586B\u5145\u8BCD",
    rules: [
      { pattern: /在此基础[上][，,。]?\s*/g, replacement: "" },
      { pattern: /在这种情况[下][，,。]?\s*/g, replacement: "" },
      { pattern: /在一定程度[上][，,。]?\s*/g, replacement: "" },
      { pattern: /在某种程度[上][，,。]?\s*/g, replacement: "" },
      { pattern: /因此我们可以[认为看][，,。]?\s*/g, replacement: "" },
      { pattern: /由此可见[，,。]?\s*/g, replacement: "" },
      { pattern: /换言之[，,。]?\s*/g, replacement: "" },
      { pattern: /换句话[说][，,。]?\s*/g, replacement: "" },
      { pattern: /也就[是][说][，,。]?\s*/g, replacement: "" },
      { pattern: /具体来[说看][，,。]?\s*/g, replacement: "" },
      { pattern: /具体而言[，,。]?\s*/g, replacement: "" },
      { pattern: /一般来[说看][，,。]?\s*/g, replacement: "" },
      { pattern: /通常情况下[，,。]?\s*/g, replacement: "" },
      { pattern: /从长期来[看说][，,。]?\s*/g, replacement: "" },
      { pattern: /从短期来[看说][，,。]?\s*/g, replacement: "" },
      { pattern: /大概率[，,。]?\s*/g, replacement: "" }
    ]
  },
  {
    id: "cn-templates",
    name: "\u6A21\u677F\u7ED3\u5C3E",
    nameEn: "Template Closings",
    description: "\u5EFA\u8BAE\u6295\u8D44\u8005\u3001\u7528\u6237\u53EF\u5173\u6CE8\u7B49\u6A21\u677F\u5316\u7ED3\u5C3E",
    rules: [
      { pattern: /建议投资者保持(?:谨慎乐观|积极)[的]?态度/g, replacement: "" },
      { pattern: /建议(?:投资者|用户)[，,]?\s*/g, replacement: "" },
      { pattern: /投资者可[以]?(?:关注|注意|参考)[，,]?\s*/g, replacement: "" }
    ]
  },
  // ===== English Categories =====
  {
    id: "en-hedging",
    name: "English Hedging",
    nameEn: "Hedging",
    description: '"It is worth noting that", "Needless to say" etc.',
    rules: [
      { pattern: /It\s+is\s+worth\s+noting\s+that\s*/gi, replacement: "" },
      { pattern: /It\s+should\s+be\s+noted\s+that\s*/gi, replacement: "" },
      { pattern: /It\s+is\s+important\s+to\s+note\s+that\s*/gi, replacement: "" },
      { pattern: /It\s+goes\s+without\s+saying\s+that\s*/gi, replacement: "" },
      { pattern: /There\s+is\s+no\s+denying\s+that\s*/gi, replacement: "" },
      { pattern: /It\s+is\s+worth\s+mentioning\s+that\s*/gi, replacement: "" },
      { pattern: /Needless\s+to\s+say[,\s]+/gi, replacement: "" },
      { pattern: /It\s+is\s+widely\s+acknowledged\s+that\s*/gi, replacement: "" },
      { pattern: /It\s+is\s+commonly\s+believed\s+that\s*/gi, replacement: "" },
      { pattern: /It\s+is\s+clear\s+that\s*/gi, replacement: "" }
    ]
  },
  {
    id: "en-conclusion",
    name: "English Conclusion",
    nameEn: "Conclusion",
    description: '"In conclusion", "To sum up", "All things considered" etc.',
    rules: [
      { pattern: /(^|[。！？.!?]\s*)In\s+conclusion[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)To\s+sum\s+up[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)All\s+things\s+considered[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)All\s+in\s+all[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)In\s+summary[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)Based\s+on\s+(?:the\s+)?above\s+analysis[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)As\s+mentioned\s+above[,\s]+/gi, replacement: "$1" }
    ]
  },
  {
    id: "en-transitions",
    name: "English Transitions",
    nameEn: "Transitions",
    description: '"First of all", "Secondly", "Last but not least" etc.',
    rules: [
      { pattern: /(^|[。！？.!?]\s*)First\s+and\s+foremost[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)First\s+of\s+all[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)First(?:ly)?[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)Second(?:ly)?[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)Third(?:ly)?[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)Last\s+but\s+not\s+least[,\s]+/gi, replacement: "$1" }
    ]
  },
  {
    id: "en-perspective",
    name: "English Perspective",
    nameEn: "Perspective",
    description: '"From a technical perspective", "In my opinion" etc.',
    rules: [
      { pattern: /(^|[。！？.!?]\s*)From\s+a\s+(?:technical|market|practical|professional)\s+(?:perspective|standpoint|point\s+of\s+view)[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)In\s+my\s+opinion[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)From\s+my\s+(?:perspective|point\s+of\s+view)[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)When\s+it\s+comes\s+to\s+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)In\s+terms\s+of\s+/gi, replacement: "$1" }
    ]
  },
  {
    id: "en-filler",
    name: "English Filler",
    nameEn: "Filler",
    description: '"Generally speaking", "To a certain extent" etc.',
    rules: [
      { pattern: /(^|[。！？.!?]\s*)Generally\s+speaking[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)To\s+a\s+certain\s+extent[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)In\s+other\s+words[,\s]+/gi, replacement: "$1" },
      { pattern: /(^|[。！？.!?]\s*)That\s+is\s+to\s+say[,\s]+/gi, replacement: "$1" },
      { pattern: /More\s+importantly[,\s]+/gi, replacement: "" },
      { pattern: /Ultimately[,\s]+/gi, replacement: "" }
    ]
  }
];
function capitalizeSentences(text) {
  return text.replace(/(^|[.!?]\s*)([a-z])/g, (_, pre, char) => pre + char.toUpperCase()).trim();
}
function cleanupText(text) {
  return text.replace(/^[，,。.、\s]+/, "").replace(/^[,.\s]+/, "").replace(/[，,。.]{2,}/g, (m) => m[0]).replace(/[,.]{2,}/g, (m) => m[0]).replace(/[，,、]+\s*$/g, "").replace(/[,]+\s*$/g, "").replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function removeAIPhrases(text, enabledCategories) {
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

// src/humanizer/shortener.ts
function splitLongString(text, maxChars) {
  const segments = [];
  const sentences = text.split(/(?<=[。！？！?!?.])/).filter(Boolean);
  for (const sentence of sentences) {
    if (sentence.length <= maxChars) {
      segments.push(sentence.trim());
      continue;
    }
    const clauses = sentence.split(/(?<=[，；、,;])/).filter(Boolean);
    let buffer = "";
    for (const clause of clauses) {
      if ((buffer + clause).length <= maxChars) {
        buffer += clause;
      } else {
        if (buffer) segments.push(buffer.trim());
        buffer = clause;
      }
    }
    if (buffer) segments.push(buffer.trim());
  }
  return segments;
}
function shortenContent(content, config) {
  const maxChars = config?.maxCharsPerSegment ?? 35;
  const maxLines = config?.maxLines ?? 3;
  const segments = splitLongString(content, maxChars);
  return segments.slice(0, maxLines).join("\n");
}

// src/humanizer/pipeline.ts
var RemoveAIFlavourStage = class {
  constructor(config) {
    this.config = config;
    this.name = "remove-ai-flavour";
  }
  process(blocks) {
    return blocks.map((block) => ({
      ...block,
      content: removeAIPhrases(block.content, this.config?.enabledCategories)
    })).filter((block) => block.content.length > 0);
  }
};
var ShortenStage = class {
  constructor(config) {
    this.config = config;
    this.name = "shorten";
  }
  process(blocks) {
    return blocks.map((block) => ({
      ...block,
      content: shortenContent(block.content, this.config?.shortener)
    }));
  }
};
var HumanizerPipeline = class {
  constructor(config) {
    this.stages = [];
    this.stages = [
      new RemoveAIFlavourStage(config),
      new ShortenStage(config)
    ];
  }
  process(doc) {
    let blocks = doc.blocks;
    for (const stage of this.stages) {
      blocks = stage.process(blocks);
    }
    return { ...doc, blocks };
  }
};

// src/renderers/chat.ts
function cleanMarkdown(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/_(.+?)_/g, "$1").replace(/`{1,3}(.+?)`{1,3}/g, "$1").replace(/```[\s\S]*?```/g, "").replace(/\[(.+?)\]\(.+?\)/g, "$1").trim();
}
function renderBlock(block) {
  const content = cleanMarkdown(block.content);
  if (block.type === "divider") return "\xB7 \xB7 \xB7";
  if (!content) return "";
  switch (block.type) {
    case "heading":
      return `\u3010${content}\u3011`;
    case "warning":
      return `\u26A0\uFE0F ${content}`;
    case "conclusion":
      return `\u3010${content.replace(/[：:：\s]+$/, "")}\u3011`;
    case "list-item":
      return `\u2192 ${content}`;
    case "paragraph":
    default:
      return content;
  }
}
var ChatRenderer = class {
  render(doc) {
    return doc.blocks.map((block) => renderBlock(block)).filter(Boolean).join("\n\n");
  }
};

// src/optimizer.ts
function optimize(rawText, config) {
  const doc = parseSemantic(rawText);
  const pipeline = new HumanizerPipeline(config);
  const humanizedDoc = pipeline.process(doc);
  const renderer = new ChatRenderer();
  const optimized = renderer.render(humanizedDoc);
  return {
    original: rawText,
    optimized,
    originalChars: rawText.length,
    optimizedChars: optimized.length,
    blocks: humanizedDoc.blocks
  };
}
export {
  AI_PHRASE_CATEGORIES,
  ChatRenderer,
  HumanizerPipeline,
  optimize,
  parseSemantic,
  removeAIPhrases,
  shortenContent
};
