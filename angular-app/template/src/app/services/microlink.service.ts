import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MicrolinkData {
  url: string;
  title?: string;
  description?: string;
  image?: {
    url: string;
    width?: number;
    height?: number;
  };
  logo?: {
    url: string;
    width?: number;
    height?: number;
  };
  screenshot?: {
    url: string;
    width?: number;
    height?: number;
  };
  author?: string;
  publisher?: string;
  date?: string;
  lang?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MicrolinkService {
  // Using Microlink API for metadata and screenshots with LinkPreview fallback
  private readonly MICROLINK_API_URL = 'https://api.microlink.io';
  private readonly LINKPREVIEW_API_URL = 'https://api.linkpreview.net';
  private readonly API_KEY = environment.microlinkApiKey;

  constructor(private http: HttpClient) {}

  /**
   * Fetch metadata and screenshot for a given URL with fallback and caching
   */
  getUrlMetadata(url: string, forceRefresh: boolean = false): Observable<MicrolinkData> {
    console.log('MicrolinkService: Fetching metadata for:', url, 'forceRefresh:', forceRefresh);
    
    // Check cache first (only if not forcing refresh)
    if (!forceRefresh) {
      const cached = this.getCachedMetadata(url);
      if (cached) {
        console.log('MicrolinkService: Using cached metadata for:', url);
        return of(cached);
      }
    } else {
      console.log('MicrolinkService: Force refresh requested, bypassing cache for:', url);
    }
    
    // Try Microlink API first (with screenshot)
    return this.getMicrolinkMetadata(url).pipe(
      catchError(error => {
        console.warn('Microlink API failed, falling back to LinkPreview:', error);
        // Fallback to LinkPreview API
        return this.getLinkPreviewMetadata(url);
      }),
      catchError(error => {
        console.error('Both APIs failed, using fallback metadata:', error);
        // Final fallback
        return of(this.getFallbackMetadata(url));
      }),
      map(metadata => {
        // Cache the result
        this.cacheMetadata(url, metadata);
        return metadata;
      })
    );
  }

  /**
   * Fetch metadata and screenshot from Microlink API
   */
  private getMicrolinkMetadata(url: string): Observable<MicrolinkData> {
    const params = new HttpParams()
      .set('url', url)
      .set('screenshot', 'true');

    return this.http.get<MicrolinkData>(this.MICROLINK_API_URL, { params }).pipe(
      map(response => {
        console.log('MicrolinkService: Microlink API response:', response);
        const transformed = this.transformMicrolinkResponse(response);
        console.log('MicrolinkService: Transformed Microlink data:', transformed);
        return transformed;
      })
    );
  }

  /**
   * Fetch metadata from LinkPreview API (fallback)
   */
  private getLinkPreviewMetadata(url: string): Observable<MicrolinkData> {
    const params = new HttpParams()
      .set('key', this.API_KEY)
      .set('q', url);

    return this.http.get<MicrolinkData>(this.LINKPREVIEW_API_URL, { params }).pipe(
      map(response => {
        console.log('MicrolinkService: LinkPreview API response:', response);
        const transformed = this.transformLinkPreviewResponse(response);
        console.log('MicrolinkService: Transformed LinkPreview data:', transformed);
        return transformed;
      })
    );
  }

  /**
   * Transform Microlink API response to our format
   */
  private transformMicrolinkResponse(response: any): MicrolinkData {
    return {
      url: response.data?.url || response.url,
      title: response.data?.title || response.title,
      description: response.data?.description || response.description,
      image: response.data?.image?.url ? { 
        url: response.data.image.url,
        width: response.data.image.width,
        height: response.data.image.height
      } : undefined,
      logo: response.data?.logo?.url ? { 
        url: response.data.logo.url,
        width: response.data.logo.width,
        height: response.data.logo.height
      } : undefined,
      screenshot: response.data?.screenshot?.url ? {
        url: response.data.screenshot.url,
        width: response.data.screenshot.width,
        height: response.data.screenshot.height
      } : undefined,
      author: response.data?.author || response.author,
      publisher: response.data?.publisher || response.publisher,
      date: response.data?.date || response.date,
      lang: response.data?.lang || response.lang
    };
  }

  /**
   * Transform LinkPreview API response to our format
   */
  private transformLinkPreviewResponse(response: any): MicrolinkData {
    return {
      url: response.url,
      title: response.title,
      description: response.description,
      image: response.image ? { 
        url: response.image,
        width: undefined,
        height: undefined
      } : undefined,
      logo: response.logo ? { 
        url: response.logo,
        width: undefined,
        height: undefined
      } : undefined,
      // LinkPreview doesn't provide screenshots, so we don't include it
      author: response.author,
      publisher: response.publisher,
      date: response.date,
      lang: response.lang
    };
  }

  /**
   * Get fallback metadata when API fails
   */
  private getFallbackMetadata(url: string): MicrolinkData {
    return {
      url: url,
      title: this.extractDomainFromUrl(url),
      description: 'No description available',
      image: {
        url: this.getDefaultImageUrl()
      },
      screenshot: {
        url: this.getDefaultScreenshotUrl(),
        width: 1280,
        height: 720
      }
    };
  }

  /**
   * Extract domain name from URL
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Unknown Project';
    }
  }

  /**
   * Get default placeholder image
   */
  private getDefaultImageUrl(): string {
    return 'https://via.placeholder.com/400x300/667eea/ffffff?text=Project+Screenshot';
  }

  /**
   * Get default placeholder screenshot
   */
  private getDefaultScreenshotUrl(): string {
    return 'https://via.placeholder.com/1280x720/667eea/ffffff?text=Website+Screenshot';
  }

  /**
   * Cache metadata in localStorage
   */
  private cacheMetadata(url: string, metadata: MicrolinkData): void {
    try {
      const cacheKey = `microlink_cache_${this.hashUrl(url)}`;
      const cacheData = {
        url,
        metadata,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('MicrolinkService: Cached metadata for:', url);
    } catch (error) {
      console.warn('MicrolinkService: Failed to cache metadata:', error);
    }
  }

  /**
   * Get cached metadata from localStorage
   */
  getCachedMetadata(url: string): MicrolinkData | null {
    try {
      const cacheKey = `microlink_cache_${this.hashUrl(url)}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(cacheKey);
        console.log('MicrolinkService: Cache expired for:', url);
        return null;
      }
      
      console.log('MicrolinkService: Found cached metadata for:', url);
      return cacheData.metadata;
    } catch (error) {
      console.warn('MicrolinkService: Failed to read cached metadata:', error);
      return null;
    }
  }

  /**
   * Generate a simple hash for URL to use as cache key
   */
  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear all cached metadata
   */
  clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('microlink_cache_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('MicrolinkService: Cleared all cached metadata');
    } catch (error) {
      console.warn('MicrolinkService: Failed to clear cache:', error);
    }
  }


  /**
   * Validate if URL is accessible
   */
  validateUrl(url: string): Observable<boolean> {
    return this.getUrlMetadata(url).pipe(
      map(data => !!data.title),
      catchError(() => of(false))
    );
  }

  /**
   * Get multiple URLs metadata in batch
   */
  getBatchMetadata(urls: string[]): Observable<MicrolinkData[]> {
    const requests = urls.map(url => this.getUrlMetadata(url));
    return new Observable(observer => {
      let completed = 0;
      const results: MicrolinkData[] = [];
      
      requests.forEach((request, index) => {
        request.subscribe({
          next: (data) => {
            results[index] = data;
            completed++;
            if (completed === requests.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            results[index] = this.getFallbackMetadata(urls[index]);
            completed++;
            if (completed === requests.length) {
              observer.next(results);
              observer.complete();
            }
          }
        });
      });
    });
  }
}
