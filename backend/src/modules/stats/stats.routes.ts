import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { parse } from '../../lib/validation.js';
import { getOverview, STATS_RANGES } from './stats.service.js';

const overviewQuery = z.object({
  range: z.enum(STATS_RANGES).default('12m'),
});

export const statsRouter = Router();

statsRouter.get('/overview', async (req: Request, res: Response) => {
  const { range } = parse(overviewQuery, req.query);
  res.json({ data: await getOverview(range) });
});
