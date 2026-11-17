import { Router, Request, Response } from 'express';
import { catalogStore } from '../../data/catalog.store';
import { getCurrentUser } from '../../middleware/auth';

const router = Router();

router.post('/users/profiles', async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
  }

  if (user.profiles.length >= 5) {
    return res.status(400).json({ success: false, error: { message: 'Maximum 5 profiles allowed' } });
  }

  const newProfile = {
    id: `prof-${Date.now()}`,
    name: req.body.name || 'New Profile',
    avatarUrl: req.body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isKids: Boolean(req.body.isKids),
    language: 'English',
    maturityLimit: req.body.isKids ? ('PG' as const) : ('TV-MA' as const),
    autoplayNext: true,
    autoplayPreviews: true,
  };

  user.profiles.push(newProfile);
  catalogStore.saveUser(user);
  res.status(201).json({ success: true, data: newProfile, user });
});

router.post('/users/my-list/toggle', async (req: Request, res: Response) => {
  const { titleId } = req.body;
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
  }
  if (!titleId) return res.status(400).json({ success: false });

  const exists = user.myList.includes(titleId);
  user.myList = exists ? user.myList.filter((id) => id !== titleId) : [...user.myList, titleId];
  catalogStore.saveUser(user);

  res.json({ success: true, inList: !exists, myList: user.myList });
});

router.post('/users/rate', async (req: Request, res: Response) => {
  const { titleId, rating } = req.body;
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
  }
  if (!titleId) return res.status(400).json({ success: false });

  if (rating === 'like') {
    user.likedTitles = Array.from(new Set([...user.likedTitles, titleId]));
    user.dislikedTitles = user.dislikedTitles.filter((id) => id !== titleId);
  } else if (rating === 'dislike') {
    user.dislikedTitles = Array.from(new Set([...user.dislikedTitles, titleId]));
    user.likedTitles = user.likedTitles.filter((id) => id !== titleId);
  } else {
    user.likedTitles = user.likedTitles.filter((id) => id !== titleId);
    user.dislikedTitles = user.dislikedTitles.filter((id) => id !== titleId);
  }

  catalogStore.saveUser(user);
  res.json({ success: true, likedTitles: user.likedTitles, dislikedTitles: user.dislikedTitles });
});

export default router;
