import { spawnSync } from 'child_process';
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

async function run() {
  const rootDir = process.cwd();
  console.log('[1/2] Building client with Vite...');

  const viteBin = path.resolve(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const result = spawnSync(process.execPath, [viteBin, 'build'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' },
  });

  const distHtml = path.resolve(rootDir, 'dist', 'index.html');
  if (!fs.existsSync(distHtml)) {
    console.error('Client build failed: dist/index.html not found.');
    process.exit(result.status || 1);
  }

  console.log('[2/2] Bundling server with esbuild...');
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    packages: 'external',
    format: 'esm',
    outfile: 'server.js',
  });

  console.log('Build completed successfully.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
