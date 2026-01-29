# SecurePass Gen - React PWA

A secure, offline-capable password generator built with React and Vite. This application allows users to generate strong, random passwords with customizable options and maintains a local history functionality.

## Features

- **Secure Password Generation**: Uses the Web Crypto API for cryptographically strong random numbers.
- **Customizable Options**:
  - Adjustable length (6-64 characters).
  - Toggle Uppercase, Lowercase, Numbers, and Symbols.
- **History**: Automatically saves generated passwords to a local history (stored in IndexedDB), persisting across sessions.
- **PWA Support**: Installable as a native-like app and works offline.
- **Clipboard Integration**: One-click copy with visual feedback.
- **Responsive Design**: Optimized for mobile and desktop with a modern glassmorphism UI.

## Technologies Used

- **React 19**: UI library for building the interface.
- **Vite**: Fast build tool and development server.
- **Vite PWA Plugin**: Configuration for Progressive Web App capabilities.
- **IndexedDB**: Browser-based database for storing password history.
- **CSS Variables**: For consistent styling and theming.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm

### Installation

1. Clone the repository (or navigate to the project directory).
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```
Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

### Building for Production

To create a production build:
```bash
npm run build
```
The output will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:
```bash
npm run preview
```

## Project Structure

- `src/App.jsx`: Main application component containing logic for state, password generation, and IndexedDB.
- `src/index.css`: Global styles including variables and glassmorphism effects.
- `vite.config.js`: Configuration for Vite and PWA plugin.
- `public/`: Static assets like icons and manifest.

## License

MIT
