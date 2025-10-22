import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { App } from '../../models/app.model';
import { AppService } from '../../services/app.service';

@Component({
  selector: 'app-app-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './app-form.html',
  styleUrl: './app-form.css'
})
export class AppFormComponent implements OnInit {
  isEdit = false;
  appId: string | null = null;
  loading = false;
  error: string | null = null;

  formData: Partial<App> = {
    name: '',
    description: '',
    deployedUrl: '',
    techStack: [],
    tags: [],
    status: 'active',
    repositoryUrl: '',
    features: [],
    challenges: [],
    learnings: []
  };

  newTechStack = '';
  newTag = '';
  newFeature = '';
  newChallenge = '';
  newLearning = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    // Check if we're editing an existing app
    this.appId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.appId;

    if (this.isEdit && this.appId) {
      this.loading = true;
      this.appService.getAppById(this.appId).subscribe({
        next: (app) => {
          if (app) {
            this.formData = { ...app };
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load project details.';
          this.loading = false;
          console.error('Error loading app:', error);
        }
      });
    }
  }

  addTechStack(): void {
    if (this.newTechStack.trim()) {
      this.formData.techStack = [...(this.formData.techStack || []), this.newTechStack.trim()];
      this.newTechStack = '';
    }
  }

  removeTechStack(index: number): void {
    this.formData.techStack = this.formData.techStack?.filter((_, i) => i !== index);
  }

  addTag(): void {
    if (this.newTag.trim()) {
      this.formData.tags = [...(this.formData.tags || []), this.newTag.trim()];
      this.newTag = '';
    }
  }

  removeTag(index: number): void {
    this.formData.tags = this.formData.tags?.filter((_, i) => i !== index);
  }

  addFeature(): void {
    if (this.newFeature.trim()) {
      this.formData.features = [...(this.formData.features || []), this.newFeature.trim()];
      this.newFeature = '';
    }
  }

  removeFeature(index: number): void {
    this.formData.features = this.formData.features?.filter((_, i) => i !== index);
  }

  addChallenge(): void {
    if (this.newChallenge.trim()) {
      this.formData.challenges = [...(this.formData.challenges || []), this.newChallenge.trim()];
      this.newChallenge = '';
    }
  }

  removeChallenge(index: number): void {
    this.formData.challenges = this.formData.challenges?.filter((_, i) => i !== index);
  }

  addLearning(): void {
    if (this.newLearning.trim()) {
      this.formData.learnings = [...(this.formData.learnings || []), this.newLearning.trim()];
      this.newLearning = '';
    }
  }

  removeLearning(index: number): void {
    this.formData.learnings = this.formData.learnings?.filter((_, i) => i !== index);
  }

  onSubmit(): void {
    this.loading = true;
    this.error = null;

    if (this.isEdit && this.appId) {
      this.appService.updateApp(this.appId, this.formData).subscribe({
        next: (updatedApp) => {
          console.log('App updated:', updatedApp);
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error updating app:', error);
          this.error = 'Failed to update project. Please try again.';
          this.loading = false;
        }
      });
    } else {
      this.appService.addApp(this.formData as Omit<App, 'id' | 'createdAt' | 'updatedAt'>).subscribe({
        next: (newApp) => {
          console.log('App created:', newApp);
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error creating app:', error);
          this.error = 'Failed to create project. Please try again.';
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  clearError(): void {
    this.error = null;
  }
}
