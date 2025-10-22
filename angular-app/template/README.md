# DES Launchpad - Personal App Portfolio Manager

A modern Angular application built with Material-UI and Tailwind CSS for managing your technical projects and POCs.

## Features

### 🏠 Dashboard
- Overview statistics of your apps
- Top tech stacks visualization
- Recent apps display
- Quick action buttons

### 📱 App Management
- **Add/Edit Apps**: Comprehensive form for managing app details
- **Search & Filter**: Search by name, description, tech stack, or tags
- **Advanced Filters**: Filter by tech stack, tags, and status
- **App Organization**: Manage and categorize your applications

### 🎨 Beautiful UI/UX
- Modern design with Tailwind CSS
- Responsive layout for all devices
- Smooth animations and transitions
- Clean, intuitive interface

### 📊 App Details
- Basic information (name, description, URLs)
- Tech stack management
- Tags and categorization
- Key features, challenges, and learnings
- Status tracking (Active, In Progress, Archived)

## Sample Apps

The application comes with sample apps to demonstrate functionality:

1. **Sample Web App** - A demonstration web application
2. **Sample POC** - A proof of concept application
3. **Sample Portfolio** - A portfolio showcase application
4. **Sample LMS** - A learning management system
5. **Sample Portal** - A digital engineering portal

*Note: Replace these sample apps with your own projects by using the "Add App" functionality.*

## Tech Stack

- **Frontend**: Angular 20+ with standalone components
- **UI Framework**: Material-UI (MUI) for modern components
- **Styling**: Tailwind CSS with custom design system
- **HTTP Client**: Axios for API requests
- **State Management**: RxJS with BehaviorSubject
- **Data Persistence**: LocalStorage for client-side storage
- **Build Tool**: Angular CLI with Vite integration

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DES-Launchpad
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:4200`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/          # Dashboard overview
│   │   └── app-form/          # Add/Edit app form
│   ├── models/
│   │   └── app.model.ts       # Data models and interfaces
│   ├── services/
│   │   ├── app.service.ts     # App management service
│   │   └── microlink.service.ts # Microlink API service
│   ├── theme/
│   │   ├── theme-provider.component.ts # Theme provider
│   │   └── theme.ts           # Theme configuration
│   ├── app.routes.ts          # Routing configuration
│   ├── app.config.ts         # App configuration
│   └── app.ts                 # Main app component
├── styles.css                 # Global styles with Tailwind
└── index.html
```

## Features in Detail

### Dashboard
- **Statistics Cards**: Total apps, active apps, in-progress, and archived
- **Top Tech Stacks**: Visual ranking of most used technologies
- **Recent Apps**: Latest updated applications
- **Quick Actions**: Direct links to add apps or view all apps

### App Management
- **Search**: Real-time search across app names, descriptions, and tech stacks
- **Filters**: Advanced filtering by tech stack, tags, and status
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Data Persistence**: All data stored locally for offline access

### App Form
- **Comprehensive Details**: Name, description, URLs, status
- **Tech Stack Management**: Add/remove technologies with tags
- **Feature Tracking**: Document key features, challenges, and learnings
- **Validation**: Form validation for required fields

## Customization

### Adding New Tech Stacks
The application automatically detects and displays all tech stacks used across your apps. Simply add them when creating or editing apps.

### Styling
The app uses a custom Tailwind CSS configuration with:
- Primary colors (blue theme)
- Secondary colors (gray theme)
- Custom animations and transitions
- Responsive design utilities

### Data Persistence
All data is stored in browser's localStorage, making it persistent across sessions.

## Future Enhancements

- [ ] Export/Import functionality
- [ ] Cloud synchronization
- [ ] App screenshots and media
- [ ] Performance metrics
- [ ] Collaboration features
- [ ] API integration for live data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using Angular, Material-UI, and Tailwind CSS