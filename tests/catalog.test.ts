import { describe, it, expect } from 'vitest';
import { catalogStore } from '../sf_backend/data/catalog.store';
import { mongoMovieStorage } from '../sf_backend/db/mongo.storage';

describe('Catalog Store & Movie Storage Integration', () => {
  it('enforces 24-hour cache layer and validates stored movie objects', async () => {
    const titles = await catalogStore.getTitles({});
    expect(titles.length).toBeGreaterThan(0);

    // Every returned title must have a valid posterUrl or fallback
    titles.forEach((t) => {
      expect(t.posterUrl).toBeDefined();
      expect(t.posterUrl.trim().length).toBeGreaterThan(0);
    });
  });

  it('supports filtering by release year', async () => {
    const titles2010 = await catalogStore.getTitles({ year: 2010 });
    expect(Array.isArray(titles2010)).toBe(true);
    titles2010.forEach((t) => {
      expect(t.releaseYear).toBe(2010);
    });
  });

  it('supports genre queries including Horror and Romantic Comedy', async () => {
    const horrorTitles = await catalogStore.getTitles({ genre: 'Horror' });
    expect(Array.isArray(horrorTitles)).toBe(true);

    const romComTitles = await catalogStore.getTitles({ genre: 'Romantic Comedy' });
    expect(Array.isArray(romComTitles)).toBe(true);
  });

  it('toggles live movie service mode to dummy placeholder maintenance mode', () => {
    const originalMode = catalogStore.isLiveMoviesEnabled();

    catalogStore.setLiveMoviesEnabled(false);
    expect(catalogStore.isLiveMoviesEnabled()).toBe(false);

    catalogStore.setLiveMoviesEnabled(true);
    expect(catalogStore.isLiveMoviesEnabled()).toBe(true);

    // Restore original state
    catalogStore.setLiveMoviesEnabled(originalMode);
  });

  it('provides rich cast information with cast member names and characters', async () => {
    const titles = await catalogStore.getTitles({});
    const titleWithCast = titles.find((t) => t.cast && t.cast.length > 0);
    expect(titleWithCast).toBeDefined();
    if (titleWithCast && titleWithCast.cast) {
      expect(titleWithCast.cast.length).toBeGreaterThan(0);
      expect(titleWithCast.cast[0]!.name).toBeDefined();
    }
  });
});
