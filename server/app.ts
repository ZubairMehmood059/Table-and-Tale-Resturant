import express from 'express';
import { managementRoutes } from './routes/managementRoutes.ts';
import { restaurantRoutes } from './routes/restaurantRoutes.ts';

export function createApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use(['/api', '/.netlify/functions/api'], restaurantRoutes);
  app.use(['/api/management', '/.netlify/functions/api/management'], managementRoutes);

  return app;
}
