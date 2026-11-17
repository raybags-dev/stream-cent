export interface StreamingSource {
  sourceId: number;
  name: string;
  type: 'sub' | 'buy' | 'rent' | 'free';
  region: string;
  iosUrl?: string;
  androidUrl?: string;
  webUrl?: string;
  format?: string;
  price?: number;
}

export class WatchmodeService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.WATCHMODE_API_TOKEN || '';
    this.baseUrl = process.env.WATCHMODE_BASE_URL || 'https://api.watchmode.com/v1';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async getSources(watchmodeTitleId: number | string): Promise<StreamingSource[]> {
    if (!this.isConfigured()) {
      return [
        {
          sourceId: 203,
          name: 'Stream Flix',
          type: 'sub',
          region: 'US',
          format: '4K Ultra HD',
          webUrl: 'https://streamflix.local',
        },
      ];
    }

    try {
      const url = `${this.baseUrl}/title/${watchmodeTitleId}/sources/?apiKey=${this.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((s: any) => ({
        sourceId: s.source_id,
        name: s.name,
        type: s.type,
        region: s.region,
        iosUrl: s.ios_url,
        androidUrl: s.android_url,
        webUrl: s.web_url,
        format: s.format,
        price: s.price,
      }));
    } catch (err) {
      console.error('[Watchmode API] Error fetching sources:', err);
      return [];
    }
  }

  async searchTitle(query: string): Promise<any | null> {
    if (!this.isConfigured()) return null;
    try {
      const url = `${this.baseUrl}/autocomplete-search/?apiKey=${this.apiKey}&search_value=${encodeURIComponent(
        query
      )}&search_type=1`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return data.results?.[0] || null;
    } catch (err) {
      console.error('[Watchmode API] Error searching title:', err);
      return null;
    }
  }
}

export const watchmodeService = new WatchmodeService();
