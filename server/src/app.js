// Montimi i aplikacionit Express: siguri (helmet, CORS, rate limiting),
// JSON parsing, rrugët e API-se dhe trajtimi i gabimeve.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiRouter } from './routes/index.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors()); // ne produksion: kufizo "origin" te domeni zyrtar
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', globalLimiter, apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
