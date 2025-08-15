# KF-Web - FFmpeg Video Processor

A beautiful React SPA built with Vite, Tailwind CSS, and shadcn/ui components that processes MP4 videos using FFmpeg WebAssembly.

## Features

- 🎬 **Drag & Drop Video Upload** - Easy MP4 file upload interface
- ⚡ **Auto-Processing** - Videos are processed automatically upon selection
- 🔧 **Configurable Parameters** - Adjust threads (1-16) and scenecut threshold (0-100)
- 📋 **Log Generation** - Generates detailed FFmpeg analysis logs
- 💾 **Download Results** - One-click download of processing logs
- 🎨 **Beautiful UI** - Glass-morphism design with smooth animations
- 🚀 **Client-Side Processing** - No server required, runs entirely in the browser

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3 + Custom animations
- **UI Components**: shadcn/ui (manually implemented)
- **Video Processing**: FFmpeg WebAssembly
- **Icons**: Lucide React
- **Deployment**: GitHub Pages

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dead/kf-web.git
   cd kf-web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setting up GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" in the sidebar
3. Under "Source", select "GitHub Actions"
4. The workflow will automatically deploy on every push to the `main` branch

### Manual Deployment

You can also trigger deployment manually:

1. Go to the "Actions" tab in your repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

## Usage

1. **Upload Video**: Drag and drop an MP4 file or click to browse
2. **Configure Settings**: Adjust threads and scenecut threshold using the sliders
3. **Auto-Processing**: The video will be processed automatically after selection
4. **Download Log**: Click the download button to save the FFmpeg analysis log

## FFmpeg Command

The application runs the following FFmpeg command:

```bash
ffmpeg -i video.mp4 -c:v libx264 -profile:v high -preset:v ultrafast -tune animation -x264-params keyint=infinite:scenecut={threshold}:pass=1:stats=file.log -f null -
```

## Configuration Options

- **Threads**: Number of processing threads (1-16) - affects processing speed
- **Scenecut Threshold**: Scene change detection sensitivity (0-100, 0 = disabled)

## Browser Support

- Modern browsers with WebAssembly support
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
