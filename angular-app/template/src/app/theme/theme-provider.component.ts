import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-provider',
  imports: [CommonModule],
  template: `
    <div class="theme-provider">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .theme-provider {
      font-family: 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      position: relative;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Page transition animations */
    .theme-provider {
      animation: fadeIn 0.6s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Smooth scrolling for anchor links */
    html {
      scroll-behavior: smooth;
    }

    /* Enhanced focus styles */
    *:focus-visible {
      outline: 2px solid rgba(168, 85, 247, 0.6);
      outline-offset: 2px;
      border-radius: 4px;
    }

    /* Improved selection */
    ::selection {
      background: rgba(168, 85, 247, 0.2);
      color: #1f2937;
    }

    /* Loading states */
    .loading {
      position: relative;
      overflow: hidden;
    }

    .loading::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% {
        left: -100%;
      }
      100% {
        left: 100%;
      }
    }
  `]
})
export class ThemeProvider {
}
