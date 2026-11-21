import express from 'express';
import { managementRoutes } from './routes/managementRoutes.ts';
import { restaurantRoutes } from './routes/restaurantRoutes.ts';

import helmet from 'helmet';

export function createApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', restaurantRoutes);
  app.use('/api/management', managementRoutes);

  return app;
}
