import { Router, Request, Response } from 'express';
import { catalogStore } from '../../data/catalog.store';

const router = Router();

router.get('/billing/plans', (_req: Request, res: Response) => {
  res.json({ success: true, data: catalogStore.getPlans() });
});

export default router;
