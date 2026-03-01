<template>
  <div class="canvas-editor">
    <div class="editor-header">
      <div class="frame-info">
        <span class="frame-count">{{ frames.length }} frame{{ frames.length !== 1 ? 's' : '' }}</span>
        <span class="canvas-size">{{ totalWidth }}×{{ maxHeight }}px</span>
      </div>
      <div class="header-right">
        <div v-if="panorama" class="color-swatch-wrap" title="Background color">
          <div class="swatch-preview" :style="{ background: panorama.backgroundColor }"></div>
          <input
            type="color"
            class="color-input"
            :value="panorama.backgroundColor"
            @input="updateBgColor($event)"
          />
        </div>
        <div class="settings-wrap">
          <button class="settings-btn" @click="showSettings = !showSettings" title="Canvas settings">
            <i class="fa-solid fa-magnet"></i>
          </button>
          <div v-if="showSettings" class="settings-popover">
            <div class="settings-title">Canvas Settings</div>
            <label class="settings-row">
              <span>Snap to frame borders</span>
              <input type="checkbox" v-model="snapToBorders" />
            </label>
            <label class="settings-row">
              <span>Snap to other images</span>
              <input type="checkbox" v-model="snapToImages" />
            </label>
          </div>
          <div v-if="showSettings" class="settings-backdrop" @click="showSettings = false"></div>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePanorama } from '@/composables/usePanorama'
import { useSnapSettings } from '@/composables/useSnapSettings'
import PanoramaCanvas from './PanoramaCanvas.vue'
import ImageTray from './ImageTray.vue'

const { panorama, frames, totalWidth, maxHeight } = usePanorama()
const { snapToBorders, snapToImages } = useSnapSettings()

const showSettings = ref(false)

const updateBgColor = (event: Event) => {
  if (panorama.value) panorama.value.backgroundColor = (event.target as HTMLInputElement).value
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
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.color-swatch-wrap {
  position: relative;
  width: 24px;
  height: 24px;
  cursor: pointer;
  flex-shrink: 0;
}

.swatch-preview {
  width: 100%;
  height: 100%;
  border-radius: 5px;
  border: 2px solid #cbd5e0;
  box-sizing: border-box;
  pointer-events: none;
  transition: border-color 0.15s;
}

.color-swatch-wrap:hover .swatch-preview {
  border-color: #4299e1;
}

.color-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  padding: 0;
  border: none;
}

.settings-wrap {
  position: relative;
}

.settings-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #718096;
  font-size: 1rem;
  padding: 0.25rem 0.4rem;
  border-radius: 0.375rem;
  transition: color 0.15s, background 0.15s;
  display: flex;
  align-items: center;
}
.settings-btn:hover {
  color: #2d3748;
  background: #f7fafc;
}

.settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 19;
}

.settings-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  padding: 0.75rem;
  min-width: 220px;
  z-index: 20;
}

.settings-title {
  font-weight: 600;
  font-size: 0.85rem;
  color: #2d3748;
  margin-bottom: 0.6rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid #e2e8f0;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0;
  font-size: 0.85rem;
  color: #4a5568;
  cursor: pointer;
  user-select: none;
}
.settings-row input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: #4299e1;
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
