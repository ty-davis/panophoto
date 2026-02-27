# PanoPhoto - Instagram Panorama Creator

Create Instagram-ready panoramas by combining multiple images into multi-slide posts. All processing happens in your browser - no server uploads required!

## Features

✨ **Client-side Processing** - All image manipulation happens in your browser  
🖼️ **Drag & Drop** - Easy image upload with drag-and-drop support  
📐 **Continuous Panoramic Canvas** - Create one long panorama that gets split into frames
🎞️ **Frame-Based Export** - Automatically splits your panorama at frame boundaries
📏 **Multiple Aspect Ratios** - Support for all Instagram formats:
  - 1:1 Square (1080×1080)
  - 4:5 Portrait (1080×1350)
  - 16:9 Landscape (1080×608)
  - 9:16 Story/Reel (1080×1920)

🎨 **Visual Canvas Editor** - See all frames in one continuous view with boundary markers  
🔄 **Mixed Aspect Ratios** - Each frame can have its own aspect ratio  
💾 **Export Options** - Download as PNG or JPEG with quality control  
📦 **ZIP Downloads** - Get all frames + full panorama in one download

## How It Works

Unlike traditional multi-slide editors where you edit each slide separately, PanoPhoto uses a **continuous panoramic canvas**:

1. Start with one frame
2. Add more frames to extend the canvas horizontally
3. Each frame can have a different aspect ratio
4. Drag images onto the continuous canvas
5. On export, the panorama is automatically split at frame boundaries

This makes it easy to create true panoramas that flow across multiple Instagram slides!

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## How to Use

1. **Upload Images** - Click or drag images into the upload zone (supports PNG, JPG, WebP)
2. **Add Frames** - Select aspect ratio and click "Add Frame" to extend the panorama
3. **Place Images** - Drag images from the library onto the continuous canvas
4. **Adjust Frames** - Change aspect ratios for individual frames as needed
5. **Export** - Choose your format and click "Export All Frames" to download

The export will include:
- Individual frames (frame-1.png, frame-2.png, etc.)
- Full panorama preview (panorama-full.png)

## Tech Stack

- **Vue 3** with Composition API and TypeScript
- **Vite** for blazing fast development
- **HTML5 Canvas** for image manipulation
- **JSZip** for multi-file downloads

## Project Structure

```
src/
├── components/          # Vue components
│   ├── ImageUploader.vue
│   ├── ImageLibrary.vue
│   ├── CanvasEditor.vue
│   ├── PanoramaCanvas.vue    # Main panoramic canvas
│   ├── FrameList.vue          # Frame management
│   └── ExportPanel.vue
├── composables/         # Vue composables (state & logic)
│   ├── useImageStore.ts
│   ├── usePanorama.ts         # Panorama state management
│   ├── useCanvas.ts
│   └── useExport.ts
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
│   ├── aspectRatios.ts
│   └── imageUtils.ts
└── App.vue             # Main app component
```

## Roadmap

Future enhancements planned:
- Image transformation tools (drag to reposition, scale, rotate on canvas)
- Keyboard shortcuts for faster workflow
- Undo/redo functionality
- Responsive design for mobile devices
- Image filters and adjustments
- Text overlay support
- Template presets
- Snap-to-grid and alignment guides

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

MIT

---

Built with ❤️ for creators who want to share panoramic moments on Instagram

