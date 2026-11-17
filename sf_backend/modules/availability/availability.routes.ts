import { Router, Request, Response } from 'express';
import { watchmodeService } from '../../integrations/watchmode.service';
import { movieOfTheNightService } from '../../integrations/movieofthenight.service';
import { getEnvConfig } from '../../config/env';

const router = Router();

router.get('/availability/:titleId', async (req: Request, res: Response) => {
  try {
    const { defaultCountry } = getEnvConfig();
    const country = (req.query.country as string) || defaultCountry;
    const [watchmodeSources, motnAvailability] = await Promise.all([
      watchmodeService.getSources(req.params.titleId),
      movieOfTheNightService.getAvailability(req.params.titleId, country),
    ]);

    res.json({
      success: true,
      data: {
        titleId: req.params.titleId,
        country,
        watchmodeSources,
        movieOfTheNight: motnAvailability,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
