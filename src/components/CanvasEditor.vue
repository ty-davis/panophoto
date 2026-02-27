<template>
  <div class="canvas-editor">
    <div class="editor-header">
      <div class="frame-info">
        <span class="frame-count">{{ frames.length }} frame{{ frames.length !== 1 ? 's' : '' }}</span>
        <span class="canvas-size">{{ totalWidth }}×{{ maxHeight }}px</span>
      </div>

      <div class="frame-controls">
        <div class="aspect-ratio-selector">
          <label>Next Frame:</label>
          <select v-model="selectedAspectRatio">
            <option v-for="ratio in aspectRatios" :key="ratio.name" :value="ratio.name">
              {{ ratio.label }}
            </option>
          </select>
        </div>
        <button @click="addNewFrame" class="btn-primary">+ Add Frame</button>
      </div>
    </div>

    <div class="canvas-container">
      <PanoramaCanvas
        v-if="panorama"
        :panorama="panorama"
        @update="handlePanoramaUpdate"
      />
    </div>

    <FrameList />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePanorama } from '@/composables/usePanorama'
import { ASPECT_RATIOS, getAspectRatioByName } from '@/utils/aspectRatios'
import PanoramaCanvas from './PanoramaCanvas.vue'
import FrameList from './FrameList.vue'

const { panorama, frames, totalWidth, maxHeight, addFrame } = usePanorama()
const aspectRatios = ASPECT_RATIOS
const selectedAspectRatio = ref('square')

const addNewFrame = () => {
  const aspectRatio = getAspectRatioByName(selectedAspectRatio.value)
  addFrame(aspectRatio)
}

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
  justify-content: space-between;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  gap: 1rem;
}

.frame-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.frame-count {
  font-weight: 600;
  color: #2d3748;
}

.canvas-size {
  font-size: 0.875rem;
  color: #718096;
  font-family: 'Courier New', monospace;
}

.frame-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.aspect-ratio-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.aspect-ratio-selector label {
  font-weight: 500;
  color: #4a5568;
  font-size: 0.875rem;
}

.aspect-ratio-selector select {
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
}

.aspect-ratio-selector select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #3182ce;
}

.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 2rem;
  overflow: auto;
}
</style>
