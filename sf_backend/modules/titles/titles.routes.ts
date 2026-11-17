import { Router, Request, Response } from 'express';
import { catalogStore } from '../../data/catalog.store';
import { tmdbService } from '../../integrations/tmdb.service';
import { tvmazeService } from '../../integrations/tvmaze.service';

const router = Router();

// Catalog listing, search & filters
router.get('/titles', async (req: Request, res: Response) => {
  try {
    const {
      type,
      genre,
      search,
      year,
      isTrending,
      isTop10,
      isNewRelease,
      profileKidsLimit,
      sortBy,
      limit,
    } = req.query;

    const titles = await catalogStore.getTitles({
      type: type as string,
      genre: genre as string,
      search: search as string,
      year: year ? (isNaN(Number(year)) ? (year as string) : Number(year)) : undefined,
      isTrending: isTrending === 'true',
      isTop10: isTop10 === 'true',
      isNewRelease: isNewRelease === 'true',
      profileKidsLimit: profileKidsLimit === 'true',
      sortBy: sortBy as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, count: titles.length, data: titles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/titles/billboard', async (_req: Request, res: Response) => {
  try {
    const billboard = await catalogStore.getBillboardTitle();
    res.json({ success: true, data: billboard });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/titles/:id', async (req: Request, res: Response) => {
  try {
    const title = await catalogStore.getTitleById(req.params.id);
    if (!title) {
      return res.status(404).json({ success: false, error: { message: 'Title not found' } });
    }
    res.json({ success: true, data: title });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/titles/:id/related', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const related = await catalogStore.getRelatedTitles(req.params.id, limit);
    res.json({ success: true, data: related });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/titles/upload', async (req: Request, res: Response) => {
  try {
    const movie = await catalogStore.addUploadedMovie(req.body);
    res.status(201).json({ success: true, data: movie });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// Direct TMDB endpoints
router.get('/tmdb/trending', async (req: Request, res: Response) => {
  try {
    const timeWindow = (req.query.timeWindow as 'day' | 'week') || 'week';
    const items = await tmdbService.getTrending(timeWindow);
    res.json({ success: true, count: items.length, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/tmdb/movie/:id', async (req: Request, res: Response) => {
  try {
    const movie = await tmdbService.getMovieDetails(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, error: { message: 'Movie not found on TMDB' } });
    }
    res.json({ success: true, data: movie });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/tmdb/tv/:id', async (req: Request, res: Response) => {
  try {
    const series = await tmdbService.getSeriesDetails(req.params.id);
    if (!series) {
      return res.status(404).json({ success: false, error: { message: 'TV series not found on TMDB' } });
    }
    res.json({ success: true, data: series });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/tmdb/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      return res.json({ success: true, count: 0, data: [] });
    }
    const results = await tmdbService.search(query);
    res.json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Direct TVMaze endpoints
router.get('/tvmaze/shows', async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 0;
    const shows = await tvmazeService.getPopularShows(page);
    res.json({ success: true, count: shows.length, data: shows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/tvmaze/shows/:id', async (req: Request, res: Response) => {
  try {
    const show = await tvmazeService.getShowDetails(req.params.id);
    if (!show) {
      return res.status(404).json({ success: false, error: { message: 'Show not found on TVMaze' } });
    }
    res.json({ success: true, data: show });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
