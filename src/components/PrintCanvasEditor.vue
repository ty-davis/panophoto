<template>
  <div class="print-canvas-editor">
    <div class="editor-header">
      <div class="print-info">
        <span class="print-size-label">{{ activePrintSize.label }}</span>
        <span class="canvas-size">{{ pixelW }}×{{ pixelH }}px @ {{ activePrintSize.dpi }} DPI</span>
      </div>
      <div class="header-right">
        <div v-if="printPanorama" class="color-swatch-wrap" title="Background color">
          <div class="swatch-preview" :style="{ background: printPanorama.backgroundColor }"></div>
          <input
            type="color"
            class="color-input"
            :value="printPanorama.backgroundColor"
            @input="updateBgColor($event)"
          />
        </div>
      </div>
    </div>

    <div class="size-picker-row">
      <PrintSizePicker :model-value="activePrintSize" @update:model-value="setPrintSize" />
    </div>

    <div class="canvas-container">
      <PanoramaCanvas
        v-if="printPanorama"
        :panorama="printPanorama"
        :print-mode="true"
        @update="() => {}"
      />
    </div>

    <ImageTray @placed="() => {}" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PrintSize } from '@/types'
import { printSizeToAspectRatio } from '@/types'
import { usePrintProject } from '@/composables/usePrintProject'
import PanoramaCanvas from './PanoramaCanvas.vue'
import PrintSizePicker from './PrintSizePicker.vue'
import ImageTray from './ImageTray.vue'

const { activePrintSize, printPanorama, setPrintSize, updatePrintBackground } = usePrintProject()

const ar     = computed(() => printSizeToAspectRatio(activePrintSize.value))
const pixelW = computed(() => ar.value.width)
const pixelH = computed(() => ar.value.height)

const updateBgColor = (event: Event) => {
  updatePrintBackground((event.target as HTMLInputElement).value)
}
</script>

<style scoped>
.print-canvas-editor {
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

.print-info {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.print-size-label {
  font-weight: 600;
  color: #2d3748;
  font-size: 1.125rem;
}

.canvas-size {
  font-size: 0.8rem;
  color: #718096;
  font-family: 'Courier New', monospace;
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

.color-swatch-wrap:hover .swatch-preview { border-color: #4299e1; }

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

.size-picker-row {
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
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
  .editor-header { padding: 0.5rem 0.75rem; }
  .canvas-container { padding: 0.75rem; }
}
</style>
