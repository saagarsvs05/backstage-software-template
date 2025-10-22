import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeProvider } from './theme/theme-provider.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ThemeProvider],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'LaunchPad';
}
