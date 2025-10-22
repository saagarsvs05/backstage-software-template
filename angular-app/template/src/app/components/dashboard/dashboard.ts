import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppService } from '../../services/app.service';
import { MicrolinkService } from '../../services/microlink.service';
import { App, AppFilters, DashboardStats } from '../../models/app.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, NgIf, NgFor, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  stats: DashboardStats | null = null;
  apps: App[] = [];
  filteredApps: App[] = [];
  filters: AppFilters = {
    searchTerm: '',
    techStack: [],
    tags: [],
    status: []
  };
  
  allTechStacks: string[] = [];
  allTags: string[] = [];
  viewMode: 'grid' | 'list' = 'grid';
  showFilters = false;
  loading = false;
  error: string | null = null;
  selectedProject: App | null = null;
  loadingPreviews: Set<string> = new Set();
  private intersectionObserver?: IntersectionObserver;
  private observedElements = new Map<Element, string>();

  constructor(
    private appService: AppService,
    private microlinkService: MicrolinkService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = null;
    
    // Subscribe to loading state
    this.appService.loading$.subscribe(loading => {
      this.loading = loading;
    });
    
    // Subscribe to apps changes
    this.appService.apps$.subscribe(apps => {
      console.log('Dashboard received apps:', apps);
      console.log('Apps array length:', apps.length);
      
      // Log each app's structure to see what we're getting
      apps.forEach((app, index) => {
        console.log(`App ${index + 1}:`, {
          name: app.name,
          status: app.status,
          techStack: app.techStack,
          tags: app.tags
        });
      });
      
      this.apps = apps;
      this.filteredApps = apps;
      
      // Always calculate stats from the actual apps data we have
      this.stats = this.calculateLocalStats(apps);
      console.log('Stats calculated from apps data:', this.stats);
      console.log('Stats object assigned to component:', this.stats);
      console.log('Stats.totalApps value:', this.stats?.totalApps);
      
      this.allTechStacks = this.appService.getAllTechStacks();
      this.allTags = this.appService.getAllTags();
      
      // Load cached previews for all apps
      this.loadCachedPreviews();
      
      // Initialize intersection observer for lazy loading
      this.initializeIntersectionObserver();
    });
  }

  ngAfterViewInit(): void {
    // Start observing cards after view is initialized
    setTimeout(() => {
      this.observeAllCards();
    }, 100);
  }

  /**
   * Calculate stats locally from the apps data as a fallback
   */
  private calculateLocalStats(apps: App[]): DashboardStats {
    console.log('Calculating local stats for apps:', apps);
    console.log('Apps count:', apps.length);
    
    const totalApps = apps.length;
    const activeApps = apps.filter(app => app.status === 'active').length;
    const inProgressApps = apps.filter(app => app.status === 'in-progress').length;
    const archivedApps = apps.filter(app => app.status === 'archived').length;

    console.log('Status breakdown:', {
      total: totalApps,
      active: activeApps,
      inProgress: inProgressApps,
      archived: archivedApps
    });

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

    const stats = {
      totalApps,
      activeApps,
      inProgressApps,
      archivedApps,
      techStackCount,
      recentApps
    };

    console.log('Final stats object:', stats);
    return stats;
  }

  getTopTechStacks(): { name: string; count: number }[] {
    if (!this.stats) return [];
    
    return Object.entries(this.stats.techStackCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredApps = this.appService.getFilteredApps(this.filters);
    // Recalculate stats when filters change
    this.updateStats();
    
    // Re-observe cards after filtering
    setTimeout(() => {
      this.observeAllCards();
    }, 100);
  }

  /**
   * Update stats based on current data
   */
  private updateStats(): void {
    this.stats = this.calculateLocalStats(this.apps);
  }

  clearFilters(): void {
    this.filters = {
      searchTerm: '',
      techStack: [],
      tags: [],
      status: []
    };
    this.applyFilters();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'archived':
        return 'bg-secondary-100 text-secondary-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  }

  /**
   * Refresh metadata for a specific app (full refresh through backend)
   */
  refreshAppMetadata(appId: string): void {
    this.appService.refreshAppMetadata(appId).subscribe({
      next: (updatedApp) => {
        // Update local data
        const index = this.apps.findIndex(app => app.id === appId);
        if (index !== -1) {
          this.apps[index] = updatedApp;
          this.applyFilters();
          this.updateStats();
        }
      },
      error: (error) => {
        this.error = 'Failed to refresh metadata. Please try again.';
        console.error('Error refreshing metadata:', error);
      }
    });
  }

  /**
   * Refresh preview for a specific app (client-side only, bypasses cache)
   */
  refreshAppPreview(appId: string): void {
    const app = this.apps.find(a => a.id === appId);
    if (app) {
      console.log('Refreshing preview for app:', app.name);
      this.fetchAppPreview(app, true); // Force refresh, bypass cache
    }
  }

  /**
   * Load cached previews for all apps on initialization
   */
  private loadCachedPreviews(): void {
    console.log('Loading cached previews for all apps...');
    this.apps.forEach(app => {
      if (app.deployedUrl && !this.hasPreviewMetadata(app)) {
        // Check if we have cached data for this URL
        const cached = this.microlinkService.getCachedMetadata(app.deployedUrl);
        if (cached) {
          console.log('Found cached preview for app:', app.name);
          // Update the app with cached preview metadata
          const updatedApp = {
            ...app,
            previewMetadata: {
              title: cached.title,
              description: cached.description,
              image: cached.image?.url,
              logo: cached.logo?.url,
              screenshot: cached.screenshot?.url,
              author: cached.author,
              publisher: cached.publisher,
              date: cached.date,
              lang: cached.lang,
              lastFetched: new Date()
            }
          };
          
          // Update local data
          const index = this.apps.findIndex(a => a.id === app.id);
          if (index !== -1) {
            this.apps[index] = updatedApp;
          }
        }
      }
    });
    
    // Update filtered apps to reflect cached previews
    this.filteredApps = this.appService.getFilteredApps(this.filters);
    console.log('Cached previews loaded for', this.apps.filter(app => this.hasPreviewMetadata(app)).length, 'apps');
  }

  /**
   * Fetch preview metadata for an app
   */
  fetchAppPreview(app: App, forceRefresh: boolean = false): void {
    if (this.loadingPreviews.has(app.id)) {
      console.log('Preview already loading for app:', app.name, 'skipping...');
      return;
    }
    
    console.log('Fetching preview for app:', app.name, 'URL:', app.deployedUrl, 'forceRefresh:', forceRefresh);
    this.loadingPreviews.add(app.id);
    
    this.microlinkService.getUrlMetadata(app.deployedUrl, forceRefresh).subscribe({
      next: (metadata) => {
        console.log('Received metadata:', metadata);
        // Update the app with preview metadata
        const updatedApp = {
          ...app,
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
        console.log('Updated app with preview metadata:', updatedApp);
        
        // Update local data
        const index = this.apps.findIndex(a => a.id === app.id);
        if (index !== -1) {
          this.apps[index] = updatedApp;
          // Update filtered apps to reflect the change
          this.filteredApps = this.appService.getFilteredApps(this.filters);
          this.updateStats();
        }
        
        this.loadingPreviews.delete(app.id);
      },
      error: (error) => {
        console.error('Error fetching preview metadata:', error);
        this.loadingPreviews.delete(app.id);
      }
    });
  }

  /**
   * Get preview image for an app
   */
  getPreviewImage(app: App): string | null {
    console.log('Getting preview image for app:', app.name);
    console.log('Preview metadata:', app.previewMetadata);
    
    if (app.previewMetadata?.screenshot) {
      console.log('Using screenshot:', app.previewMetadata.screenshot);
      return app.previewMetadata.screenshot;
    }
    if (app.previewMetadata?.image) {
      console.log('Using preview image:', app.previewMetadata.image);
      return app.previewMetadata.image;
    }
    if (app.previewMetadata?.logo) {
      console.log('Using logo:', app.previewMetadata.logo);
      return app.previewMetadata.logo;
    }
    if (app.imageUrl) {
      console.log('Using imageUrl:', app.imageUrl);
      return app.imageUrl;
    }
    console.log('No preview image available');
    return null;
  }

  /**
   * Check if app is loading preview
   */
  isLoadingPreview(appId: string): boolean {
    return this.loadingPreviews.has(appId);
  }

  /**
   * Check if app has preview metadata
   */
  hasPreviewMetadata(app: App): boolean {
    return !!(app.previewMetadata && (app.previewMetadata.image || app.previewMetadata.screenshot));
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  /**
   * Delete an app
   */
  deleteApp(appId: string): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.appService.deleteApp(appId).subscribe({
        next: () => {
          // Remove from local data
          this.apps = this.apps.filter(app => app.id !== appId);
          this.applyFilters();
          this.updateStats();
          this.allTechStacks = this.appService.getAllTechStacks();
          this.allTags = this.appService.getAllTags();
        },
        error: (error) => {
          this.error = 'Failed to delete project. Please try again.';
          console.error('Error deleting app:', error);
        }
      });
    }
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Show project details in popover
   */
  showProjectDetails(project: App): void {
    this.selectedProject = project;
  }

  /**
   * Close project details popover
   */
  closeProjectDetails(): void {
    this.selectedProject = null;
  }

  /**
   * Export apps data
   */
  exportApps(): void {
    this.appService.exportApps();
  }

  /**
   * Import apps data
   */
  importApps(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.appService.importApps(file).subscribe({
        next: () => {
          console.log('Apps imported successfully');
          // Refresh apps after import
          this.appService.loadApps();
        },
        error: (error) => {
          this.error = 'Failed to import data. Please check the file format.';
          console.error('Error importing apps:', error);
        }
      });
    }
  }

  /**
   * Initialize intersection observer for lazy loading
   */
  private initializeIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver not supported, falling back to manual loading');
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
                entries.forEach(entry => {
                  if (entry.isIntersecting) {
                    const appId = this.observedElements.get(entry.target);
                    if (appId) {
                      const app = this.apps.find(a => a.id === appId);
                      if (app && !this.hasPreviewMetadata(app)) {
                        console.log('Card became visible, auto-loading preview for:', app.name);
                        this.fetchAppPreview(app); // Auto-load without force refresh
                      }
                      // Stop observing this element
                      this.intersectionObserver?.unobserve(entry.target);
                      this.observedElements.delete(entry.target);
                    }
                  }
                });
      },
      {
        rootMargin: '50px', // Start loading 50px before the card becomes visible
        threshold: 0.1
      }
    );
  }

  /**
   * Observe all visible cards for lazy loading
   */
  private observeAllCards(): void {
    if (!this.intersectionObserver) return;

    // Find all card elements with data-app-id attribute
    const cards = document.querySelectorAll('[data-app-id]');
    cards.forEach(card => {
      const appId = card.getAttribute('data-app-id');
      if (appId && !this.observedElements.has(card)) {
        const app = this.apps.find(a => a.id === appId);
        if (app && !this.hasPreviewMetadata(app)) {
          this.observedElements.set(card, appId);
          this.intersectionObserver!.observe(card);
        }
      }
    });
  }

  /**
   * Start observing a card element for lazy loading
   */
  observeCard(element: Element, appId: string): void {
    if (this.intersectionObserver && !this.observedElements.has(element)) {
      this.observedElements.set(element, appId);
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Stop observing a card element
   */
  unobserveCard(element: Element): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
      this.observedElements.delete(element);
    }
  }

  /**
   * Clean up intersection observer
   */
  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}
