export interface App {
  id: string;
  name: string;
  description: string;
  deployedUrl: string;
  techStack: string[];
  tags: string[];
  status: 'active' | 'archived' | 'in-progress';
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  repositoryUrl?: string;
  features?: string[];
  challenges?: string[];
  learnings?: string[];
  // Preview metadata
  previewMetadata?: {
    title?: string;
    description?: string;
    image?: string;
    logo?: string;
    screenshot?: string;
    author?: string;
    publisher?: string;
    date?: string;
    lang?: string;
    lastFetched?: Date;
  };
}

export interface AppFilters {
  searchTerm: string;
  techStack: string[];
  tags: string[];
  status: string[];
}

export interface DashboardStats {
  totalApps: number;
  activeApps: number;
  inProgressApps: number;
  archivedApps: number;
  techStackCount: { [key: string]: number };
  recentApps: App[];
}
