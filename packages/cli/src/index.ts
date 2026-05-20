#!/usr/bin/env node

import { readFileSync } from 'fs';
import { optimize } from '@unbot/core';
import type { HumanizerConfig } from '@unbot/core';

function bold(s: string) { return `\x1b[1m${s}\x1b[22m`; }
function green(s: string) { return `\x1b[32m${s}\x1b[39m`; }
function dim(s: string) { return `\x1b[2m${s}\x1b[22m`; }
function red(s: string) { return `\x1b[31m${s}\x1b[39m`; }

function printUsage() {
  console.log(`
${bold('unbot')} — ${dim('让 AI 文本更像真人聊天')}

${bold('Usage:')}
  ${dim('# Pipe from another command')}
  echo "text" | unbot

  ${dim('# Read from file')}
  unbot -f input.txt

  ${dim('# Direct text argument')}
  unbot -t "First of all, hello world."

  ${dim('# Custom configuration')}
  unbot -f input.txt -c config.json

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

function formatResult(r: ReturnType<typeof optimize>, pretty: boolean): string {
  if (!pretty) {
    return `---\n${r.optimized}\n---\n📊 ${r.originalChars} chars → ${r.optimizedChars} chars (${Math.round((1 - r.optimizedChars / r.originalChars) * 100)}% reduction) · ${r.blocks.length} blocks\n`;
  }

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

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: {
    help: boolean; version: boolean; file?: string; text?: string;
    config?: string; output?: string; json: boolean; pretty: boolean;
  } = { help: false, version: false, json: false, pretty: process.stdout.isTTY };

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
  return JSON.parse(readFileSync(path, 'utf-8')) as HumanizerConfig;
}

async function main() {
  const opts = parseArgs();

  if (opts.help) { printUsage(); return; }
  if (opts.version) { console.log('unbot v0.1.1'); return; }

  let input: string;
  if (opts.text) {
    input = opts.text;
  } else if (opts.file) {
    input = readFileSync(opts.file, 'utf-8').trim();
  } else {
    if (process.stdin.isTTY) { printUsage(); process.exit(0); }
    input = await readFromStdin();
  }

  if (!input) { console.error(red('Error: empty input')); process.exit(1); }

  const config = loadConfig(opts.config);
  const result = optimize(input, config);

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

import { writeFileSync } from 'fs';
main().catch((e) => { console.error(red(`Error: ${e.message}`)); process.exit(1); });
