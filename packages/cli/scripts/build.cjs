const esbuild = require('esbuild');

esbuild.build({
  entryPoints: [__dirname + '/../src/index.ts'],
  outfile: __dirname + '/../dist/cli.cjs',
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['fs', 'path', 'os', '@unbot/core'],
  banner: { js: '#!/usr/bin/env node' },
  minifyWhitespace: true,
}).then(() => {
  console.log('✅ Built packages/cli/dist/cli.cjs');
}).catch((err) => {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
});
