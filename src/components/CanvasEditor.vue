<template>
  <div class="canvas-editor">
    <div class="editor-header">
      <div class="frame-info">
        <span class="frame-count">{{ frames.length }} frame{{ frames.length !== 1 ? 's' : '' }}</span>
        <span class="canvas-size">{{ totalWidth }}×{{ maxHeight }}px</span>
      </div>
    </div>

    <div class="canvas-container">
      <PanoramaCanvas
        v-if="panorama"
        :panorama="panorama"
        @update="handlePanoramaUpdate"
      />
    </div>

    <ImageTray @placed="handlePanoramaUpdate" />

    <FrameList />
  </div>
</template>

<script setup lang="ts">
import { usePanorama } from '@/composables/usePanorama'
import PanoramaCanvas from './PanoramaCanvas.vue'
import FrameList from './FrameList.vue'
import ImageTray from './ImageTray.vue'

const { panorama, frames, totalWidth, maxHeight } = usePanorama()

const handlePanoramaUpdate = () => {
  // Trigger re-render if needed
}
</script>

<style scoped>
.canvas-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f7fafc;
}

.editor-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.frame-info {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.frame-count {
  font-weight: 600;
  color: #2d3748;
  font-size: 1.125rem;
}

.canvas-size {
  font-size: 0.8rem;
  color: #718096;
  font-family: 'Courier New', monospace;
}

.canvas-container {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 1.5rem;
  overflow: auto;
  min-height: 0;
}

@media (max-width: 768px) {
  .editor-header {
    padding: 0.5rem 0.75rem;
  }

  .canvas-container {
    padding: 0.75rem;
  }
}
</style>
