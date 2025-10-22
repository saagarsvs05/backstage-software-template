import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { App, AppFilters, DashboardStats } from '../models/app.model';
import { MicrolinkService, MicrolinkData } from './microlink.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private appsSubject = new BehaviorSubject<App[]>([]);
  public apps$ = this.appsSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private readonly API_BASE_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private microlinkService: MicrolinkService
  ) {
    this.loadApps();
  }

  /**
   * Load apps from API
   */
  public loadApps(): void {
    this.loadingSubject.next(true);
    console.log('Loading apps from API:', this.API_BASE_URL);
    this.getApps().subscribe({
      next: (apps) => {
        console.log('Successfully loaded apps:', apps);
        this.appsSubject.next(apps);
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('Error loading apps from API:', error);
        this.appsSubject.next([]);
        this.loadingSubject.next(false);
      }
    });
  }

  /**
   * Get HTTP headers with CORS support
   */
  private getHttpHeaders(): { [key: string]: string } {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    };
  }

  /**
   * Convert string dates to Date objects in app data
   */
  private convertStringDatesToDateObjects(app: any): App {
    return {
      ...app,
      createdAt: app.createdAt ? new Date(app.createdAt) : new Date(),
      updatedAt: app.updatedAt ? new Date(app.updatedAt) : new Date(),
      previewMetadata: app.previewMetadata ? {
        ...app.previewMetadata,
        lastFetched: app.previewMetadata.lastFetched ? new Date(app.previewMetadata.lastFetched) : undefined
      } : undefined
    };
  }

  /**
   * Get all apps from API
   */
  getApps(): Observable<App[]> {
    this.loadingSubject.next(true);
    const params = new HttpParams()
      .set('limit', '100')
      .set('page', '1');
    
    return this.http.get<ApiResponse<App[]>>(this.API_BASE_URL, {
      headers: this.getHttpHeaders(),
      params: params
    }).pipe(
      map(response => {
        this.loadingSubject.next(false);
        console.log('API Response pagination:', response.pagination);
        console.log('Total apps received:', response.data?.length || 0);
        const apps = response.data || [];
        // Convert string dates to Date objects
        return apps.map(app => this.convertStringDatesToDateObjects(app));
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error fetching apps:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single app by ID
   */
  getAppById(id: string): Observable<App | undefined> {
    this.loadingSubject.next(true);
    return this.http.get<ApiResponse<App>>(`${this.API_BASE_URL}/${id}`).pipe(
      map(response => {
        this.loadingSubject.next(false);
        return response.data ? this.convertStringDatesToDateObjects(response.data) : undefined;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error fetching app:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new app with metadata fetching
   */
  addApp(app: Omit<App, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl'>): Observable<App> {
    this.loadingSubject.next(true);
    
    return this.microlinkService.getUrlMetadata(app.deployedUrl).pipe(
      map((metadata: MicrolinkData) => {
        return {
          ...app,
          imageUrl: metadata.image?.url || undefined,
          name: metadata.title || app.name,
          description: metadata.description || app.description,
          previewMetadata: {
            title: metadata.title,
            description: metadata.description,
            image: metadata.image?.url,
            logo: metadata.logo?.url,
            screenshot: metadata.screenshot?.url,
            author: metadata.author,
            publisher: metadata.publisher,
            date: metadata.date,
            lang: metadata.lang,
            lastFetched: new Date()
          }
        };
      }),
      switchMap(appData => this.http.post<ApiResponse<App>>(this.API_BASE_URL, appData, {
        headers: this.getHttpHeaders()
      })),
      map(response => {
        this.loadingSubject.next(false);
        // Refresh apps list
        this.loadApps();
        return response.data;
      }),
      catchError(err => {
        console.error('Error fetching Microlink metadata:', err);
        // If Microlink fails, add the app without metadata
        const appData = {
          ...app,
          imageUrl: undefined,
          previewMetadata: undefined
        };

        return this.http.post<ApiResponse<App>>(this.API_BASE_URL, appData, {
          headers: this.getHttpHeaders()
        }).pipe(
          map(response => {
            this.loadingSubject.next(false);
            // Refresh apps list
            this.loadApps();
            return response.data;
          }),
          catchError(error => {
            this.loadingSubject.next(false);
            console.error('Error creating app:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  /**
   * Update existing app
   */
  updateApp(id: string, updates: Partial<App>): Observable<App> {
    this.loadingSubject.next(true);
    
    return this.http.put<ApiResponse<App>>(`${this.API_BASE_URL}/${id}`, updates).pipe(
      map(response => {
        this.loadingSubject.next(false);
        // Refresh apps list
        this.loadApps();
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error updating app:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete app
   */
  deleteApp(id: string): Observable<void> {
    this.loadingSubject.next(true);
    
    return this.http.delete<ApiResponse<void>>(`${this.API_BASE_URL}/${id}`).pipe(
      map(response => {
        this.loadingSubject.next(false);
        // Refresh apps list
        this.loadApps();
        return undefined;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error deleting app:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh app metadata
   */
  refreshAppMetadata(id: string): Observable<App> {
    this.loadingSubject.next(true);
    
    // First get the current app
    return this.getAppById(id).pipe(
      switchMap(app => {
        if (!app) {
          throw new Error('App not found');
        }
        
        // Fetch new metadata
        return this.microlinkService.getUrlMetadata(app.deployedUrl).pipe(
          map(metadata => {
            const updates = {
              name: metadata.title || app.name,
              description: metadata.description || app.description,
              imageUrl: metadata.image?.url || app.imageUrl,
              previewMetadata: {
                title: metadata.title,
                description: metadata.description,
                image: metadata.image?.url,
                logo: metadata.logo?.url,
                screenshot: metadata.screenshot?.url,
                author: metadata.author,
                publisher: metadata.publisher,
                date: metadata.date,
                lang: metadata.lang,
                lastFetched: new Date()
              }
            };
            return this.updateApp(id, updates);
          })
        );
      }),
      switchMap(observable => observable),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error refreshing metadata:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filtered apps
   */
  getFilteredApps(filters: AppFilters): App[] {
    const apps = this.appsSubject.value;

    return apps.filter(app => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          app.name.toLowerCase().includes(searchLower) ||
          app.description.toLowerCase().includes(searchLower) ||
          app.techStack.some(tech => tech.toLowerCase().includes(searchLower)) ||
          app.tags.some(tag => tag.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Tech stack filter
      if (filters.techStack.length > 0) {
        const hasMatchingTech = filters.techStack.some(tech =>
          app.techStack.some(appTech =>
            appTech.toLowerCase().includes(tech.toLowerCase())
          )
        );
        if (!hasMatchingTech) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag =>
          app.tags.some(appTag =>
            appTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        if (!filters.status.includes(app.status)) return false;
      }

      return true;
    });
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): DashboardStats {
    const apps = this.appsSubject.value;
    console.log('Calculating stats for apps:', apps);

    const totalApps = apps.length;
    const activeApps = apps.filter(app => app.status === 'active').length;
    const inProgressApps = apps.filter(app => app.status === 'in-progress').length;
    const archivedApps = apps.filter(app => app.status === 'archived').length;

    console.log('Stats calculated:', { totalApps, activeApps, inProgressApps, archivedApps });

    // Count tech stack usage
    const techStackCount: { [key: string]: number } = {};
    apps.forEach(app => {
      app.techStack.forEach(tech => {
        techStackCount[tech] = (techStackCount[tech] || 0) + 1;
      });
    });

    // Get recent apps (last 5)
    const recentApps = apps
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    return {
      totalApps,
      activeApps,
      inProgressApps,
      archivedApps,
      techStackCount,
      recentApps
    };
  }

  /**
   * Get all unique tech stacks
   */
  getAllTechStacks(): string[] {
    const apps = this.appsSubject.value;
    const allTechStacks = new Set<string>();

    apps.forEach(app => {
      app.techStack.forEach(tech => allTechStacks.add(tech));
    });

    return Array.from(allTechStacks).sort();
  }

  /**
   * Get all unique tags
   */
  getAllTags(): string[] {
    const apps = this.appsSubject.value;
    const allTags = new Set<string>();

    apps.forEach(app => {
      app.tags.forEach(tag => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  }

  /**
   * Export apps data
   */
  exportApps(): void {
    const apps = this.appsSubject.value;
    const dataStr = JSON.stringify(apps, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `launchpad-projects-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import apps data
   */
  importApps(file: File): Observable<void> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const apps = JSON.parse(e.target?.result as string);
          // Here you would typically send the data to the API
          // For now, we'll just log it
          console.log('Imported apps:', apps);
          observer.next();
          observer.complete();
        } catch (error) {
          observer.error('Invalid JSON file');
        }
      };
      reader.onerror = () => observer.error('Error reading file');
      reader.readAsText(file);
    });
  }
}