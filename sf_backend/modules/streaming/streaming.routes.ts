import { Router, Request, Response } from 'express';
import { catalogStore } from '../../data/catalog.store';
import { getCurrentUser } from '../../middleware/auth';

const router = Router();

router.put('/stream/progress', async (req: Request, res: Response) => {
  const { titleId, progressPercent, seconds, totalSeconds, episodeId } = req.body;
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
  }
  if (titleId) {
    catalogStore.updateWatchProgress(user.id, titleId, progressPercent, seconds, totalSeconds, episodeId);
  }
  return res.json({ success: true });
});

export default router;
