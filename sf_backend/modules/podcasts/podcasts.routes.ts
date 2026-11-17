import { Router, Request, Response } from 'express';
import { catalogStore } from '../../data/catalog.store';

const router = Router();

router.get('/podcasts', (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const podcasts = catalogStore.getPodcasts(category);
    res.json({ success: true, count: podcasts.length, data: podcasts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/podcasts/upload', (req: Request, res: Response) => {
  try {
    const pod = catalogStore.addUploadedPodcast(req.body);
    res.status(201).json({ success: true, data: pod });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/podcasts/:id/play', (req: Request, res: Response) => {
  try {
    const playsCount = catalogStore.incrementPodcastPlay(req.params.id);
    res.json({ success: true, playsCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
