# Styfi - AI-Powered Fashion Marketplace

An intelligent fashion marketplace platform that connects customers with unique small businesses, featuring AI-powered tools for outfit composition, trend detection, and virtual try-on capabilities.

## Features

- **Curated Marketplace** - Browse unique products from small businesses worldwide
- **AI Outfit Composer** - Get personalized outfit recommendations based on selected items
- **Trend Detector** - Discover real-time fashion trends using AI market analysis
- **Virtual Try-On** - Visualize how products look on you before purchasing
- **Image Enhancer** - Professional product photography tools for sellers

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **AI Integration**: Google Generative AI (Gemini)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd styfi
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
styfi/
├── components/          # React components
│   ├── Hero.tsx
│   ├── Navbar.tsx
│   ├── Marketplace.tsx
│   ├── OutfitComposer.tsx
│   ├── TrendDetector.tsx
│   ├── VirtualTryOn.tsx
│   ├── ImageEnhancer.tsx
│   └── ProductCard.tsx
├── services/           # API services
│   └── geminiService.ts
├── App.tsx            # Main application component
├── types.ts           # TypeScript type definitions
├── index.tsx          # Application entry point
└── index.html         # HTML template
```

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key for AI features

## API Integration

The application integrates with a Cloudflare Worker backend for AI processing:
- Trend analysis
- Outfit composition
- Image enhancement
- Virtual try-on generation


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## Support

For support, please contact us or open an issue in the repository.
