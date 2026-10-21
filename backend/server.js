/**
 * Vercel entry point. Vercel's zero-config Express support looks for a root `server.js` that
 * imports `express` and default-exports an app. It imports the compiled output in `dist/`
 * (Vercel runs `npm run build` first), so type-checking stays with our own `tsc` settings.
 *
 * Each instance serves many requests (Fluid Compute), so the database connection is opened
 * once and reused. Local development and Docker use `src/index.ts` instead.
 */
import express from 'express';
import { createApp } from './dist/app.js';
import { connectDatabase } from './dist/config/db.js';

let connection;

function ensureDatabase(_req, res, next) {
  connection ??= connectDatabase().catch((error) => {
    connection = undefined; // retry on the next request instead of caching the failure
    throw error;
  });
  connection.then(
    () => next(),
    (error) => {
      console.error('Database connection failed', error);
      res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database unavailable' } });
    },
  );
}

const app = express();
app.disable('x-powered-by');
app.use(ensureDatabase);
app.use(createApp());

export default app;
