import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app.ts';
import { ensureCppEngineBuilt } from './server/services/cppBridge.ts';

export { createApp };

async function startServer(): Promise<void> {
  ensureCppEngineBuilt();
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.argv[1]?.endsWith('server.js'));

  if (!isProd) {
  // Development mode: Vite dev server

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
    // Security: Add Content Security Policy header for production
    app.use((req, res, next) => {
      // Restrict resources to the same origin
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'" );
      next();
    });
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Table & Tale server running on http://0.0.0.0:${PORT}`);
  });
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '');

if (
  isDirectExecution ||
  process.argv[1]?.endsWith('server.ts') ||
  process.argv[1]?.endsWith('server.js')
) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
