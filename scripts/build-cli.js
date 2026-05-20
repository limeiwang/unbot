/**
 * Build standalone CLI bundle via esbuild.
 * Output: cli/dist/wechat-optimize.js — single file, zero deps.
 */
const esbuild = require('esbuild');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const pkg = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = pkg.version;

esbuild.build({
  entryPoints: [path.join(__dirname, '..', 'cli/index.ts')],
  outfile: path.join(__dirname, '..', 'cli/dist/wechat-optimize.js'),
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['fs', 'path', 'os'],
  define: {
    __VERSION__: `"${VERSION}"`,
  },
  banner: {
    js: '#!/usr/bin/env node',
  },
  mainFields: ['module', 'main'],
  sourcemap: false,
  minifyWhitespace: true,
  minifyIdentifiers: false,
}).then(() => {
  const outPath = path.join(__dirname, '..', 'cli/dist/wechat-optimize.js');
  const stats = readFileSync(outPath, 'utf-8');
  console.log(`✅ Built cli/dist/wechat-optimize.js (${(stats.length / 1024).toFixed(0)} KB)`);
}).catch((err) => {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
});
