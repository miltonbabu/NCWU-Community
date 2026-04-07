# NCWU Class Schedule - International Student Community

A modern, responsive web application for managing and viewing class schedules at North China University of Water Resources and Electric Power (NCWU).

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4.19-38B2AC?logo=tailwindcss)

## Features

- **Class Schedule Management** - View and manage class schedules by day, time, and subject
- **Department Pages** - Dedicated pages for Computer Science and Economics departments
- **Technology Patterns Section** - Showcases frameworks, architectural patterns, and design patterns
- **Chinese Cultural Design** - Beautiful integration of traditional Chinese patterns (Dragon/Phoenix, Wave patterns)
- **Dark/Light Theme** - Toggle between dark and light modes
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Updates** - Live schedule updates and notifications

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS with custom Chinese cultural patterns
- **UI Components**: Radix UI primitives
- **Routing**: React Router DOM 7
- **State Management**: React Hooks
- **Form Handling**: React Hook Form with Zod validation

## Project Structure

```
app/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   │   └── ui/          # Radix UI components
│   ├── data/            # Schedule data
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   ├── AppRouter.tsx    # Route configuration
│   ├── index.css        # Global styles
│   └── main.tsx         # App entry point
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+ or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/ncwu-class-schedule.git
cd ncwu-class-schedule/app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Deployment

### GitHub Pages

The project is configured for GitHub Pages deployment. The GitHub Actions workflow automatically deploys to GitHub Pages on push to the `main` branch.

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist/` folder to your hosting provider (Vercel, Netlify, etc.)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with department overview |
| `/cst` | Computer Science 2023 department page |
| `/cst/class-schedule` | CS 2023 class schedule |
| `/economics-2025` | Economics 2025 department page |
| `/economics-2025/class-schedule` | Economics 2025 class schedule |

## Design Features

### Chinese Cultural Patterns

- **Dragon/Phoenix Pattern (龙凤纹)** - Used in hero sections, symbolizing power and rebirth
- **Wave Pattern (海水纹)** - Background pattern representing prosperity
- **Traditional Color Palette** - Chinese red, gold, and jade colors

### Interactive Effects

- Smooth hover transitions on cards and buttons
- Staggered entrance animations
- Responsive navigation with mobile support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- NCWU International Student Office
- React and Vite teams
- Radix UI for accessible components
- Tailwind CSS for styling utilities
