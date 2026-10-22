import express from 'express';
import { createApp } from './dist/app.js';
import { connectDatabase } from './dist/config/db.js';

let connection;

function ensureDatabase(_req, res, next) {
  connection ??= connectDatabase().catch((error) => {
    connection = undefined;
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
