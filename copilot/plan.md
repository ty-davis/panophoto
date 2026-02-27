# PanoPhoto - Instagram Panorama Creator

## Problem Statement
Create a browser-based web application that allows users to create Instagram-ready panoramas by uploading photos and laying them out across multiple slides with customizable aspect ratios.

## Tech Stack
- **Framework**: Vue 3 (Composition API) with TypeScript
- **Build Tool**: Vite
- **Canvas Manipulation**: Native HTML5 Canvas API
- **File Handling**: JSZip for multi-file downloads
- **Styling**: Modern CSS (with potential for Tailwind CSS)

## Key Features
1. Client-side image processing (no server needed)
2. Drag-and-drop image upload
3. Canvas-based layout editor
4. Multiple aspect ratio support (1:1, 4:5, 16:9, 9:16)
5. Multi-slide Instagram post preview
6. Export individual slide images as separate files
7. Download preview composite

## Implementation Workplan

### Phase 1: Project Setup ✅
- [x] Initialize Vite + Vue 3 + TypeScript project
- [x] Set up project structure (components, composables, utilities)
- [x] Install dependencies (JSZip)
- [x] Create basic HTML layout and styling foundation

### Phase 2: Core Image Handling ✅
- [x] Create image upload component with drag-and-drop
- [x] Implement image file validation (JPEG, PNG, WebP)
- [x] Create image store/state management (reactive refs)
- [x] Build thumbnail preview for uploaded images

### Phase 3: Canvas & Layout Engine ⚠️ (Refactoring to Panoramic Canvas)
- [x] Create main canvas component with aspect ratio selector
- [x] Implement canvas rendering system
- [x] Build slide management (add/remove/reorder slides)
- [ ] **REFACTOR: Continuous panoramic canvas approach**
  - [ ] Change from individual slides to continuous horizontal canvas
  - [ ] Add frame boundaries with visual markers
  - [ ] Extend canvas width when adding frames
  - [ ] Support mixed aspect ratios across frames
- [ ] Create image positioning system (drag, scale, rotate on canvas)
- [ ] Canvas scrolling/panning for long panoramas

### Phase 4: Export Functionality ⚠️ (Needs Update)
- [x] Create canvas-to-image converter (toBlob/toDataURL)
- [ ] **UPDATE: Split panorama at frame boundaries on export**
- [x] Build ZIP download functionality with JSZip
- [x] Create preview composite generator
- [x] Add download UI with progress indicators

### Phase 5: UX Enhancements
- [ ] Add keyboard shortcuts (arrow keys for navigation, delete key, etc.)
- [ ] Implement undo/redo functionality
- [ ] Create responsive design for mobile/tablet
- [ ] Add loading states and error handling
- [ ] Include helpful tooltips/onboarding

### Phase 6: Polish & Testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Performance optimization (large image handling)
- [ ] Add example/demo mode
- [ ] Write README with usage instructions

---

## Architecture Change: Continuous Panoramic Canvas

### New Approach (2026-02-27)
Instead of editing individual slides separately, the canvas extends horizontally as frames are added:

**Before:** Slide 1 | Slide 2 | Slide 3 (edited separately)
**After:** [-------- Continuous Panorama Canvas --------] with frame markers

### Key Changes:
1. **Canvas Model**: Single continuous canvas with cumulative width
2. **Frame Boundaries**: Visual markers showing where splits will occur
3. **Adding Frames**: Extends canvas width by frame width
4. **Export**: Splits the panorama into individual images at frame boundaries
5. **Mixed Ratios**: Support different aspect ratios per frame (height = max height)

## Technical Architecture

### Component Structure
```
App.vue
├── ImageUploader.vue (drag-drop zone)
├── CanvasEditor.vue (main editing area)
│   ├── AspectRatioSelector.vue
│   ├── SlideCanvas.vue (individual slide canvas)
│   └── SlideNavigation.vue
├── ImageLibrary.vue (uploaded images sidebar)
├── ExportPanel.vue (download controls)
└── Toolbar.vue (actions, settings)
```

### Composables/Utilities
- `useImageStore.js` - Image state management
- `useCanvas.js` - Canvas manipulation logic
- `useExport.js` - Export/download functionality
- `aspectRatios.js` - Aspect ratio configurations
- `imageUtils.js` - Image processing helpers

### Instagram Aspect Ratios
- **1:1** (Square): 1080x1080px
- **4:5** (Portrait): 1080x1350px
- **16:9** (Landscape): 1080x608px
- **9:16** (Story/Reel): 1080x1920px

## Notes & Considerations

### Best Practices
- Use Composition API for better code organization and reusability
- Implement proper error boundaries and fallbacks
- Keep canvas operations efficient (use requestAnimationFrame)
- Use Web Workers for heavy image processing if needed
- Modular architecture for easy feature expansion

### Future Enhancement Ideas
- Templates/presets for common layouts
- Filters and image adjustments
- Text overlay support
- Grid/guideline helpers
- Cloud save/load functionality
- Batch processing multiple panoramas

### Performance Considerations
- Lazy load images
- Throttle/debounce canvas redraw operations
- Use offscreen canvas for complex operations
- Implement image size limits and optimization
- Progressive loading for large files
