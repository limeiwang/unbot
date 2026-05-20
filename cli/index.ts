/**
 * wechat-optimize — CLI batch text optimizer
 *
 * Usage:
 *   echo "text" | npx tsx cli/index.ts
 *   npx tsx cli/index.ts -f input.txt
 *   npx tsx cli/index.ts -t "direct text"
 *   npx tsx cli/index.ts -f input.txt --json
 *   npx tsx cli/index.ts -f input.txt -c config.json
 */

import { readFileSync } from 'fs';
import { optimize, type OptimizationResult } from '../src/lib/optimizer';
import type { HumanizerConfig } from '../src/lib/humanizer/pipeline';

declare var __VERSION__: string | undefined;

// --- Helpers ---

function bold(s: string) { return `\x1b[1m${s}\x1b[22m`; }
function green(s: string) { return `\x1b[32m${s}\x1b[39m`; }
function dim(s: string) { return `\x1b[2m${s}\x1b[22m`; }
function red(s: string) { return `\x1b[31m${s}\x1b[39m`; }

function printUsage() {
  console.log(`
${bold('wechat-optimize')} — ${dim('让 AI 文本更像真人聊天')}

${bold('Usage:')}
  ${dim('# Pipe from another command (e.g. stock-monitor)')}
  echo "text" | npx tsx cli/index.ts

  ${dim('# Read from file')}
  npx tsx cli/index.ts -f input.txt

  ${dim('# Direct text argument')}
  npx tsx cli/index.ts -t "First of all, hello world."

  ${dim('# Custom configuration')}
  npx tsx cli/index.ts -f input.txt -c config.json

${bold('Options:')}
  -f, --file <path>      Read input from file
  -t, --text <text>      Direct text input
  -c, --config <path>    JSON config file for humanizer settings
  -o, --output <path>    Write result to file
  --json                 Output JSON with stats (machine-readable)
  --pretty               Colorized terminal output (default)
  -h, --help             Show this help
  -v, --version          Show version
`);
}

function printVersion() {
  const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.0.0-dev';
  console.log(`wechat-optimize v${version}`);
}

function formatResult(r: OptimizationResult, pretty: boolean): string {
  if (!pretty) {
    return `---\n${r.optimized}\n---\n📊 ${r.originalChars} chars → ${r.optimizedChars} chars (${Math.round((1 - r.optimizedChars / r.originalChars) * 100)}% reduction) · ${r.blocks.length} blocks\n`;
  }

  // Terminal: colorized summary
  const lines = [
    '',
    green('✓ Optimized:'),
    `  ${r.optimized}`,
    '',
    dim(`  ${r.originalChars} 字 → ${r.optimizedChars} 字 (${Math.round((1 - r.optimizedChars / r.originalChars) * 100)}%)`),
    dim(`  ${r.blocks.length} block(s)`),
    '',
  ];
  return lines.join('\n');
}

function readFromStdin(): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8').trim()));
  });
}

function parseArgs(): {
  help: boolean; version: boolean; file?: string; text?: string;
  config?: string; output?: string; json: boolean; pretty: boolean;
} {
  const args = process.argv.slice(2);
  const opts: ReturnType<typeof parseArgs> = {
    help: false, version: false, json: false, pretty: !process.stdout.isTTY,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-h': case '--help': opts.help = true; break;
      case '-v': case '--version': opts.version = true; break;
      case '-f': case '--file': opts.file = args[++i]; break;
      case '-t': case '--text': opts.text = args[++i]; break;
      case '-c': case '--config': opts.config = args[++i]; break;
      case '-o': case '--output': opts.output = args[++i]; break;
      case '--json': opts.json = true; break;
      case '--pretty': opts.pretty = true; break;
    }
  }
  return opts;
}

function loadConfig(path?: string): HumanizerConfig {
  if (!path) return {};
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as HumanizerConfig;
  } catch (e) {
    console.error(red(`Error: cannot read config file "${path}" — ${(e as Error).message}`));
    process.exit(1);
  }
}

// --- Main ---

async function main() {
  const opts = parseArgs();

  if (opts.help) { printUsage(); return; }
  if (opts.version) { printVersion(); return; }

  // Read input
  let input: string;
  if (opts.text) {
    input = opts.text;
  } else if (opts.file) {
    try {
      input = readFileSync(opts.file, 'utf-8').trim();
    } catch (e) {
      console.error(red(`Error: cannot read file "${opts.file}" — ${(e as Error).message}`));
      process.exit(1);
    }
  } else {
    if (process.stdin.isTTY) {
      printUsage();
      process.exit(0);
    }
    input = await readFromStdin();
  }

  if (!input) {
    console.error(red('Error: empty input'));
    process.exit(1);
  }

  // Load config
  const config = loadConfig(opts.config);

  // Optimize
  let result: OptimizationResult;
  try {
    result = optimize(input, config);
  } catch (e) {
    console.error(red(`Error: optimization failed — ${(e as Error).message}`));
    process.exit(1);
  }

  // Output
  if (opts.json) {
    const output = JSON.stringify({
      original: result.original,
      optimized: result.optimized,
      originalChars: result.originalChars,
      optimizedChars: result.optimizedChars,
      blocks: result.blocks,
      blockCount: result.blocks.length,
      reduction: result.originalChars > 0
        ? Math.round((1 - result.optimizedChars / result.originalChars) * 100)
        : 0,
    }, null, 2);

    if (opts.output) {
      writeFileSync(opts.output, output + '\n');
    } else {
      console.log(output);
    }
  } else {
    const output = formatResult(result, opts.pretty);
    if (opts.output) {
      writeFileSync(opts.output, result.optimized + '\n');
    } else {
      console.log(output);
    }
  }
}

// Dynamic import for writeFileSync in output mode
import { writeFileSync } from 'fs';

main().catch((e) => {
  console.error(red(`Unexpected error: ${e.message}`));
  process.exit(1);
});
