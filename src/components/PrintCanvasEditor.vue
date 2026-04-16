<template>
  <div class="print-canvas-editor">
    <div class="editor-header">
      <PrintSizePicker :model-value="activePrintSize" @update:model-value="setPrintSize" />
      <div class="header-right">
        <span class="canvas-size">{{ pixelW }}×{{ pixelH }}px @ {{ activePrintSize.dpi }} DPI</span>
        <button class="tmpl-btn" @click="openTemplate" title="Choose template">
          <i class="fa-solid fa-table-cells"></i> Template
        </button>
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

    <div class="canvas-container">
      <PanoramaCanvas
        v-if="printPanorama"
        ref="canvasRef"
        :panorama="printPanorama"
        :print-mode="true"
        @update="() => {}"
      />
    </div>

    <ImageTray @placed="() => {}" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { printSizeToAspectRatio } from '@/types'
import { usePrintProject } from '@/composables/usePrintProject'
import PanoramaCanvas from './PanoramaCanvas.vue'
import PrintSizePicker from './PrintSizePicker.vue'
import ImageTray from './ImageTray.vue'

const { activePrintSize, printPanorama, setPrintSize, updatePrintBackground } = usePrintProject()

const ar     = computed(() => printSizeToAspectRatio(activePrintSize.value))
const pixelW = computed(() => ar.value.width)
const pixelH = computed(() => ar.value.height)

const canvasRef = ref<InstanceType<typeof PanoramaCanvas> | null>(null)

const openTemplate = () => {
  const frame = printPanorama.value?.frames[0]
  if (frame) canvasRef.value?.openTemplatePicker(frame)
}

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
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.tmpl-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid #cbd5e0;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.8rem;
  color: #4a5568;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.tmpl-btn:hover {
  border-color: #667eea;
  background: #ebf4ff;
  color: #667eea;
}

.canvas-size {
  font-size: 0.75rem;
  color: #718096;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
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
