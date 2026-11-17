export interface AvailabilityResult {
  country: string;
  streamingServices: Array<{
    service: string;
    type: string;
    quality: string;
    link: string;
  }>;
}

export class MovieOfTheNightService {
  private apiToken: string;
  private baseUrl: string;
  private defaultCountry: string;

  constructor() {
    this.apiToken = process.env.MOVIEOFTHENIGHT_API_TOKEN || '';
    this.baseUrl =
      process.env.MOVIEOFTHENIGHT_BASE_URL ||
      'https://streaming-availability.p.rapidapi.com/v4';
    this.defaultCountry = process.env.AVAILABILITY_DEFAULT_COUNTRY || 'nl';
  }

  isConfigured(): boolean {
    return Boolean(this.apiToken);
  }

  async getAvailability(
    imdbIdOrTmdbId: string,
    country = this.defaultCountry
  ): Promise<AvailabilityResult | null> {
    if (!this.isConfigured()) {
      return {
        country,
        streamingServices: [
          {
            service: 'Stream Flix',
            type: 'subscription',
            quality: '4K Ultra HD',
            link: 'https://streamflix.local',
          },
        ],
      };
    }

    try {
      const url = `${this.baseUrl}/shows/${imdbIdOrTmdbId}?country=${country}`;
      const res = await fetch(url, {
        headers: {
          'x-rapidapi-key': this.apiToken,
          'x-rapidapi-host': 'streaming-availability.p.rapidapi.com',
          Accept: 'application/json',
        },
      });

      if (!res.ok) return null;
      const data = await res.json();
      const streamingOptions = data?.streamingOptions?.[country] || [];

      return {
        country,
        streamingServices: streamingOptions.map((opt: any) => ({
          service: opt.service?.name || 'Streaming Provider',
          type: opt.type || 'subscription',
          quality: opt.quality || 'HD',
          link: opt.link || '',
        })),
      };
    } catch (err) {
      console.error('[MovieOfTheNight API] Error fetching availability:', err);
      return null;
    }
  }
}

export const movieOfTheNightService = new MovieOfTheNightService();
